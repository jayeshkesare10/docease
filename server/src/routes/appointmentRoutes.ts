import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

const DEFAULT_SLOTS = [
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '12:00 PM - 12:30 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '03:30 PM - 04:00 PM',
  '04:00 PM - 04:30 PM',
  '04:30 PM - 05:00 PM'
];

// List eligible offices
router.get('/offices', (req: Request, res: Response): void => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const pinCode = typeof req.query.pinCode === 'string' ? req.query.pinCode.trim() : '';
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    let sql = 'SELECT * FROM offices WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
      sql += ' AND (category = ? OR category LIKE ?)';
      params.push(category, `%${category}%`);
    }

    if (city) {
      sql += ' AND LOWER(city) = LOWER(?)';
      params.push(city);
    }

    if (pinCode) {
      sql += ' AND pin_code = ?';
      params.push(pinCode);
    }

    if (query) {
      sql += ' AND (name LIKE ? OR address LIKE ? OR city LIKE ?)';
      const wildcard = `%${query}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY city ASC, name ASC';

    const offices = db.prepare(sql).all(...params);
    res.json(offices);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve offices.' });
  }
});

// Check available slots for an office on a given date
router.get('/slots', (req: Request, res: Response): void => {
  try {
    const officeId = Number(req.query.officeId);
    const dateStr = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    if (!officeId || !dateStr) {
      res.status(400).json({ error: 'Office ID and appointment date (YYYY-MM-DD) are required.' });
      return;
    }

    const office = db.prepare('SELECT * FROM offices WHERE id = ?').get(officeId) as any;
    if (!office) {
      res.status(404).json({ error: 'Office not found.' });
      return;
    }

    const selectedDate = new Date(`${dateStr}T00:00:00`);
    if (isNaN(selectedDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    // Check past date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      res.status(400).json({
        available: false,
        reason: 'Appointments cannot be booked for past dates.'
      });
      return;
    }

    // Check Saturday (6) or Sunday (0)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      res.status(200).json({
        available: false,
        office,
        date: dateStr,
        reason: 'Office is closed on weekends (Saturday & Sunday). Please select a working weekday (Monday to Friday).'
      });
      return;
    }

    // Check government holiday calendar
    const holiday = db.prepare(`
      SELECT * FROM holiday_calendars 
      WHERE holiday_date = ? AND (state IS NULL OR state = ?)
    `).get(dateStr, office.state) as any;

    if (holiday) {
      res.status(200).json({
        available: false,
        office,
        date: dateStr,
        reason: `Office is closed due to declared government holiday: ${holiday.holiday_name}.`
      });
      return;
    }

    // Fetch existing confirmed bookings for this office and date
    const existingBookings = db.prepare(`
      SELECT time_slot FROM appointments 
      WHERE office_id = ? AND appointment_date = ? AND status = 'confirmed'
    `).all(officeId, dateStr) as Array<{ time_slot: string }>;

    const bookedSlotSet = new Set(existingBookings.map(b => b.time_slot));

    const slotDetails = DEFAULT_SLOTS.map(slot => ({
      slot,
      isAvailable: !bookedSlotSet.has(slot)
    }));

    res.json({
      available: true,
      office,
      date: dateStr,
      totalSlots: slotDetails.length,
      availableSlotsCount: slotDetails.filter(s => s.isAvailable).length,
      slots: slotDetails
    });
  } catch (err: any) {
    console.error('Check slots error:', err);
    res.status(500).json({ error: 'Failed to retrieve slot availability.' });
  }
});

// Book an Appointment
router.post('/book', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { serviceId, officeId, appointmentDate, timeSlot, citizenNotes } = req.body;
    const userId = req.user!.id;

    if (!serviceId || !officeId || !appointmentDate || !timeSlot) {
      res.status(400).json({ error: 'Please select service, office, valid date, and time slot.' });
      return;
    }

    const office = db.prepare('SELECT * FROM offices WHERE id = ?').get(officeId) as any;
    if (!office) {
      res.status(404).json({ error: 'Selected office does not exist.' });
      return;
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId) as any;
    if (!service) {
      res.status(404).json({ error: 'Selected service does not exist.' });
      return;
    }

    const selectedDate = new Date(`${appointmentDate}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      res.status(400).json({ error: 'Appointments are not available on Saturdays or Sundays.' });
      return;
    }

    // Check holiday
    const holiday = db.prepare('SELECT * FROM holiday_calendars WHERE holiday_date = ?').get(appointmentDate) as any;
    if (holiday) {
      res.status(400).json({ error: `Selected date is a public holiday (${holiday.holiday_name}).` });
      return;
    }

    // Concurrency / duplicate booking check on server
    const slotTaken = db.prepare(`
      SELECT id FROM appointments 
      WHERE office_id = ? AND appointment_date = ? AND time_slot = ? AND status = 'confirmed'
    `).get(officeId, appointmentDate, timeSlot);

    if (slotTaken) {
      res.status(409).json({ error: 'This time slot was just booked by another citizen. Please select another slot.' });
      return;
    }

    // Check if user already has an active appointment for this service
    const existingUserAppt = db.prepare(`
      SELECT id, appointment_number FROM appointments 
      WHERE user_id = ? AND service_id = ? AND status = 'confirmed'
    `).get(userId, serviceId) as any;

    if (existingUserAppt) {
      res.status(400).json({
        error: `You already have an active booking (${existingUserAppt.appointment_number}) for this service. Please reschedule or cancel your previous booking first.`
      });
      return;
    }

    // Generate unique appointment number & opaque secure verification token
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const apptNumber = `DOC-${year}-${randomHex}`;
    const qrToken = `vtoken_${crypto.randomBytes(24).toString('hex')}`;

    const insert = db.prepare(`
      INSERT INTO appointments (
        appointment_number, user_id, service_id, office_id, appointment_date, time_slot, status, qr_token, citizen_notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
    `);

    const result = insert.run(
      apptNumber,
      userId,
      serviceId,
      officeId,
      appointmentDate,
      timeSlot,
      qrToken,
      citizenNotes || null
    );

    // Generate QR Code as Data URL
    // The QR contains only the opaque verification token reference, avoiding exposing PII directly in QR data
    const qrDataUrl = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'APPOINTMENT_BOOKED', 'appointment', String(result.lastInsertRowid), `Booked ${apptNumber} for ${service.title_en} on ${appointmentDate} at ${timeSlot}`);

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed successfully.',
      disclaimer: 'This appointment schedule is managed by DOCEASE Facilitation System. Please carry all original documents along with the QR code confirmation to the verification center.',
      appointment: {
        id: result.lastInsertRowid,
        appointment_number: apptNumber,
        service_title: service.title_en,
        office_name: office.name,
        office_address: office.address,
        office_city: office.city,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        status: 'confirmed',
        qr_token: qrToken,
        qr_data_url: qrDataUrl
      }
    });
  } catch (err: any) {
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Failed to confirm appointment booking.' });
  }
});

// Citizen: List My Appointments
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const appointments = db.prepare(`
      SELECT 
        a.*,
        s.title_en as service_title_en,
        s.title_hi as service_title_hi,
        s.title_mr as service_title_mr,
        s.slug as service_slug,
        o.name as office_name,
        o.address as office_address,
        o.city as office_city,
        o.phone as office_phone
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN offices o ON a.office_id = o.id
      WHERE a.user_id = ?
      ORDER BY a.appointment_date DESC, a.created_at DESC
    `).all(userId) as any[];

    // Attach generated QR code for confirmed appointments
    const enhanced = await Promise.all(
      appointments.map(async appt => {
        let qrDataUrl = null;
        if (appt.status === 'confirmed' && appt.qr_token) {
          try {
            qrDataUrl = await QRCode.toDataURL(appt.qr_token, {
              errorCorrectionLevel: 'H',
              margin: 2,
              width: 250,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
          } catch (e) {}
        }
        return {
          ...appt,
          qr_data_url: qrDataUrl
        };
      })
    );

    res.json(enhanced);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve appointment history.' });
  }
});

// Cancel Appointment
router.put('/:id/cancel', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const apptId = Number(req.params.id);
    const userId = req.user!.id;

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').get(apptId, userId) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    if (appt.status === 'cancelled') {
      res.status(400).json({ error: 'Appointment is already cancelled.' });
      return;
    }

    db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(apptId);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'APPOINTMENT_CANCELLED', 'appointment', String(apptId), `Cancelled booking ${appt.appointment_number}`);

    res.json({ success: true, message: 'Appointment has been cancelled and the slot has been released.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel appointment.' });
  }
});

// Reschedule Appointment
router.put('/:id/reschedule', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const apptId = Number(req.params.id);
    const { appointmentDate, timeSlot } = req.body;
    const userId = req.user!.id;

    if (!appointmentDate || !timeSlot) {
      res.status(400).json({ error: 'New appointment date and time slot are required.' });
      return;
    }

    const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?').get(apptId, userId) as any;
    if (!appt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Check slot availability
    const slotTaken = db.prepare(`
      SELECT id FROM appointments 
      WHERE office_id = ? AND appointment_date = ? AND time_slot = ? AND status = 'confirmed' AND id != ?
    `).get(appt.office_id, appointmentDate, timeSlot, apptId);

    if (slotTaken) {
      res.status(409).json({ error: 'The requested slot is already taken. Please pick another slot.' });
      return;
    }

    db.prepare(`
      UPDATE appointments 
      SET appointment_date = ?, time_slot = ?, status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(appointmentDate, timeSlot, apptId);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'APPOINTMENT_RESCHEDULED', 'appointment', String(apptId), `Rescheduled to ${appointmentDate} at ${timeSlot}`);

    res.json({ success: true, message: 'Appointment rescheduled successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reschedule appointment.' });
  }
});

export default router;

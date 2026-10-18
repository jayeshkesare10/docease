import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { Appointment, Office, ServiceSummary } from '../types';
import { MapComponent } from '../components/MapComponent';
import { 
  Calendar, 
  Clock, 
  Building2, 
  MapPin, 
  QrCode, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  FileCheck2, 
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface AppointmentsPageProps {
  onViewQRPass: (appt: Appointment) => void;
  preselectedServiceId?: number;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  onViewQRPass,
  preselectedServiceId
}) => {
  const { user, language, openAuthModal } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  
  // Booking Form State
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(preselectedServiceId);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [citizenNotes, setCitizenNotes] = useState<string>('');
  
  // Slot availability check state
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotData, setSlotData] = useState<any | null>(null);

  // Office filter state
  const [officeSearch, setOfficeSearch] = useState('');
  const [officeCity, setOfficeCity] = useState('');
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'book' | 'my'>(user ? 'book' : 'book');

  // Reschedule state
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // Initial load
  useEffect(() => {
    api.services.list().then(res => {
      setServices(res.services);
      if (!selectedServiceId && res.services.length > 0) {
        setSelectedServiceId(res.services[0].id);
      }
    }).catch(() => {});

    api.appointments.getOffices().then(setOffices).catch(() => {});

    if (user) {
      api.appointments.myAppointments().then(setAppointments).catch(() => {});
    }
  }, [user]);

  // When date or office changes, check slot availability
  useEffect(() => {
    if (!selectedOffice || !selectedDate) {
      setSlotData(null);
      return;
    }

    const checkSlots = async () => {
      setSlotsLoading(true);
      setBookingError('');
      try {
        const data = await api.appointments.getSlots(selectedOffice.id, selectedDate);
        setSlotData(data);
        if (!data.available) {
          setSelectedSlot('');
        }
      } catch (err: any) {
        setSlotData({ available: false, reason: err.message || 'Error checking slots.' });
      } finally {
        setSlotsLoading(false);
      }
    };

    checkSlots();
  }, [selectedOffice, selectedDate]);

  // Handle Booking Confirmation
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!selectedServiceId || !selectedOffice || !selectedDate || !selectedSlot) {
      setBookingError('Please select a service, facilitation office, date, and time slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await api.appointments.book({
        serviceId: selectedServiceId,
        officeId: selectedOffice.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        citizenNotes
      });

      // Reload appointments
      const updated = await api.appointments.myAppointments();
      setAppointments(updated);
      setBookingSuccess(res.appointment);
      onViewQRPass(res.appointment);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Cancel
  const handleCancelAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment? Your time slot will be released.')) return;
    try {
      await api.appointments.cancel(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  // Handle Reschedule Submit
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppt || !rescheduleDate || !rescheduleSlot) return;
    try {
      await api.appointments.reschedule(reschedulingAppt.id, rescheduleDate, rescheduleSlot);
      const updated = await api.appointments.myAppointments();
      setAppointments(updated);
      setReschedulingAppt(null);
      alert('Appointment rescheduled successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule.');
    }
  };

  // Min date today
  const minDate = new Date().toISOString().split('T')[0];
  // Max date +30 days
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const filteredOffices = offices.filter(o => {
    const matchesSearch = !officeSearch || o.name.toLowerCase().includes(officeSearch.toLowerCase()) || o.address.toLowerCase().includes(officeSearch.toLowerCase());
    const matchesCity = !officeCity || o.city.toLowerCase() === officeCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t('appointments', language)} & Office Locator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Schedule an appointment at a verified facilitation center. Double-booking prevention and QR token verification enabled.
          </p>
        </div>

        {/* Tab switcher */}
        {user && (
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'book' ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Book New Slot
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'my' ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>My Passes</span>
              <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 rounded-full font-bold">
                {appointments.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Official Booking Notice Banner (Requirement 9) */}
      <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <p>
          <strong>Notice:</strong> This appointment system is managed through the DOCEASE Facilitation Engine. Weekend dates (Saturday & Sunday) and declared gazetted holidays are strictly blocked. Carry all original documents and your QR Pass when visiting.
        </p>
      </div>

      {/* TAB: MY APPOINTMENTS */}
      {activeTab === 'my' && user && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-navy-900">
            Your Appointment History & QR Passes
          </h3>

          {appointments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {appt.appointment_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          appt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {appt.status}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-navy-950">
                        {appt.service_title_en}
                      </h4>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-600" />
                        <span>{appt.office_name} ({appt.office_city})</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {appt.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => onViewQRPass(appt)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>View QR Pass</span>
                          </button>

                          <button
                            onClick={() => setReschedulingAppt(appt)}
                            className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
                          >
                            Reschedule
                          </button>

                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date & Time pill */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-brand-600" />
                      <span>Date: {appt.appointment_date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                      <span>Slot: {appt.time_slot}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              You do not have any appointments yet. Select "Book New Slot" above to schedule.
            </div>
          )}
        </div>
      )}

      {/* TAB: BOOK NEW APPOINTMENT */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Booking Form */}
          <div className="lg:col-span-7 space-y-6">
            
            <form onSubmit={handleConfirmBooking} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <span>Schedule Verified Office Visit</span>
              </h2>

              {bookingError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Step 1: Select Service */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Select Documentation Service *
                </label>
                <select
                  value={selectedServiceId || ''}
                  onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50 font-medium"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.title_en} ({srv.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Office */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Select Facilitation Center / Office *
                </label>
                <select
                  value={selectedOffice?.id || ''}
                  onChange={(e) => {
                    const off = offices.find(o => o.id === Number(e.target.value));
                    setSelectedOffice(off || null);
                  }}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50 font-medium"
                >
                  <option value="">-- Choose an official center --</option>
                  {offices.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} - {off.city} ({off.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Date Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Select Appointment Date * (Mon - Fri Only)
                </label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50 font-medium"
                />
              </div>

              {/* Step 4: Time Slot Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    4. Select Available Time Slot *
                  </label>
                  {slotsLoading && (
                    <span className="text-[11px] text-brand-600 font-semibold animate-pulse">
                      Checking availability...
                    </span>
                  )}
                </div>

                {slotData ? (
                  !slotData.available ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                      {slotData.reason}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slotData.slots.map((s: any) => (
                        <button
                          key={s.slot}
                          type="button"
                          disabled={!s.isAvailable}
                          onClick={() => setSelectedSlot(s.slot)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                            !s.isAvailable
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : selectedSlot === s.slot
                              ? 'bg-brand-600 text-white border-brand-700 shadow-xs'
                              : 'bg-slate-50 hover:bg-brand-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {s.slot}
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Select an office and a date above to view real-time time slots.
                  </p>
                )}
              </div>

              {/* Step 5: Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Citizen Notes / Special Queries (Optional)
                </label>
                <textarea
                  rows={2}
                  value={citizenNotes}
                  onChange={(e) => setCitizenNotes(e.target.value)}
                  placeholder="e.g. Bringing minor child for biometric update..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingLoading || !selectedSlot}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {bookingLoading ? 'Securing Slot on Server...' : 'Confirm Appointment & Generate QR Pass'}
                <QrCode className="w-4 h-4" />
              </button>

            </form>

          </div>

          {/* Right Column: Office Finder Map & Directory */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              <span>Participating Offices Map</span>
            </h3>

            <MapComponent
              offices={filteredOffices}
              selectedOffice={selectedOffice}
              onSelectOffice={(off) => setSelectedOffice(off)}
              onBookOffice={(off) => setSelectedOffice(off)}
            />
          </div>

        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-900">
                Reschedule {reschedulingAppt.appointment_number}
              </h3>
              <button onClick={() => setReschedulingAppt(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Date (Mon - Fri)
                </label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Time Slot
                </label>
                <select
                  required
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="">-- Choose slot --</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

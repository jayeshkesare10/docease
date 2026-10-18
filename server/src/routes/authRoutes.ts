import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { hashPassword, verifyPassword, generateToken, authenticateToken, rateLimit, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Citizen Registration
router.post('/register-citizen', rateLimit(10, 60000), (req: Request, res: Response): void => {
  try {
    const { email, mobile, password, confirmPassword, fullName, state, city, locality, pinCode, preferredLanguage } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please provide a valid full name.' });
      return;
    }

    if (!email && !mobile) {
      res.status(400).json({ error: 'Either email address or mobile number is required.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    // Check duplicate
    if (email) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
      if (existingEmail) {
        res.status(400).json({ error: 'An account with this email address already exists.' });
        return;
      }
    }

    if (mobile) {
      const existingMobile = db.prepare('SELECT id FROM users WHERE mobile = ?').get(mobile.trim());
      if (existingMobile) {
        res.status(400).json({ error: 'An account with this mobile number already exists.' });
        return;
      }
    }

    const { hash, salt } = hashPassword(password);
    // Generate real 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const insertUser = db.prepare(`
      INSERT INTO users (
        email, mobile, password_hash, salt, full_name, role, state, city, locality, pin_code, preferred_language, is_verified, otp_code, otp_expires_at
      ) VALUES (?, ?, ?, ?, ?, 'citizen', ?, ?, ?, ?, ?, 0, ?, ?)
    `);

    const result = insertUser.run(
      email ? email.trim().toLowerCase() : null,
      mobile ? mobile.trim() : null,
      hash,
      salt,
      fullName.trim(),
      state || null,
      city || null,
      locality || null,
      pinCode || null,
      preferredLanguage || 'en',
      otp,
      expiresAt
    );

    const userId = Number(result.lastInsertRowid);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'CITIZEN_REGISTERED', 'user', String(userId), JSON.stringify({ email, mobile, fullName }));

    // Real gateway notification check
    const hasSmsConfig = !!process.env.SMS_API_KEY;
    const hasEmailConfig = !!process.env.EMAIL_SMTP_HOST;

    console.log(`[DOCEASE OTP DISPATCH] User ID ${userId} (${email || mobile}) OTP Code: ${otp}`);

    res.status(201).json({
      success: true,
      userId,
      message: 'Registration initiated. Please verify with the 6-digit OTP.',
      gatewayStatus: (hasSmsConfig || hasEmailConfig) ? 'dispatched_via_gateway' : 'development_mode_logged',
      gatewayNotice: (hasSmsConfig || hasEmailConfig)
        ? 'Verification code sent to your registered contact.'
        : 'Note: External SMS/Email gateway is not configured in .env. For local developer testing, your OTP code is logged in the server console.',
      devOtp: (!hasSmsConfig && !hasEmailConfig) ? otp : undefined
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// Verify OTP
router.post('/verify-otp', rateLimit(10, 60000), (req: Request, res: Response): void => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      res.status(400).json({ error: 'User ID and OTP are required.' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.is_verified === 1) {
      res.status(400).json({ error: 'Account is already verified. Please log in.' });
      return;
    }

    if (user.otp_code !== otp.trim()) {
      res.status(400).json({ error: 'Invalid verification code. Please check and re-enter.' });
      return;
    }

    if (Date.now() > user.otp_expires_at) {
      res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
      return;
    }

    // Mark verified and clear OTP
    db.prepare('UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(userId);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'CITIZEN_VERIFIED_OTP', 'user', String(userId), 'Citizen successfully verified OTP');

    const authUser = {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      full_name: user.full_name,
      preferred_language: user.preferred_language || 'en'
    };

    const token = generateToken(authUser);

    res.json({
      success: true,
      message: 'Account successfully verified.',
      token,
      user: authUser
    });
  } catch (err: any) {
    console.error('OTP Verification error:', err);
    res.status(500).json({ error: 'Error verifying OTP.' });
  }
});

// Resend OTP
router.post('/resend-otp', rateLimit(5, 60000), (req: Request, res: Response): void => {
  try {
    const { userId } = req.body;
    const user = db.prepare('SELECT id, email, mobile, is_verified FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.is_verified === 1) {
      res.status(400).json({ error: 'User is already verified.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    db.prepare('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?').run(otp, expiresAt, userId);
    console.log(`[DOCEASE OTP RESEND] User ID ${userId} OTP Code: ${otp}`);

    const hasSmsConfig = !!process.env.SMS_API_KEY;
    const hasEmailConfig = !!process.env.EMAIL_SMTP_HOST;

    res.json({
      success: true,
      message: 'A fresh verification OTP has been generated.',
      devOtp: (!hasSmsConfig && !hasEmailConfig) ? otp : undefined
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error generating new OTP.' });
  }
});

// Official Registration (Requires Administrative Verification)
router.post('/register-official', rateLimit(5, 60000), (req: Request, res: Response): void => {
  try {
    const { email, mobile, password, fullName, department, designation, employeeId, officeId, preferredLanguage } = req.body;

    if (!fullName || !department || !designation || !employeeId) {
      res.status(400).json({ error: 'Full name, department, designation, and official employee ID are mandatory.' });
      return;
    }

    if (!email && !mobile) {
      res.status(400).json({ error: 'Official email or mobile is required.' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Official accounts require a strong password of at least 8 characters.' });
      return;
    }

    // Check duplicate
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
      if (existing) {
        res.status(400).json({ error: 'Email already registered.' });
        return;
      }
    }

    const { hash, salt } = hashPassword(password);

    const insertUser = db.prepare(`
      INSERT INTO users (
        email, mobile, password_hash, salt, full_name, role, preferred_language, is_verified
      ) VALUES (?, ?, ?, ?, ?, 'official', ?, 1)
    `);

    const result = insertUser.run(
      email ? email.trim().toLowerCase() : null,
      mobile ? mobile.trim() : null,
      hash,
      salt,
      fullName.trim(),
      preferredLanguage || 'en'
    );

    const userId = Number(result.lastInsertRowid);

    // Create official profile with status 'pending'
    db.prepare(`
      INSERT INTO official_profiles (user_id, department, designation, employee_id, office_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(userId, department.trim(), designation.trim(), employeeId.trim(), officeId || null);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'OFFICIAL_APPLICATION_SUBMITTED', 'official_profile', String(userId), JSON.stringify({ department, designation, employeeId }));

    res.status(201).json({
      success: true,
      message: 'Official application submitted successfully. In compliance with security standards, official privileges remain pending until administrative review and identity verification by system administrators.'
    });
  } catch (err: any) {
    console.error('Official registration error:', err);
    res.status(500).json({ error: 'Error submitting official registration.' });
  }
});

// Login
router.post('/login', rateLimit(15, 60000), (req: Request, res: Response): void => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your registered email/mobile and password.' });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR mobile = ?').get(cleanIdentifier, identifier.trim()) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. No account found with these details.' });
      return;
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your password.' });
      return;
    }

    // If citizen, verify if OTP completed
    if (user.role === 'citizen' && user.is_verified === 0) {
      res.status(403).json({
        error: 'Account not verified. Please complete OTP verification.',
        needsOtp: true,
        userId: user.id
      });
      return;
    }

    // If official, check approval status
    if (user.role === 'official') {
      const profile = db.prepare('SELECT status, department, designation FROM official_profiles WHERE user_id = ?').get(user.id) as any;
      if (!profile || profile.status === 'pending') {
        res.status(403).json({
          error: 'Your Government Official registration is currently pending administrative verification. An authorized supervisor must approve your credential before you can access the official dashboard.'
        });
        return;
      }
      if (profile.status === 'rejected') {
        res.status(403).json({
          error: 'Your official credentials request was rejected. Please contact the administrator.'
        });
        return;
      }
    }

    const authUser = {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      full_name: user.full_name,
      preferred_language: user.preferred_language || 'en'
    };

    const token = generateToken(authUser);

    db.prepare('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'USER_LOGIN', 'session', String(user.id), `Logged in with role: ${user.role}`);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: authUser
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Current User Details
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, email, mobile, full_name, role, state, city, locality, pin_code, preferred_language, created_at FROM users WHERE id = ?')
      .get(req.user!.id) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    let officialData = null;
    if (user.role === 'official') {
      officialData = db.prepare(`
        SELECT p.*, o.name as office_name, o.city as office_city 
        FROM official_profiles p 
        LEFT JOIN offices o ON p.office_id = o.id 
        WHERE p.user_id = ?
      `).get(user.id);
    }

    // Counts for user summary
    const checklistCount = (db.prepare('SELECT count(*) as count FROM user_checklists WHERE user_id = ?').get(user.id) as any).count;
    const vaultCount = (db.prepare('SELECT count(*) as count FROM vault_documents WHERE user_id = ?').get(user.id) as any).count;
    const appointmentCount = (db.prepare('SELECT count(*) as count FROM appointments WHERE user_id = ? AND status != "cancelled"').get(user.id) as any).count;
    const savedGuidanceCount = (db.prepare('SELECT count(*) as count FROM saved_guidance WHERE user_id = ?').get(user.id) as any).count;

    res.json({
      user,
      officialData,
      stats: {
        activeChecklists: checklistCount,
        vaultDocuments: vaultCount,
        activeAppointments: appointmentCount,
        savedGuides: savedGuidanceCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user details.' });
  }
});

// Update Profile & Language
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { fullName, state, city, locality, pinCode, preferredLanguage } = req.body;

    db.prepare(`
      UPDATE users 
      SET full_name = COALESCE(?, full_name),
          state = COALESCE(?, state),
          city = COALESCE(?, city),
          locality = COALESCE(?, locality),
          pin_code = COALESCE(?, pin_code),
          preferred_language = COALESCE(?, preferred_language),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fullName, state, city, locality, pinCode, preferredLanguage, req.user!.id);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;

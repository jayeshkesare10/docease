import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const vaultDir = path.resolve(dataDir, 'vault_storage');
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'docease.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      mobile TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citizen', 'official', 'admin')),
      state TEXT,
      city TEXT,
      locality TEXT,
      pin_code TEXT,
      preferred_language TEXT DEFAULT 'en',
      is_verified INTEGER DEFAULT 0,
      otp_code TEXT,
      otp_expires_at INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS official_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      office_id INTEGER,
      identity_proof_file TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER REFERENCES users(id),
      approved_at TEXT,
      rejection_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      lat REAL,
      lng REAL,
      operating_hours TEXT,
      appointment_required INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS holiday_calendars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      holiday_date TEXT NOT NULL,
      holiday_name TEXT NOT NULL,
      state TEXT
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      title_mr TEXT NOT NULL,
      subtitle_en TEXT,
      subtitle_hi TEXT,
      subtitle_mr TEXT,
      description_en TEXT NOT NULL,
      description_hi TEXT NOT NULL,
      description_mr TEXT NOT NULL,
      eligibility_en TEXT NOT NULL,
      eligibility_hi TEXT NOT NULL,
      eligibility_mr TEXT NOT NULL,
      conditions_en TEXT,
      conditions_hi TEXT,
      conditions_mr TEXT,
      fees_info_en TEXT,
      fees_info_hi TEXT,
      fees_info_mr TEXT,
      processing_time_en TEXT,
      processing_time_hi TEXT,
      processing_time_mr TEXT,
      procedure_steps_json TEXT NOT NULL,
      official_source_name TEXT NOT NULL,
      official_source_url TEXT NOT NULL,
      last_verified_date TEXT NOT NULL,
      verification_status TEXT DEFAULT 'verified',
      applicable_office_category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      name_mr TEXT NOT NULL,
      purpose_en TEXT NOT NULL,
      purpose_hi TEXT NOT NULL,
      purpose_mr TEXT NOT NULL,
      requirement_type TEXT DEFAULT 'mandatory' CHECK(requirement_type IN ('mandatory', 'conditional', 'optional')),
      accepted_alternatives_json TEXT,
      format_conditions_en TEXT,
      format_conditions_hi TEXT,
      format_conditions_mr TEXT,
      how_to_obtain_json TEXT,
      order_num INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed')),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checklist_id INTEGER NOT NULL REFERENCES user_checklists(id) ON DELETE CASCADE,
      requirement_id INTEGER NOT NULL REFERENCES service_requirements(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'missing' CHECK(status IN ('available', 'missing', 'not_applicable')),
      user_notes TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(checklist_id, requirement_id)
    );

    CREATE TABLE IF NOT EXISTS vault_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id),
      office_id INTEGER NOT NULL REFERENCES offices(id),
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
      qr_token TEXT UNIQUE NOT NULL,
      citizen_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qr_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id),
      verified_by_user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL,
      notes TEXT,
      verified_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saved_guidance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query_text TEXT NOT NULL,
      category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      report_type TEXT NOT NULL,
      query_text TEXT,
      details TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'reviewed', 'resolved')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
    CREATE INDEX IF NOT EXISTS idx_requirements_service ON service_requirements(service_id);
    CREATE INDEX IF NOT EXISTS idx_checklists_user ON user_checklists(user_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(office_id, appointment_date, time_slot);
    CREATE INDEX IF NOT EXISTS idx_appointments_qr ON appointments(qr_token);
    CREATE INDEX IF NOT EXISTS idx_vault_user ON vault_documents(user_id);
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if services are already seeded
  const existingService = db.prepare('SELECT count(*) as count FROM services').get() as { count: number };
  if (existingService && existingService.count > 0) {
    return;
  }

  console.log('Seeding official documentation guidance, offices, and holiday calendars...');

  // 1. Seed Offices
  const insertOffice = db.prepare(`
    INSERT INTO offices (name, category, address, city, state, pin_code, phone, email, lat, lng, operating_hours, appointment_required)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const officesList = [
    ['Passport Seva Kendra (PSK) Andheri', 'Passport Office', 'Trade Centre, B-Wing, Ground Floor, Bandra Kurla Complex / Andheri East Link', 'Mumbai', 'Maharashtra', '400069', '022-26578000', 'psk.mumbai@passportindia.gov.in', 19.1136, 72.8697, '09:00 AM - 05:00 PM (Mon-Fri)', 1],
    ['Passport Seva Kendra (PSK) Pune', 'Passport Office', 'Zero One Building, Pingale Wasti, Mundhwa-Kharadi Road', 'Pune', 'Maharashtra', '411036', '020-25679900', 'psk.pune@passportindia.gov.in', 18.5358, 73.9182, '09:00 AM - 05:00 PM (Mon-Fri)', 1],
    ['Aadhaar Seva Kendra (ASK) Lower Parel', 'Aadhaar Center', 'Shop No. 12, High Street Phoenix Compound, Lower Parel', 'Mumbai', 'Maharashtra', '400013', '1947', 'help@uidai.gov.in', 18.9950, 72.8258, '09:30 AM - 05:30 PM (Mon-Fri)', 1],
    ['Aadhaar Seva Kendra (ASK) Kothrud', 'Aadhaar Center', 'City Pride Complex, Paud Road, Kothrud', 'Pune', 'Maharashtra', '411038', '1947', 'help@uidai.gov.in', 18.5074, 73.8077, '09:30 AM - 05:30 PM (Mon-Fri)', 1],
    ['Tahsil & Citizen Facilitation Center (Setu Kendra) Pune City', 'Revenue & Tehsil Office', 'Collector Office Compound, Station Road', 'Pune', 'Maharashtra', '411001', '020-26123456', 'collector.pune@maharashtra.gov.in', 18.5284, 73.8739, '10:00 AM - 05:00 PM (Mon-Fri)', 1],
    ['Tahsil Office & Setu Kendra Andheri', 'Revenue & Tehsil Office', 'Administrative Building, Near Andheri Railway Station (West)', 'Mumbai', 'Maharashtra', '400058', '022-26234567', 'tahsildar.andheri@gov.in', 19.1197, 72.8464, '10:00 AM - 05:00 PM (Mon-Fri)', 1],
    ['Regional Transport Office (RTO) Mumbai West (MH-02)', 'RTO Office', 'Four Bungalows, D.N. Nagar, Andheri West', 'Mumbai', 'Maharashtra', '400053', '022-26362252', 'mh02@mahatranscom.in', 19.1310, 72.8272, '09:30 AM - 05:00 PM (Mon-Fri)', 1],
    ['Regional Transport Office (RTO) Pune (MH-12)', 'RTO Office', 'Near Sangam Bridge, Pune Railway Station Road', 'Pune', 'Maharashtra', '411001', '020-26058080', 'mh12@mahatranscom.in', 18.5308, 73.8643, '09:30 AM - 05:00 PM (Mon-Fri)', 1],
    ['Municipal Corporation Ward Office (Health & Civil Registration)', 'Municipal Corporation', 'K/East Ward Office, Azad Road, Gundavali, Andheri East', 'Mumbai', 'Maharashtra', '400069', '022-26840103', 'citizenportal@mcgm.gov.in', 19.1170, 72.8550, '10:00 AM - 04:30 PM (Mon-Fri)', 1]
  ];

  for (const off of officesList) {
    insertOffice.run(...off);
  }

  // 2. Seed Verified Government Holiday Calendar
  const insertHoliday = db.prepare(`
    INSERT INTO holiday_calendars (holiday_date, holiday_name, state)
    VALUES (?, ?, ?)
  `);

  const holidays = [
    ['2026-01-26', 'Republic Day', null],
    ['2026-03-04', 'Holi / Dhulivandan', 'Maharashtra'],
    ['2026-03-20', 'Gudi Padwa', 'Maharashtra'],
    ['2026-04-14', 'Dr. Babasaheb Ambedkar Jayanti', null],
    ['2026-05-01', 'Maharashtra Day / Labour Day', 'Maharashtra'],
    ['2026-08-15', 'Independence Day', null],
    ['2026-09-14', 'Ganesh Chaturthi', 'Maharashtra'],
    ['2026-10-02', 'Mahatma Gandhi Jayanti', null],
    ['2026-10-20', 'Dussehra (Vijayadashami)', null],
    ['2026-11-08', 'Diwali (Laxmi Pujan)', null],
    ['2026-11-10', 'Diwali (Bhaubeej)', null],
    ['2026-12-25', 'Christmas Day', null]
  ];

  for (const h of holidays) {
    insertHoliday.run(h[0], h[1], h[2]);
  }

  // 3. Seed Verified Services & Requirements
  const insertService = db.prepare(`
    INSERT INTO services (
      slug, category, title_en, title_hi, title_mr, subtitle_en, subtitle_hi, subtitle_mr,
      description_en, description_hi, description_mr,
      eligibility_en, eligibility_hi, eligibility_mr,
      conditions_en, conditions_hi, conditions_mr,
      fees_info_en, fees_info_hi, fees_info_mr,
      processing_time_en, processing_time_hi, processing_time_mr,
      procedure_steps_json, official_source_name, official_source_url,
      last_verified_date, verification_status, applicable_office_category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReq = db.prepare(`
    INSERT INTO service_requirements (
      service_id, name_en, name_hi, name_mr, purpose_en, purpose_hi, purpose_mr,
      requirement_type, accepted_alternatives_json, format_conditions_en, format_conditions_hi, format_conditions_mr,
      how_to_obtain_json, order_num
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Service 1: Indian Passport (Fresh / Re-issue)
  const passportRes = insertService.run(
    'passport-fresh-reissue',
    'Passport & Travel',
    'Indian Passport (Fresh / Re-issue)',
    'भारतीय पासपोर्ट (नया / पुन: जारी)',
    'भारतीय पासपोर्ट (नवीन / नूतनीकरण)',
    'Official document for international travel and citizenship proof',
    'अंतर्राष्ट्रीय यात्रा और नागरिकता प्रमाण के लिए आधिकारिक दस्तावेज',
    'आंतरराष्ट्रीय प्रवास आणि नागरिकत्व पुराव्यासाठी अधिकृत दस्तऐवज',
    'An Indian Passport is issued by the Ministry of External Affairs, Government of India to Indian citizens for international travel and serves as primary proof of Indian citizenship.',
    'भारतीय पासपोर्ट भारत सरकार के विदेश मंत्रालय द्वारा भारतीय नागरिकों को अंतर्राष्ट्रीय यात्रा के लिए जारी किया जाता है और यह भारतीय नागरिकता का प्राथमिक प्रमाण है।',
    'भारतीय पासपोर्ट हे भारत सरकारच्या परराष्ट्र मंत्रालयाद्वारे भारतीय नागरिकांना आंतरराष्ट्रीय प्रवासासाठी दिले जाते आणि ते भारतीय नागरिकत्वाचा प्राथमिक पुरावा म्हणून कार्य करते.',
    'Any citizen of India by birth or naturalization without criminal disqualifications or pending travel bans.',
    'जन्म या देशीयकरण द्वारा भारत का कोई भी नागरिक जिसके विरुद्ध कोई आपराधिक अयोग्यता या यात्रा प्रतिबंध लंबित न हो।',
    'जन्म किंवा नोंदणीद्वारे भारताचा कोणताही नागरिक ज्याच्यावर कोणताही फौजदारी गुन्हा किंवा प्रवास बंदी प्रलंबित नाही.',
    'Must hold verified proof of address, proof of date of birth, and identity documentation. Minors require parental consent.',
    'पते का सत्यापित प्रमाण, जन्म तिथि का प्रमाण और पहचान दस्तावेज होना आवश्यक है। अवयस्कों के लिए माता-पिता की सहमति आवश्यक है।',
    'पत्ता पुरावा, जन्मतारीख पुरावा आणि ओळख दस्तऐवज असणे आवश्यक आहे. अल्पवयीन मुलांसाठी पालकांची संमती आवश्यक आहे.',
    '₹1,500 (36-page normal fresh passport, 10-year validity), ₹2,000 (60-page booklet), ₹3,500 (Tatkaal 36 pages).',
    '₹1,500 (36-पृष्ठ सामान्य नया पासपोर्ट, 10 वर्ष वैधता), ₹2,000 (60-पृष्ठ), ₹3,500 (तत्काल 36 पृष्ठ)।',
    '₹१,५०० (३६ पानांचे नियमित नवीन पासपोर्ट, १० वर्षे वैधता), ₹२,००० (६० पाने), ₹३,५०० (तत्काळ ३६ पाने).',
    'Normal: 15-30 working days following police verification. Tatkaal: 1-3 working days.',
    'सामान्य: पुलिस सत्यापन के बाद 15-30 कार्य दिवस। तत्काल: 1-3 कार्य दिवस।',
    'नियमित: पोलीस पडताळणीनंतर १५ ते ३० कामकाजाचे दिवस. तत्काळ: १ ते ३ कामकाजाचे दिवस.',
    JSON.stringify([
      { step: 1, title_en: 'Register on Passport Seva Portal', title_hi: 'पासपोर्ट सेवा पोर्टल पर पंजीकरण करें', title_mr: 'पासपोर्ट सेवा पोर्टलवर नोंदणी करा', desc_en: 'Create an account on the official Passport Seva Online Portal (passportindia.gov.in).', desc_hi: 'आधिकारिक पासपोर्ट सेवा ऑनलाइन पोर्टल (passportindia.gov.in) पर खाता बनाएं।', desc_mr: 'अधिकृत पासपोर्ट सेवा ऑनलाइन पोर्टल (passportindia.gov.in) वर खाते तयार करा.' },
      { step: 2, title_en: 'Fill Online Application Form', title_hi: 'ऑनलाइन आवेदन पत्र भरें', title_mr: 'ऑनलाइन अर्ज भरा', desc_en: 'Select Apply for Fresh Passport / Re-issue of Passport and accurately enter personal details matching your supporting documents.', desc_hi: 'नया पासपोर्ट / पुन: जारी करने का विकल्प चुनें और अपने दस्तावेजों के अनुसार व्यक्तिगत विवरण दर्ज करें।', desc_mr: 'नवीन पासपोर्ट / नूतनीकरण निवडा आणि कागदपत्रांशी जुळणारे वैयक्तिक तपशील अचूक भरा.' },
      { step: 3, title_en: 'Pay Fee & Schedule PSK Appointment', title_hi: 'शुल्क भुगतान और पीएसके स्लॉट बुक करें', title_mr: 'शुल्क भरा आणि पीएसके वेळ निवडा', desc_en: 'Make online payment through SBI ePay/Credit/Debit/Net Banking and select your nearest Passport Seva Kendra (PSK/POPSK).', desc_hi: 'ऑनलाइन भुगतान करें और अपने निकटतम पासपोर्ट सेवा केंद्र में अपॉइंटमेंट बुक करें।', desc_mr: 'ऑनलाइन शुल्क भरा आणि जवळच्या पासपोर्ट सेवा केंद्रामध्ये अपॉइंटमेंट बुक करा.' },
      { step: 4, title_en: 'Visit PSK for Biometrics & Document Verification', title_hi: 'दस्तावेज सत्यापन और बायोमेट्रिक्स के लिए पीएसके जाएं', title_mr: 'कागदपत्र पडताळणी आणि बायोमेट्रिक्ससाठी पीएसकेला भेट द्या', desc_en: 'Carry original documents along with self-attested photocopies. Biometrics, photograph, and document verification happen at Counter A, B, and C.', desc_hi: 'मूल दस्तावेज और स्व-प्रमाणित फोटोकॉपी साथ ले जाएं। काउंटर A, B और C पर सत्यापन होगा।', desc_mr: 'मूळ कागदपत्रे आणि स्वाक्षरी केलेल्या प्रती सोबत घ्या. काउंटर A, B आणि C वर तपासणी केली जाईल.' },
      { step: 5, title_en: 'Police Verification', title_hi: 'पुलिस सत्यापन', title_mr: 'पोलीस पडताळणी', desc_en: 'Local police station officer will verify residential details or invite applicant with address proofs.', desc_hi: 'स्थानीय पुलिस थाना अधिकारी पते का सत्यापन करेगा या आवेदक को आमंत्रित करेगा।', desc_mr: 'स्थानिक पोलीस ठाण्यातील अधिकारी निवासस्थानाची प्रत्यक्ष पडताळणी करतील.' },
      { step: 6, title_en: 'Dispatch via Speed Post', title_hi: 'स्पीड पोस्ट से पासपोर्ट प्राप्त करें', title_mr: 'स्पीड पोस्टने पासपोर्ट मिळवा', desc_en: 'Passport is printed by India Security Press and dispatched to your registered address via Speed Post.', desc_hi: 'पासपोर्ट प्रिंट होकर स्पीड पोस्ट द्वारा आपके पंजीकृत पते पर भेजा जाएगा।', desc_mr: 'पासपोर्ट मुद्रित होऊन थेट तुमच्या नोंदणीकृत पत्त्यावर स्पीड पोस्टने पोहोचवला जातो.' }
    ]),
    'Ministry of External Affairs (Consular, Passport & Visa Division)',
    'https://www.passportindia.gov.in',
    '2026-02-15',
    'verified',
    'Passport Office'
  );

  const passportId = Number(passportRes.lastInsertRowid);

  insertReq.run(
    passportId,
    'Proof of Present Address',
    'वर्तमान पते का प्रमाण',
    'सध्याच्या पत्त्याचा पुरावा',
    'To establish applicant residence within the jurisdiction of the Regional Passport Office.',
    'क्षेत्रीय पासपोर्ट कार्यालय के अधिकार क्षेत्र में आवेदक के निवास को स्थापित करना।',
    'प्रादेशिक पासपोर्ट कार्यालयाच्या अधिकारक्षेत्रातील निवासस्थान सिद्ध करण्यासाठी.',
    'mandatory',
    JSON.stringify([
      'Aadhaar Card (with current residential address)',
      'Electricity Bill (not older than 3 months, in applicant or parent/spouse name)',
      'Water Bill (not older than 3 months)',
      'Active Bank Passbook of Scheduled Bank (with photo & stamped by bank)',
      'Registered Rent Agreement (minimum 1 year tenure)',
      'Spouse’s Passport copy (first and last page mentioning applicant’s address)'
    ]),
    'Original document required along with 2 self-attested copies.',
    'मूल दस्तावेज और 2 स्व-प्रमाणित प्रतियां आवश्यक हैं।',
    'मूळ दस्तऐवज आणि २ स्व-स्वाक्षरी केलेल्या छायाप्रती आवश्यक आहेत.',
    JSON.stringify({
      apply_where: 'Aadhaar update center, Bank branch, or Electricity provider',
      required_docs: 'Identity proof or Rent Agreement',
      official_url: 'https://myaadhaar.uidai.gov.in',
      fee: '₹50 for Aadhaar address update',
      processing_time: '5-10 working days',
      next_action: 'Update your address on Aadhaar or obtain an updated bank statement with stamp.'
    }),
    1
  );

  insertReq.run(
    passportId,
    'Proof of Date of Birth (DOB)',
    'जन्म तिथि का प्रमाण (DOB)',
    'जन्मतारखेचा पुरावा (DOB)',
    'To establish applicant age and date of birth officially.',
    'आवेदक की आयु और जन्म तिथि आधिकारिक रूप से स्थापित करने के लिए।',
    'आवेदकाचे अधिकृत वय आणि जन्मतारीख सिद्ध करण्यासाठी.',
    'mandatory',
    JSON.stringify([
      'Birth Certificate issued by Registrar of Births and Deaths / Municipal Corporation',
      'School Leaving Certificate / Secondary School Transfer Certificate mentioning DOB',
      'PAN Card issued by Income Tax Department',
      'Driving Licence issued by RTO Transport Department',
      'Policy Bond issued by Public Life Insurance Corporations'
    ]),
    'Must clearly indicate Day, Month, and Year of birth.',
    'जन्म का दिन, महीना और वर्ष स्पष्ट रूप से लिखा होना चाहिए।',
    'जन्माचा दिवस, महिना आणि वर्ष स्पष्टपणे नमूद असणे आवश्यक आहे.',
    JSON.stringify({
      apply_where: 'Local Municipal Corporation (CRS Portal) or Digilocker for School Certificate',
      required_docs: 'Hospital discharge slip or affidavit',
      official_url: 'https://crsorgi.gov.in',
      fee: '₹20-₹100 depending on state',
      processing_time: '7-15 days',
      next_action: 'Apply for a duplicate Birth Certificate from your birthplace municipality or use your 10th marksheet/leaving certificate.'
    }),
    2
  );

  insertReq.run(
    passportId,
    'Non-ECR (Emigration Check Not Required) Proof',
    'नॉन-ईसीआर (Non-ECR) प्रमाण',
    'नॉन-ईसीआर (इमिग्रेशन चेक आवश्यक नाही) पुरावा',
    'Required for passport without emigration clearance stamps when traveling abroad for employment.',
    'रोजगार के लिए विदेश यात्रा करते समय उत्प्रवास मंजूरी के बिना पासपोर्ट के लिए आवश्यक।',
    'रोजगारासाठी परदेशात जाताना इमिग्रेशन तपासणीतून सूट मिळण्यासाठी आवश्यक.',
    'conditional',
    JSON.stringify([
      'Educational Certificate of 10th Standard / Matriculation pass or higher degree',
      'Income Tax Assessment orders / return receipts for past 1 year',
      'Persons holding professional degrees (Doctors, Engineers, Lawyers, CA)'
    ]),
    'Original Passing Certificate or Marksheet with English/Hindi translation if in regional language.',
    'मूल उत्तीर्ण प्रमाण पत्र या मार्कशीट।',
    'मूळ उत्तीर्ण प्रमाणपत्र किंवा गुणपत्रिका.',
    JSON.stringify({
      apply_where: 'Your Education Board (CBSE, ICSE, State Board) or DigiLocker',
      required_docs: 'Admit card or Hall ticket or duplicate application',
      official_url: 'https://www.digilocker.gov.in',
      fee: 'Free via DigiLocker / Board nominal fee for duplicate',
      processing_time: 'Instant on DigiLocker',
      next_action: 'Fetch your 10th or 12th standard passing certificate digitally through DigiLocker.'
    }),
    3
  );

  // Service 2: Aadhaar Card (Update / New Enrollment)
  const aadhaarRes = insertService.run(
    'aadhaar-enrollment-update',
    'Identity & Citizenship',
    'Aadhaar Card (Update & New Enrollment)',
    'आधार कार्ड (अपडेट और नया नामांकन)',
    'आधार कार्ड (नवीन नोंदणी आणि दुरुस्ती)',
    '12-digit biometric identity card issued by UIDAI for Indian residents',
    'भारतीय निवासियों के लिए यूआईडीएआई द्वारा जारी 12-अंकों का बायोमेट्रिक पहचान पत्र',
    'भारतीय रहिवाशांसाठी यूआयडीएआय द्वारे जारी केलेले १२ अंकी बायोमेट्रिक ओळखपत्र',
    'Aadhaar is a verifiable 12-digit identification number issued by UIDAI. It serves as primary proof of identity and address across India.',
    'आधार यूआईडीएआई द्वारा जारी एक सत्यापन योग्य 12-अंकीय पहचान संख्या है। यह पूरे भारत में पहचान और पते का प्राथमिक प्रमाण है।',
    'आधार हा यूआयडीएआय द्वारे जारी केलेला १२ अंकी पडताळणीयोग्य क्रमांक आहे. हा देशभरात ओळख आणि पत्त्याचा मुख्य पुरावा मानला जातो.',
    'Any resident in India who has resided for 182 days or more in the preceding 12 months, including newborns.',
    'भारत का कोई भी निवासी जो पिछले 12 महीनों में 182 दिन या उससे अधिक समय से रहा हो, जिसमें नवजात शिशु भी शामिल हैं।',
    'मागील १२ महिन्यांत १८२ दिवस किंवा त्याहून अधिक काळ भारतात राहिलेला कोणताही रहिवासी, ज्यामध्ये नवजात बालकांचाही समावेश आहे.',
    'Documentary proof of Identity (PoI), proof of Address (PoA), proof of Date of Birth (DoB), and proof of Relationship (PoR) where applicable.',
    'पहचान का प्रमाण (PoI), पते का प्रमाण (PoA), जन्म तिथि का प्रमाण (DoB) आवश्यक है।',
    'ओळख पुरावा (PoI), पत्ता पुरावा (PoA), जन्मतारीख पुरावा (DoB) आवश्यक आहे.',
    'New Enrollment: FREE. Biometric update: ₹100. Demographic update (Name/Address/Mobile): ₹50.',
    'नया नामांकन: मुफ़्त। बायोमेट्रिक अपडेट: ₹100। जनसांख्यिकीय अपडेट (नाम/पता): ₹50।',
    'नवीन नोंदणी: मोफत. बायोमेट्रिक अपडेट: ₹१००. नाव/पत्ता बदल: ₹५०.',
    '5 to 15 working days following update at enrollment center.',
    'नामांकन केंद्र पर अपडेट के 5 से 15 कार्य दिवस।',
    'नोंदणी केंद्रावरील प्रक्रियेनंतर ५ ते १५ कामकाजाचे दिवस.',
    JSON.stringify([
      { step: 1, title_en: 'Locate Nearest Aadhaar Seva Kendra (ASK)', title_hi: 'निकटतम आधार सेवा केंद्र खोजें', title_mr: 'जवळचे आधार सेवा केंद्र शोधा', desc_en: 'Find an authorized ASK or bank/post office branch via uidai.gov.in or DOCEASE office finder.', desc_hi: 'uidai.gov.in या DOCEASE ऑफिस फाइंडर के माध्यम से अधिकृत आधार केंद्र खोजें।', desc_mr: 'uidai.gov.in किंवा DOCEASE द्वारे अधिकृत आधार सेवा केंद्र शोधा.' },
      { step: 2, title_en: 'Book Online Appointment (Optional)', title_hi: 'ऑनलाइन अपॉइंटमेंट बुक करें', title_mr: 'ऑनलाइन वेळ आरक्षित करा', desc_en: 'Book a slot on myaadhaar.uidai.gov.in to avoid long waiting queues.', desc_hi: 'लंबी कतारों से बचने के लिए myaadhaar.uidai.gov.in पर स्लॉट बुक करें।', desc_mr: 'रांगेत थांबणे टाळण्यासाठी myaadhaar.uidai.gov.in वर वेळ आरक्षित करा.' },
      { step: 3, title_en: 'Submit Biometrics and Proofs', title_hi: 'बायोमेट्रिक्स और दस्तावेज जमा करें', title_mr: 'बायोमेट्रिक्स आणि कागदपत्रे जमा करा', desc_en: 'Provide fingerprint scans, iris scans, live photo, and verified supporting documents.', desc_hi: 'फिंगरप्रिंट स्कैन, आईरिस स्कैन, लाइव फोटो और दस्तावेज प्रदान करें।', desc_mr: 'बोटांचे ठसे, डोळ्यांचे स्कॅन, प्रत्यक्ष छायाचित्र आणि मूळ कागदपत्रे सादर करा.' },
      { step: 4, title_en: 'Receive Acknowledgement Slip (EID)', title_hi: 'पावती पर्ची (EID) प्राप्त करें', title_mr: 'नोंदणी पावती (EID) मिळवा', desc_en: 'Keep the 28-digit Enrollment ID slip safe to track your update status online.', desc_hi: 'ऑनलाइन स्थिति ट्रैक करने के लिए 28-अंकीय नामांकन आईडी पर्ची सुरक्षित रखें।', desc_mr: 'स्थिती तपासण्यासाठी २८ अंकी नोंदणी पावती सुरक्षित ठेवा.' },
      { step: 5, title_en: 'Download Electronic Aadhaar (e-Aadhaar)', title_hi: 'ई-आधार डाउनलोड करें', title_mr: 'ई-आधार डाउनलोड करा', desc_en: 'Once generated, download password-protected PDF e-Aadhaar from myaadhaar.uidai.gov.in.', desc_hi: 'तैयार होने पर myaadhaar.uidai.gov.in से पासवर्ड-संरक्षित ई-आधार डाउनलोड करें।', desc_mr: 'प्रक्रिया पूर्ण झाल्यावर myaadhaar.uidai.gov.in वरून डिजिटल ई-आधार डाउनलोड करा.' }
    ]),
    'Unique Identification Authority of India (UIDAI)',
    'https://uidai.gov.in',
    '2026-03-01',
    'verified',
    'Aadhaar Center'
  );

  const aadhaarId = Number(aadhaarRes.lastInsertRowid);

  insertReq.run(
    aadhaarId,
    'Proof of Identity (PoI)',
    'पहचान का प्रमाण (PoI)',
    'ओळखीचा पुरावा (PoI)',
    'Verifies legal name and photo of the applicant.',
    'आवेदक के कानूनी नाम और फोटो का सत्यापन करता है।',
    'अर्जदाराचे कायदेशीर नाव आणि छायाचित्र प्रमाणित करण्यासाठी.',
    'mandatory',
    JSON.stringify([
      'Passport',
      'PAN Card',
      'Voter Identity Card (EPIC)',
      'Driving Licence',
      'Government Photo ID card / Service Card issued by PSU',
      'Standard Certificate issued by Gazetted Officer / Tehsildar (on UIDAI Annexure A format)'
    ]),
    'Must contain applicant name and clear photograph.',
    'आवेदक का नाम और स्पष्ट तस्वीर होनी चाहिए।',
    'अर्जदाराचे नाव आणि स्पष्ट छायाचित्र असणे आवश्यक आहे.',
    JSON.stringify({
      apply_where: 'Online via NSDL/UTIITSL for PAN, or Election Commission for Voter ID',
      required_docs: 'Passport size photo, address proof',
      official_url: 'https://voters.eci.gov.in',
      fee: 'Free for Voter ID, ₹107 for PAN card',
      processing_time: '7-15 days',
      next_action: 'If you have no photo ID, get UIDAI standard certificate signed by local Tehsildar/Gazetted Officer.'
    }),
    1
  );

  insertReq.run(
    aadhaarId,
    'Proof of Address (PoA)',
    'पते का प्रमाण (PoA)',
    'पत्त्याचा पुरावा (PoA)',
    'Verifies physical location where citizen resides.',
    'भौतिक स्थान का सत्यापन करता है जहां नागरिक रहता है।',
    'नागरिक राहत असलेल्या घराचा पत्ता पडताळण्यासाठी.',
    'mandatory',
    JSON.stringify([
      'Electricity Bill / Water Bill / Gas Connection Bill (not older than 3 months)',
      'Bank Account Statement / Passbook with photo (Scheduled Commercial Bank)',
      'Registered Rent / Lease Agreement',
      'Voter Identity Card (EPIC)',
      'Domicile / Residence Certificate with photo issued by State Government',
      'Head of Family (HoF) based confirmation through relationship proof'
    ]),
    'Address on document must exactly match requested Aadhaar update address.',
    'दस्तावेज पर पता बिल्कुल वही होना चाहिए जो आधार में चाहिए।',
    'कागदपत्रावरील पत्ता आधारमध्ये नोंदवायच्या पत्त्याशी तंतोतंत जुळला पाहिजे.',
    JSON.stringify({
      apply_where: 'Electricity provider portal or local bank branch',
      required_docs: 'Identity proof',
      official_url: 'https://myaadhaar.uidai.gov.in',
      fee: 'Free from utility provider',
      processing_time: '1-3 days',
      next_action: 'Download your latest electricity/gas bill or passbook with current address.'
    }),
    2
  );

  // Service 3: Permanent Account Number (PAN Card)
  const panRes = insertService.run(
    'pan-card-new-correction',
    'Tax & Financial',
    'PAN Card (Form 49A / Correction)',
    'पैन कार्ड (फॉर्म 49A / सुधार)',
    'पॅन कार्ड (नवीन अर्ज फॉर्म 49A / दुरुस्ती)',
    '10-digit alphanumeric permanent account number issued by Income Tax Department',
    'आयकर विभाग द्वारा जारी 10-अंकीय स्थायी खाता संख्या',
    'आयकर विभागाद्वारे जारी केलेला १० अंकी कायमस्वरूपी खाते क्रमांक',
    'PAN is mandatory for filing income tax returns, opening bank accounts, major financial transactions, and receiving taxable income.',
    'आयकर रिटर्न दाखिल करने, बैंक खाता खोलने और वित्तीय लेनदेन के लिए पैन अनिवार्य है।',
    'आयकर विवरणपत्र भरणे, बँक खाते उघडणे आणि महत्त्वाच्या आर्थिक व्यवहारांसाठी पॅन अनिवार्य आहे.',
    'Any individual, firm, company, Hindu Undivided Family (HUF), or minor represented by guardian.',
    'कोई भी व्यक्ति, फर्म, कंपनी या नाबालिग (अभिभावक के माध्यम से)।',
    'कोणतीही व्यक्ती, संस्था, कंपनी किंवा पालक प्रतिनिधीत्व असलेले अल्पवयीन मूल.',
    'Valid Identity proof, Address proof, and Date of Birth proof matching across documents.',
    'वैध पहचान प्रमाण, पता प्रमाण और जन्म तिथि प्रमाण।',
    'वैध ओळख पुरावा, पत्ता पुरावा आणि जन्मतारीख पुरावा.',
    'Physical PAN Card dispatched in India: ₹107. e-PAN only (PDF): ₹72. Instant e-PAN via Aadhaar: FREE.',
    'भौतिक पैन कार्ड: ₹107। केवल ई-पैन (PDF): ₹72। आधार आधारित तत्काल ई-पैन: मुफ़्त।',
    'प्रत्यक्ष पॅन कार्ड: ₹१०७. केवळ डिजिटल ई-पॅन (PDF): ₹७२. मोफत तात्काळ ई-पॅन (आधारद्वारे).',
    'Instant e-PAN: 10 minutes. Physical Card delivery: 7 to 15 working days.',
    'तत्काल ई-पैन: 10 मिनट। भौतिक कार्ड: 7 से 15 दिन।',
    'तात्काळ ई-पॅन: १० मिनिटे. छापील कार्ड: ७ ते १५ कामकाजाचे दिवस.',
    JSON.stringify([
      { step: 1, title_en: 'Choose Application Channel', title_hi: 'आवेदन माध्यम चुनें', title_mr: 'अर्ज पद्धत निवडा', desc_en: 'Apply through Protean (NSDL) / UTIITSL, or get Instant e-PAN on Income Tax e-Filing portal if Aadhaar is linked with mobile.', desc_hi: 'Protean (NSDL) या UTIITSL के माध्यम से आवेदन करें, या तत्काल ई-पैन का उपयोग करें।', desc_mr: 'Protean (NSDL) किंवा UTIITSL वरून अर्ज करा किंवा आयकर पोर्टलवरून तात्काळ ई-पॅन मिळवा.' },
      { step: 2, title_en: 'Fill Form 49A (or Change Request Form)', title_hi: 'फॉर्म 49A भरें', title_mr: 'फॉर्म 49A भरा', desc_en: 'Enter applicant category, personal names, parents details, and select communication address.', desc_hi: 'आवेदक श्रेणी, व्यक्तिगत नाम, माता-पिता का विवरण दर्ज करें।', desc_mr: 'अर्जदार प्रकार, संपूर्ण नाव, पालकांचे तपशील आणि पत्ता भरा.' },
      { step: 3, title_en: 'Upload Documents & Photograph', title_hi: 'दस्तावेज और फोटो अपलोड करें', title_mr: 'कागदपत्रे आणि छायाचित्र अपलोड करा', desc_en: 'Upload scanned passport photo (200 DPI), signature, and supporting PoI/PoA/DOB proofs.', desc_hi: 'पासपोर्ट फोटो, हस्ताक्षर और पहचान/पते के दस्तावेज अपलोड करें।', desc_mr: 'पासपोर्ट फोटो, स्वाक्षरी आणि पुरावे अपलोड करा.' },
      { step: 4, title_en: 'Make Online Payment', title_hi: 'ऑनलाइन शुल्क भुगतान करें', title_mr: 'ऑनलाइन शुल्क भरा', desc_en: 'Pay processing fee of ₹107 using UPI/Net Banking/Debit Card.', desc_hi: 'UPI/नेट बैंकिंग द्वारा ₹107 का भुगतान करें।', desc_mr: 'UPI किंवा नेट बँकिंगद्वारे ₹१०७ शुल्क भरा.' },
      { step: 5, title_en: 'Download e-PAN and Receive Card', title_hi: 'ई-पैन डाउनलोड करें और कार्ड प्राप्त करें', title_mr: 'ई-पॅन डाउनलोड करा आणि कार्ड मिळवा', desc_en: 'e-PAN is emailed within 24-48 hours. Plastic PAN card arrives by India Post.', desc_hi: 'ई-पैन 24-48 घंटों में ईमेल पर प्राप्त होगा। कार्ड डाक से आएगा।', desc_mr: 'ई-पॅन २४-४८ तासांत ईमेलवर येतो आणि छापील कार्ड पोस्टाने घरी येते.' }
    ]),
    'Income Tax Department, Ministry of Finance',
    'https://www.incometax.gov.in',
    '2026-02-28',
    'verified',
    'Income Tax / NSDL Facilitation Center'
  );

  const panId = Number(panRes.lastInsertRowid);

  insertReq.run(
    panId,
    'Identity Proof',
    'पहचान का प्रमाण',
    'ओळखीचा पुरावा',
    'Proof of identity showing full legal name.',
    'पूर्ण कानूनी नाम दर्शाने वाला पहचान प्रमाण।',
    'पूर्ण कायदेशीर नाव दर्शवणारा ओळखीचा पुरावा.',
    'mandatory',
    JSON.stringify(['Aadhaar Card', 'Voter ID Card', 'Passport', 'Driving Licence', 'Ration Card having applicant photo']),
    'Clear scan in PDF format under 2MB.',
    '2MB से कम स्पष्ट स्कैन।',
    '२ एमबी पेक्षा कमी स्पष्ट स्कॅन प्रत.',
    JSON.stringify({
      apply_where: 'DigiLocker or UIDAI portal',
      required_docs: 'Aadhaar registered mobile',
      official_url: 'https://myaadhaar.uidai.gov.in',
      fee: 'Free',
      processing_time: 'Instant',
      next_action: 'Download masked or regular e-Aadhaar from UIDAI.'
    }),
    1
  );

  // Service 4: Income Certificate
  const incomeRes = insertService.run(
    'income-certificate',
    'Certificates & Revenue',
    'Income Certificate (Tahsil / Revenue Dept)',
    'आय प्रमाण पत्र (तहसील / राजस्व विभाग)',
    'उत्पन्नाचा दाखला (तहसील / महसूल विभाग)',
    'Official certification of annual family income issued by Sub-Divisional Officer / Tahsildar',
    'उप-मंडल अधिकारी / तहसीलदार द्वारा जारी वार्षिक पारिवारिक आय का आधिकारिक प्रमाण पत्र',
    'उपविभागीय अधिकारी / तहसीलदार यांच्याकडून जारी केला जाणारा वार्षिक कौटुंबिक उत्पन्नाचा अधिकृत दाखला',
    'Income Certificate verifies the annual income of an individual or family from all sources. It is essential for government scholarship schemes, fee concessions, EWS reservations, and welfare subsidies.',
    'आय प्रमाण पत्र सभी स्रोतों से किसी व्यक्ति या परिवार की वार्षिक आय को प्रमाणित करता है। यह छात्रवृत्ति, ईडब्ल्यूएस और सरकारी योजनाओं के लिए आवश्यक है।',
    'उत्पन्नाचा दाखला सर्व मार्गांनी मिळणाऱ्या कौटुंबिक उत्पन्नाची पडताळणी करतो. हा शिष्यवृत्ती, शिक्षण फी सवलत आणि शासकीय योजनांसाठी आवश्यक आहे.',
    'Any resident citizen earning income within the Tahsil jurisdiction.',
    'तहसील अधिकार क्षेत्र के अंतर्गत आय अर्जित करने वाला कोई भी निवासी।',
    'तहसील अधिकारक्षेत्रात वास्तव्यास असलेला आणि उत्पन्न मिळवणारा कोणताही रहिवासी.',
    'Applicant must provide proof of all family income sources (Salary slips, Form 16, ITR, agricultural revenue receipts, or village Talathi report).',
    'परिवार के सभी आय स्रोतों का प्रमाण (वेतन पर्ची, फॉर्म 16, तलाठी रिपोर्ट) प्रस्तुत करना आवश्यक है।',
    'कुटुंबाच्या सर्व उत्पन्नाचा पुरावा (पगार पावती, फॉर्म १६, तलाठी अहवाल किंवा प्रतिज्ञापत्र) जोडणे आवश्यक आहे.',
    'Statutory Government fee: ₹33.60 to ₹50 on State portals (e.g., Aaple Sarkar / e-District).',
    'सरकारी पोर्टल पर वैधानिक शुल्क: ₹33.60 से ₹50।',
    'शासकीय शुल्क: ₹३३.६० ते ₹५० (आपले सरकार / ई-डिस्ट्रिक्ट पोर्टलवर).',
    '7 to 15 working days as guaranteed under Public Services Guarantee Act.',
    'लोक सेवा गारंटी अधिनियम के तहत 7 से 15 कार्य दिवस।',
    'लोकसेवा हमी कायद्यानुसार ७ ते १५ कामकाजाचे दिवस.',
    JSON.stringify([
      { step: 1, title_en: 'Log in to State Citizen Portal', title_hi: 'राज्य नागरिक पोर्टल पर लॉग इन करें', title_mr: 'राज्य नागरिक पोर्टलवर लॉगिन करा', desc_en: 'Visit your state portal (e.g. Aaple Sarkar in Maharashtra: aaplesarkar.mahaonline.gov.in or e-District).', desc_hi: 'अपने राज्य के पोर्टल (जैसे आपले सरकार) पर जाएं।', desc_mr: 'आपल्या राज्याच्या सेवा पोर्टलवर (उदा. आपले सरकार aaplesarkar.mahaonline.gov.in) लॉगिन करा.' },
      { step: 2, title_en: 'Select Revenue Department -> Income Certificate', title_hi: 'राजस्व विभाग -> आय प्रमाण पत्र चुनें', title_mr: 'महसूल विभाग -> उत्पन्नाचा दाखला निवडा', desc_en: 'Choose 1-year or 3-year income certificate option.', desc_hi: '1 वर्ष या 3 वर्ष के विकल्प का चयन करें।', desc_mr: '१ वर्ष किंवा ३ वर्षांचा दाखला पर्याय निवडा.' },
      { step: 3, title_en: 'Upload Talathi / Employer Income Proof & Affidavit', title_hi: 'तलाठी/नियोक्ता आय प्रमाण और हलफनामा अपलोड करें', title_mr: 'तलाठी / मालक उत्पन्नाचा दाखला आणि प्रतिज्ञापत्र अपलोड करा', desc_en: 'Upload salary slip/Form 16 or agricultural report issued by Talathi, along with self-declaration.', desc_hi: 'वेतन पर्ची या तलाठी रिपोर्ट और स्व-घोषणा पत्र संलग्न करें।', desc_mr: 'पगार पावती किंवा तलाठी उत्पन्न अहवाल आणि स्वयंघोषणापत्र जोडा.' },
      { step: 4, title_en: 'Verification by Circle Officer & Tahsildar', title_hi: 'सर्कल अधिकारी और तहसीलदार द्वारा सत्यापन', title_mr: 'मंडळ अधिकारी आणि तहसीलदार यांच्याकडून तपासणी', desc_en: 'Application scrutinized by Revenue Inspector, approved by Tehsildar with digital signature.', desc_hi: 'राजस्व निरीक्षक द्वारा जांच और तहसीलदार द्वारा डिजिटल हस्ताक्षर से स्वीकृति।', desc_mr: 'मंडळ अधिकारी तपासणी करतील आणि तहसीलदार डिजिटल स्वाक्षरीने मंजुरी देतील.' },
      { step: 5, title_en: 'Download Digitally Signed Certificate', title_hi: 'डिजिटल हस्ताक्षरित प्रमाण पत्र डाउनलोड करें', title_mr: 'डिजिटल स्वाक्षरी केलेला दाखला डाउनलोड करा', desc_en: 'Download QR-coded certificate valid across India.', desc_hi: 'क्यूआर कोड वाला प्रमाण पत्र डाउनलोड करें।', desc_mr: 'क्यूआर कोड असलेला अधिकृत दाखला डाउनलोड करा.' }
    ]),
    'Revenue and Forest Department, State Government',
    'https://aaplesarkar.mahaonline.gov.in',
    '2026-03-05',
    'verified',
    'Revenue & Tehsil Office'
  );

  const incomeId = Number(incomeRes.lastInsertRowid);

  insertReq.run(
    incomeId,
    'Proof of Income (Salary Slip / Talathi Report / ITR)',
    'आय का प्रमाण (वेतन पर्ची / तलाठी रिपोर्ट / ITR)',
    'उत्पन्नाचा पुरावा (पगार पावती / तलाठी अहवाल / आयटीआर)',
    'Validates actual financial earnings for the financial year.',
    'वित्तीय वर्ष के लिए वास्तविक वित्तीय कमाई को सत्यापित करता है।',
    'आर्थिक वर्षातील उत्पन्नाची अचूक खात्री करण्यासाठी.',
    'mandatory',
    JSON.stringify([
      'Salary Slip of last 3 months + Form 16 from Employer',
      'Income Tax Return (ITR-V) acknowledgement for previous financial year',
      'Income Report from Village Talathi / Patwari (for farmers/self-employed)',
      'Self-Declaration Affidavit stamped before Executive Magistrate/Notary'
    ]),
    'Original stamp and signature required on physical affidavits or certified reports.',
    'मूल मुहर और हस्ताक्षर आवश्यक हैं।',
    'मूळ शिक्का आणि स्वाक्षरी आवश्यक आहे.',
    JSON.stringify({
      apply_where: 'Local Village Talathi / Patwari Office or Employer HR Department',
      required_docs: 'Ration card, 7/12 extract (for farmers), bank passbook',
      official_url: 'https://aaplesarkar.mahaonline.gov.in',
      fee: 'Nominal court stamp fee ₹10-₹50',
      processing_time: '2-5 days',
      next_action: 'Visit your area Talathi office to obtain the annual income assessment report.'
    }),
    1
  );

  // Service 5: Caste Certificate & Validity
  const casteRes = insertService.run(
    'caste-certificate-validity',
    'Social Justice & Welfare',
    'Caste Certificate & Validity (Social Justice Dept)',
    'जाति प्रमाण पत्र एवं वैधता (सामाजिक न्याय विभाग)',
    'जात प्रमाणपत्र आणि जात वैधता प्रमाणपत्र (सामाजिक न्याय विभाग)',
    'Official proof of belonging to Scheduled Caste (SC), Scheduled Tribe (ST), OBC, or VJNT category',
    'अनुसूचित जाति (SC), अनुसूचित जनजाति (ST), ओबीसी या वीजेएनटी श्रेणी का आधिकारिक प्रमाण',
    'अनुसूचित जाती (SC), जमाती (ST), इतर मागासवर्ग (OBC) प्रवर्गाचा अधिकृत पुरावा',
    'A Caste Certificate is documentary proof that a person belongs to a specific caste recognized under the Constitution of India. Caste Validity is mandatory for professional college admissions and government recruitments.',
    'जाति प्रमाण पत्र प्रमाणित करता है कि व्यक्ति किसी मान्यता प्राप्त जाति से संबंधित है। कॉलेज प्रवेश और सरकारी नौकरियों के लिए जाति वैधता अनिवार्य है।',
    'जात प्रमाणपत्र हे व्यक्ती विशिष्ट मागास प्रवर्गातील असल्याचे सिद्ध करते. व्यावसायिक शिक्षण प्रवेश व सरकारी नोकरीसाठी जात वैधता (Validity) अनिवार्य आहे.',
    'Citizens whose family genealogy traces residence in the state prior to the prescribed cutoff date (e.g. 1950 for SC, 1967 for OBC in Maharashtra).',
    'वे नागरिक जिनका परिवार कटऑफ तिथि से पहले राज्य में निवास कर रहा था (जैसे एससी के लिए 1950, ओबीसी के लिए 1967)।',
    'ज्यांच्या कुटुंबाचे वास्तव्य विहित दिनांकापूर्वीचे आहे (उदा. महाराष्ट्रात SC साठी १९५०, OBC साठी १९६७).',
    'Historical genealogical documentary evidence mentioning caste of father, grandfather, or blood relative on paternal side.',
    'पिता, दादा या पैतृक रक्त संबंधी की जाति दर्शाने वाले ऐतिहासिक दस्तावेजी साक्ष्य।',
    'वडील, आजोबा किंवा रक्ताच्या नात्यातील नातेवाईकांच्या जातीचा उल्लेख असलेले जुने अधिकृत पुरावे आवश्यक.',
    'Government application fee ₹50 + verification charges.',
    'सरकारी आवेदन शुल्क ₹50 + सत्यापन शुल्क।',
    'शासकीय अर्ज शुल्क ₹५० + पडताळणी शुल्क.',
    'Caste Certificate: 21 to 45 days. Caste Validity: 45 to 90 days (Scrutiny Committee).',
    'जाति प्रमाण पत्र: 21 से 45 दिन। जाति वैधता: 45 से 90 दिन।',
    'जात प्रमाणपत्र: २१ ते ४५ दिवस. जात वैधता: ४५ ते ९० दिवस.',
    JSON.stringify([
      { step: 1, title_en: 'Gather Paternal Pre-Cutoff Proofs', title_hi: 'पैतृक पुराने साक्ष्य एकत्र करें', title_mr: 'वडिलोपार्जित जुने पुरावे गोळा करा', desc_en: 'Collect primary school leaving certificates of father, grandfather, or real uncle mentioning caste and admission date.', desc_hi: 'पिता, दादा या सगे चाचा के स्कूल छोड़ने के प्रमाण पत्र एकत्र करें।', desc_mr: 'वडील, आजोबा किंवा चुलत्यांच्या शाळेचा दाखला (TC/LC) गोळा करा ज्यात जातीची नोंद आहे.' },
      { step: 2, title_en: 'Prepare Family Tree (Vamshavali) Affidavit', title_hi: 'वंशावली हलफनामा तैयार करें', title_mr: 'वंशावळ प्रतिज्ञापत्र तयार करा', desc_en: 'Draft complete paternal family tree starting from great grandfather on stamp paper.', desc_hi: 'स्टांप पेपर पर परदादा से शुरू होने वाली पैतृक वंशावली बनाएं।', desc_mr: 'पणजोबा/आजोबांपासून सुरू होणारी संपूर्ण वंशावळ प्रतिज्ञापत्रावर नोंदवा.' },
      { step: 3, title_en: 'Apply Online via Sub-Divisional Officer (SDO)', title_hi: 'उप-विभागीय अधिकारी (SDO) को ऑनलाइन आवेदन करें', title_mr: 'उपविभागीय अधिकारी (प्रांत) यांच्याकडे ऑनलाइन अर्ज करा', desc_en: 'Submit through state portal with scanned proofs and self-declaration.', desc_hi: 'राज्य पोर्टल पर दस्तावेजों के साथ ऑनलाइन आवेदन जमा करें।', desc_mr: 'शासकीय पोर्टलवर कागदपत्रांसह अर्ज सादर करा.' },
      { step: 4, title_en: 'Field Inquiry by Vigilance Cell', title_hi: 'सतर्कता प्रकोष्ठ द्वारा फील्ड जांच', title_mr: 'दक्षता पथकाद्वारे गृहचौकशी', desc_en: 'Vigilance officer may visit ancestral village to verify customary traits and lineage.', desc_hi: 'सतर्कता अधिकारी पैतृक गांव जाकर पारंपरिक रीति-रिवाजों का सत्यापन कर सकता है।', desc_mr: 'दक्षता पथक मूळ गावी जाऊन चालीरीती व वंशावळीची खात्री करू शकते.' },
      { step: 5, title_en: 'Issuance & Committee Scrutiny', title_hi: 'जारी करना और समिति द्वारा वैधता', title_mr: 'प्रमाणपत्र वाटप व जात पडताळणी समिती निर्णय', desc_en: 'SDO issues Caste Certificate. Applicant submits Form 16 to District Scrutiny Committee for Validity.', desc_hi: 'एसडीओ प्रमाण पत्र जारी करता है। वैधता के लिए जांच समिति को आवेदन दें।', desc_mr: 'प्रांत अधिकारी प्रमाणपत्र देतात. त्यानंतर जात पडताळणी समितीकडे वैधतेसाठी अर्ज करावा लागतो.' }
    ]),
    'Social Justice and Special Assistance Department',
    'https://barti.maharashtra.gov.in',
    '2026-02-20',
    'verified',
    'Revenue & Tehsil Office'
  );

  const casteId = Number(casteRes.lastInsertRowid);

  insertReq.run(
    casteId,
    'Paternal Lineage Proof (Father / Grandfather School Leaving Certificate)',
    'पैतृक वंश प्रमाण (पिता / दादा का स्कूल छोड़ने का प्रमाण पत्र)',
    'वडिलांचा / आजोबांचा शाळा सोडल्याचा दाखला (LC/TC)',
    'Establishes caste status through paternal bloodline.',
    'पैतृक रक्त रेखा के माध्यम से जाति की स्थिति स्थापित करता है।',
    'वडिलोपार्जित रक्ताच्या नात्याद्वारे जात सिद्ध करण्यासाठी.',
    'mandatory',
    JSON.stringify([
      'Father Primary / High School Leaving Certificate showing caste and date of entry',
      'Grandfather School Record / Birth Register Extract from Kotwal Panji / Municipality',
      'Paternal Blood Relative Caste Validity Certificate (Father / Real Brother / Real Sister)',
      'Old Land Revenue 7/12 extract or Sanad mentioning caste prior to cutoff year'
    ]),
    'Must be from paternal side only. Mother side documents are not acceptable under law.',
    'केवल पैतृक पक्ष से होना चाहिए। कानून के तहत मातृ पक्ष के दस्तावेज स्वीकार्य नहीं हैं।',
    'फक्त वडिलांच्या बाजूचेच पुरावे ग्राह्य धरले जातात. आईकडील पुरावे कायद्याने चालत नाहीत.',
    JSON.stringify({
      apply_where: 'School where father/grandfather studied or District Zilla Parishad Archives',
      required_docs: 'Application letter, general register number',
      official_url: 'https://aaplesarkar.mahaonline.gov.in',
      fee: 'Nominal copy fee ₹10-₹50',
      processing_time: '7-14 days',
      next_action: 'Apply to the headmaster of your father’s primary school for a certified copy of the General Register (Nirgam Utara).'
    }),
    1
  );

  // Service 6: Driving Licence (Learner & Permanent via Parivahan)
  const dlRes = insertService.run(
    'driving-licence-parivahan',
    'Transport & Vehicles',
    'Driving Licence (Learner & Permanent via Parivahan)',
    'ड्राइविंग लाइसेंस (लर्नर और स्थायी - परिवहन)',
    'वाहन चालक परवाना (लर्निंग आणि पक्के लायसन्स - परिवहन)',
    'Official authorization to drive motor vehicles in India issued by Ministry of Road Transport & Highways',
    'सड़क परिवहन एवं राजमार्ग मंत्रालय द्वारा जारी मोटर वाहन चलाने का आधिकारिक अधिकार पत्र',
    'रस्ते वाहतूक आणि महामार्ग मंत्रालयाद्वारे जारी केलेला वाहन चालवण्याचा अधिकृत परवाना',
    'Issued under the Motor Vehicles Act, 1988. A Learner Licence is first issued for 6 months, after which applicant takes a practical driving test for Permanent Driving Licence.',
    'मोटर वाहन अधिनियम के तहत जारी। पहले 6 महीने के लिए लर्नर लाइसेंस जारी होता है, फिर स्थायी टेस्ट होता है।',
    'मोटर वाहन कायद्यानुसार प्रथम ६ महिन्यांसाठी लर्निंग लायसन्स मिळते, त्यानंतर प्रत्यक्ष गाडी चालवून पक्के लायसन्स दिले जाते.',
    'Minimum 18 years for private Light Motor Vehicles (Car/Bike with gear), 16 years for gearless two-wheeler up to 50cc with parental consent, 20 years for Transport vehicles.',
    'निजी कार/बाइक के लिए न्यूनतम 18 वर्ष। बिना गियर वाले दोपहिया वाहन के लिए 16 वर्ष।',
    'खाजगी चारचाकी/दुचाकीसाठी किमान वय १८ वर्षे. विना गिअर दुचाकीसाठी १६ वर्षे (पालकांच्या संमतीने).',
    'Medical fitness self-declaration (Form 1) or Medical Certificate (Form 1-A by registered medical practitioner for age 40+ or transport).',
    'चिकित्सा फिटनेस फॉर्म 1 या डॉक्टर द्वारा फॉर्म 1-A।',
    'वैद्यकीय स्वास्थ्य प्रमाणपत्र फॉर्म १ किंवा १-ए (डॉक्टरांकडून).',
    'Learner Licence: ₹150 + ₹50 test fee per class. Permanent DL: ₹200 + ₹300 driving test fee.',
    'लर्नर लाइसेंस: ₹150 + ₹50 टेस्ट। स्थायी डीएल: ₹200 + ₹300 टेस्ट शुल्क।',
    'लर्निंग लायसन्स: ₹१५० + ₹५० चाचणी. पक्के लायसन्स: ₹२०० + ₹३०० वाहन चाचणी शुल्क.',
    'Learner Licence: Same day online test. Permanent DL: Card dispatched in 10-15 days after passing track test.',
    'लर्नर लाइसेंस: उसी दिन ऑनलाइन टेस्ट। स्थायी: टेस्ट पास करने के 10-15 दिन बाद।',
    'लर्निंग लायसन्स: त्याच दिवशी ऑनलाइन टेस्ट. पक्के लायसन्स: ग्राउंड टेस्ट दिल्यानंतर १० ते १५ दिवसांत पोस्टाने येते.',
    JSON.stringify([
      { step: 1, title_en: 'Apply Online on Sarathi Parivahan', title_hi: 'सारथी परिवहन पर ऑनलाइन आवेदन करें', title_mr: 'सारथी परिवहन पोर्टलवर ऑनलाइन अर्ज करा', desc_en: 'Visit sarathi.parivahan.gov.in, select your state and choose "Apply for Learner Licence (LL)".', desc_hi: 'sarathi.parivahan.gov.in पर जाएं और लर्नर लाइसेंस चुनें।', desc_mr: 'sarathi.parivahan.gov.in वर जाऊन राज्य निवडा आणि लर्निंग लायसन्ससाठी अर्ज करा.' },
      { step: 2, title_en: 'Aadhaar e-KYC (No RTO Visit for Learner Test)', title_hi: 'आधार ई-केवाईसी (लर्नर के लिए घर बैठे टेस्ट)', title_mr: 'आधार ई-केवायसी (घरी बसून ऑनलाइन लर्निंग टेस्ट)', desc_en: 'Authenticate with Aadhaar OTP to take the computer traffic signs test online from home without visiting RTO.', desc_hi: 'आधार ओटीपी द्वारा घर से ऑनलाइन कंप्यूटर टेस्ट दें।', desc_mr: 'आधार ओटीपी द्वारे घरबसल्या संगणकावर वाहतूक नियमांची चाचणी द्या.' },
      { step: 3, title_en: 'Download Learner Licence Immediately', title_hi: 'लर्नर लाइसेंस तुरंत डाउनलोड करें', title_mr: 'लर्निंग लायसन्स लगेच डाउनलोड करा', desc_en: 'Upon passing the 15-question traffic safety test, download digitally signed LL valid for 6 months.', desc_hi: '15 प्रश्नों की टेस्ट पास करने पर 6 महीने के लिए वैध लाइसेंस डाउनलोड करें।', desc_mr: 'चाचणी उत्तीर्ण झाल्यावर ६ महिन्यांसाठी वैध असणारे लर्निंग लायसन्स डिजिटल डाऊनलोड करा.' },
      { step: 4, title_en: 'Book Driving Test Slot after 30 Days', title_hi: '30 दिनों के बाद ड्राइविंग टेस्ट स्लॉट बुक करें', title_mr: '३० दिवसांनंतर प्रत्यक्ष वाहन चाचणीसाठी स्लॉट बुक करा', desc_en: 'Select date and time to take the physical driving test at your designated RTO track.', desc_hi: 'आरडीओ ट्रैक पर वाहन टेस्ट के लिए तारीख और समय बुक करें।', desc_mr: 'आरडीओ ट्रॅकवर गाडी चालवून दाखवण्यासाठी तारीख आणि वेळ निवडा.' },
      { step: 5, title_en: 'Appear for Track Test & Get Smart Card DL', title_hi: 'ट्रैक टेस्ट दें और स्मार्ट कार्ड प्राप्त करें', title_mr: 'गाडी चालवून दाखवा आणि स्मार्ट कार्ड लायसन्स मिळवा', desc_en: 'Pass vehicle driving test (H-track / 8-track / gradient stop). Smart Card DL dispatched to address.', desc_hi: 'ड्राइविंग टेस्ट पास करें। स्मार्ट कार्ड डाक द्वारा आपके पते पर पहुंचेगा।', desc_mr: 'गाडी चालवण्याची परीक्षा पास व्हा. स्मार्ट कार्ड लायसन्स थेट घरी पोस्टाने पोहोचेल.' }
    ]),
    'Ministry of Road Transport and Highways (MoRTH)',
    'https://sarathi.parivahan.gov.in',
    '2026-03-10',
    'verified',
    'RTO Office'
  );

  const dlId = Number(dlRes.lastInsertRowid);

  insertReq.run(
    dlId,
    'Age & Date of Birth Proof',
    'आयु एवं जन्म तिथि का प्रमाण',
    'वय आणि जन्मतारखेचा पुरावा',
    'To verify applicant has attained minimum statutory legal driving age.',
    'सत्यापित करना कि आवेदक न्यूनतम कानूनी ड्राइविंग आयु प्राप्त कर चुका है।',
    'अर्जदाराने वाहन चालवण्याचे किमान कायदेशीर वय पूर्ण केले आहे याची खात्री करण्यासाठी.',
    'mandatory',
    JSON.stringify([
      '10th Standard Passing Certificate / Marksheet',
      'Birth Certificate',
      'PAN Card',
      'Passport',
      'Electoral Photo ID Card (Voter ID)'
    ]),
    'Must show date of birth clearly.',
    'जन्म तिथि स्पष्ट रूप से दिखाई देनी चाहिए।',
    'जन्मतारीख स्पष्ट दिसणे आवश्यक.',
    JSON.stringify({
      apply_where: 'DigiLocker or Education Board / Municipal Portal',
      required_docs: 'Roll number / Hospital records',
      official_url: 'https://www.digilocker.gov.in',
      fee: 'Free',
      processing_time: 'Instant',
      next_action: 'Fetch your 10th marksheet or Birth Certificate directly from DigiLocker.'
    }),
    1
  );

  // Service 7: Domicile Certificate
  insertService.run(
    'domicile-certificate',
    'Certificates & Revenue',
    'Domicile & Nationality Certificate',
    'अधिवास एवं राष्ट्रीयता प्रमाण पत्र',
    'अधिवास आणि राष्ट्रीयत्व दाखला (डोमासाइल सर्टिफिकेट)',
    'Proof of permanent residence and domicile in the state for education and state government jobs',
    'शिक्षा और राज्य सरकार की नौकरियों के लिए राज्य में स्थायी निवास का प्रमाण',
    'शिक्षण, शिष्यवृत्ती आणि शासकीय नोकऱ्यांसाठी राज्यातील कायमस्वरूपी रहिवासाचा पुरावा',
    'A Domicile Certificate certifies that an individual has continuously resided in the state for the mandatory period (typically 10-15 years) and is eligible for state quota seats.',
    'अधिवास प्रमाण पत्र प्रमाणित करता है कि व्यक्ति अनिवार्य अवधि (15 वर्ष) से राज्य में रह रहा है।',
    'डोमासाइल सर्टिफिकेट हे सिद्ध करते की व्यक्ती सलग १५ वर्षांपासून राज्यात वास्तव्यास आहे आणि राज्य कोट्यासाठी पात्र आहे.',
    'Residents who have lived in the state for minimum 15 consecutive years with continuous residential proof.',
    'निवासी जो लगातार कम से कम 15 वर्षों से राज्य में रह रहे हैं।',
    'राज्यात सलग किमान १५ वर्षे वास्तव्य असलेले नागरिक.',
    'Continuous school leaving certificates, electricity bills, ration cards, or property tax receipts spanning the 15-year period.',
    '15 वर्षों की अवधि का निरंतर निवास प्रमाण।',
    'मागील १५ वर्षांचा सलग वास्तव्याचा पुरावा (शाळेचे दाखले, वीज बिल, रेशन कार्ड).',
    'Government fee: ₹33.60 on Aaple Sarkar.',
    'सरकारी शुल्क: ₹33.60।',
    'शासकीय शुल्क: ₹३३.६०.',
    '7 to 15 working days.',
    '7 से 15 कार्य दिवस।',
    '७ ते १५ कामकाजाचे दिवस.',
    JSON.stringify([
      { step: 1, title_en: 'Log in to State e-District Portal', title_hi: 'राज्य ई-डिस्ट्रिक्ट पोर्टल पर जाएं', title_mr: 'राज्य ई-डिस्ट्रिक्ट पोर्टलवर जा', desc_en: 'Access Aaple Sarkar or your state revenue department site.', desc_hi: 'आपले सरकार या राज्य पोर्टल पर जाएं।', desc_mr: 'आपले सरकार किंवा राज्य महसूल पोर्टल उघडा.' },
      { step: 2, title_en: 'Select Age, Nationality and Domicile Certificate', title_hi: 'अधिवास प्रमाण पत्र चुनें', title_mr: 'वय, अधिवास आणि राष्ट्रीयत्व दाखला निवडा', desc_en: 'Fill residential addresses spanning the last 15 years.', desc_hi: 'पिछले 15 वर्षों के पते दर्ज करें।', desc_mr: 'मागील १५ वर्षांतील पत्त्यांची अचूक माहिती भरा.' },
      { step: 3, title_en: 'Upload 15 Years Continuous Residential Proofs', title_hi: '15 वर्षों के आवासीय साक्ष्य अपलोड करें', title_mr: '१५ वर्षांचे सलग रहिवासी पुरावे जोडा', desc_en: 'Primary school LC + Higher secondary LC + Electricity bill/Ration Card.', desc_hi: 'प्राथमिक और माध्यमिक स्कूल सर्टिफिकेट और बिजली बिल लगाएं।', desc_mr: 'प्राथमिक आणि माध्यमिक शाळेचे दाखले व घराचे वीज बिल/भाडेकरार जोडा.' },
      { step: 4, title_en: 'Tahsildar Verification & Approval', title_hi: 'तहसीलदार द्वारा सत्यापन और अनुमोदन', title_mr: 'तहसीलदारांकडून तपासणी व मंजुरी', desc_en: 'Revenue staff inspects residential history and forwards to Executive Magistrate.', desc_hi: 'राजस्व कर्मचारी जांच कर मजिस्ट्रेट को अनुमोदन हेतु भेजते हैं।', desc_mr: 'महसूल अधिकारी तपासणी करून कार्यकारी दंडाधिकारी/तहसीलदारांकडे मंजुरीसाठी पाठवतात.' },
      { step: 5, title_en: 'Download Official QR Certificate', title_hi: 'आधिकारिक क्यूआर प्रमाण पत्र डाउनलोड करें', title_mr: 'अधिकृत क्यूआर कोड दाखला डाउनलोड करा', desc_en: 'Certificate with government barcode valid for lifetime.', desc_hi: 'आजीवन वैध डिजिटल प्रमाण पत्र प्राप्त करें।', desc_mr: 'आयुष्यभरासाठी वैध असणारा डिजिटल दाखला मिळवा.' }
    ]),
    'Department of Revenue, State Government',
    'https://aaplesarkar.mahaonline.gov.in',
    '2026-03-01',
    'verified',
    'Revenue & Tehsil Office'
  );

  // Service 8: College & University Admissions
  insertService.run(
    'college-university-admissions',
    'Education & Admissions',
    'College & University Admissions (Merit & Quota Verification)',
    'कॉलेज और विश्वविद्यालय प्रवेश (मेरिट और कोटा सत्यापन)',
    'महाविद्यालय आणि विद्यापीठ प्रवेश कागदपत्रे पडताळणी',
    'Mandatory document bundle required for Central and State University admissions (Engineering, Medical, Law, Arts, Science)',
    'विश्वविद्यालय और कॉलेज प्रवेश के लिए अनिवार्य दस्तावेजों का बंडल (इंजीनियरिंग, मेडिकल, आदि)',
    'इंजिनिअरिंग, मेडिकल, विधी व पदवी प्रवेशासाठी लागणाऱ्या सर्व आवश्यक कागदपत्रांची अधिकृत मार्गदर्शिका',
    'Official documentation guidelines for CAP (Centralized Admission Process) counseling rounds including CET, NEET, JEE, CUET admissions.',
    'सीईटी, नीट, जेईई और सीयूईटी केंद्रीकृत प्रवेश प्रक्रिया (सीएपी) के लिए दस्तावेज मार्गदर्शिका।',
    'सीईटी, नीट, जेईई आणि सीयूईटी केंद्रीकृत प्रवेश प्रक्रियेसाठी (CAP Round) आवश्यक मूळ कागदपत्रांची सूची.',
    'All candidate students appearing for Higher Secondary (HSC/12th) or Degree entrance admissions.',
    '12वीं या डिग्री प्रवेश परीक्षा में शामिल होने वाले सभी छात्र।',
    '१२ वी उत्तीर्ण किंवा पदवी प्रवेशासाठी अर्ज करणारे सर्व विद्यार्थी.',
    'Original certificates must be retained by candidate; verified set submitted to Facilitation Center (FC).',
    'उम्मीदवार के पास मूल प्रमाण पत्र होने चाहिए।',
    'विद्यार्थ्याकडे मूळ प्रमाणपत्रे असणे बंधनकारक आहे; सुविधा केंद्रावर (FC) प्रत्यक्ष पडताळणी होते.',
    'Counseling registration fee as prescribed by State CET Cell / NTA / MCC.',
    'सीईटी सेल / एनटीए द्वारा निर्धारित परामर्श शुल्क।',
    'प्रवेश नियामक प्राधिकरण (CET Cell/NTA) विहित शुल्क.',
    'Instant verification during designated CAP verification window.',
    'निर्धारित सीएपी विंडो के दौरान तत्काल सत्यापन।',
    'केंद्रीकृत प्रवेश फेरीच्या (CAP) विहित मुदतीत पडताळणी.',
    JSON.stringify([
      { step: 1, title_en: 'Register on State CET / Central Admission Portal', title_hi: 'केंद्रीकृत प्रवेश पोर्टल पर पंजीकरण करें', title_mr: 'केंद्रीकृत प्रवेश पोर्टलवर नोंदणी करा', desc_en: 'Create candidate profile with entrance exam roll number and score card.', desc_hi: 'प्रवेश परीक्षा रोल नंबर के साथ प्रोफाइल बनाएं।', desc_mr: 'प्रवेश परीक्षेचा बैठक क्रमांक आणि गुणपत्रिकेसह प्रोफाइल तयार करा.' },
      { step: 2, title_en: 'Upload Clear PDF Scans of Mandated Category Documents', title_hi: 'अनिवार्य दस्तावेजों की स्पष्ट पीडीएफ अपलोड करें', title_mr: 'आवश्यक कागदपत्रांच्या स्पष्ट पीडीएफ प्रती अपलोड करा', desc_en: 'Marksheets, Domicile, Category certificate, Non-Creamy Layer, EWS, or Income certificate.', desc_hi: 'मार्कशीट, डोमिसाइल, जाति प्रमाण पत्र और क्रीमीलेयर अपलोड करें।', desc_mr: 'गुणपत्रिका, डोमासाइल, जात प्रमाणपत्र, नॉन-क्रिमिलेअर किंवा ईडब्ल्यूएस दाखला अपलोड करा.' },
      { step: 3, title_en: 'Choose Physical / E-Scrutiny Verification Mode', title_hi: 'ई-स्क्रूटनी या भौतिक सत्यापन मोड चुनें', title_mr: 'ई-पडताळणी किंवा प्रत्यक्ष केंद्र पडताळणी निवडा', desc_en: 'Select nearest Facilitation Center (FC) or online e-Scrutiny.', desc_hi: 'निकटतम सुविधा केंद्र (एफसी) या ऑनलाइन मोड चुनें।', desc_mr: 'जवळचे सुविधा केंद्र (FC) किंवा ऑनलाइन ई-पडताळणी पर्याय निवडा.' },
      { step: 4, title_en: 'Obtain Document Verification Receipt (Acknowledgement)', title_hi: 'दस्तावेज सत्यापन पावती प्राप्त करें', title_mr: 'कागदपत्र पडताळणी पावती (कन्फर्मेशन स्लिप) मिळवा', desc_en: 'Keep the signed FC verification slip safe for college reporting.', desc_hi: 'हस्ताक्षरित सत्यापन पर्ची कॉलेज में रिपोर्टिंग के लिए सुरक्षित रखें।', desc_mr: 'स्वाक्षरी केलेली पडताळणी पावती कॉलेजमध्ये प्रत्यक्ष हजर होताना सादर करण्यासाठी सांभाळा.' }
    ]),
    'State Common Entrance Test Cell & Directorate of Technical Education',
    'https://cetcell.mahacet.org',
    '2026-03-08',
    'verified',
    'University / Facilitation Center'
  );

  console.log('Database initialization and seeding completed successfully!');
}

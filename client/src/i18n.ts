import { Language } from './types';

export const translations = {
  // Common Navigation & Branding
  brandName: { en: 'DOCEASE', hi: 'डॉकईज़ (DOCEASE)', mr: 'डॉकईज (DOCEASE)' },
  brandSubtitle: { en: 'A Documentation Guide', hi: 'एक दस्तावेज़ मार्गदर्शिका', mr: 'एक कागदपत्र मार्गदर्शिका' },
  tagline: { 
    en: 'Simplified documentation, verified procedures & official guidance for every Indian citizen.',
    hi: 'प्रत्येक भारतीय नागरिक के लिए सरल प्रलेखन, सत्यापित प्रक्रियाएं और आधिकारिक मार्गदर्शन।',
    mr: 'प्रत्येक भारतीय नागरिकासाठी सुलभ कागदपत्रे, पडताळणीकृत प्रक्रिया आणि अधिकृत मार्गदर्शन.'
  },
  home: { en: 'Home', hi: 'होम', mr: 'मुख्यपृष्ठ' },
  search: { en: 'Search Services', hi: 'सेवाएं खोजें', mr: 'सेवा शोधा' },
  checklists: { en: 'My Checklists', hi: 'मेरी चेकलिस्ट', mr: 'माझी यादी' },
  vault: { en: 'Document Vault', hi: 'दस्तावेज़ वॉल्ट', mr: 'कागदपत्र व्हॉल्ट' },
  appointments: { en: 'Appointments', hi: 'अपॉइंटमेंट', mr: 'अपॉइंटमेंट्स' },
  saved: { en: 'Saved Items', hi: 'सहेजे गए', mr: 'जतन केलेले' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल', mr: 'प्रोफाइल' },
  officialPortal: { en: 'Official Portal', hi: 'अधिकारी पोर्टल', mr: 'अधिकारी पोर्टल' },
  adminCMS: { en: 'Admin CMS', hi: 'व्यवस्थापक CMS', mr: 'अ‍ॅडमिन CMS' },
  login: { en: 'Log In', hi: 'लॉग इन', mr: 'लॉगिन' },
  register: { en: 'Register', hi: 'पंजीकरण', mr: 'नोंदणी' },
  logout: { en: 'Log Out', hi: 'लॉग आउट', mr: 'लॉगआउट' },

  // Search & Categories
  searchPlaceholder: { en: 'Search for a document or service…', hi: 'दस्तावेज़ या सेवा खोजें…', mr: 'कागदपत्र किंवा सेवा शोधा…' },
  allCategories: { en: 'All Categories', hi: 'सभी श्रेणियां', mr: 'सर्व वर्ग' },
  categoryPassport: { en: 'Passport & Travel', hi: 'पासपोर्ट और यात्रा', mr: 'पासपोर्ट आणि प्रवास' },
  categoryIdentity: { en: 'Identity & Citizenship', hi: 'पहचान और नागरिकता', mr: 'ओळख आणि नागरिकत्व' },
  categoryTax: { en: 'Tax & Financial', hi: 'कर और वित्तीय', mr: 'कर आणि आर्थिक' },
  categoryCertificates: { en: 'Certificates & Revenue', hi: 'प्रमाण पत्र एवं राजस्व', mr: 'दाखले आणि महसूल' },
  categorySocial: { en: 'Social Justice & Welfare', hi: 'सामाजिक न्याय एवं कल्याण', mr: 'सामाजिक न्याय आणि कल्याण' },
  categoryTransport: { en: 'Transport & Vehicles', hi: 'परिवहन और वाहन', mr: 'वाहतूक आणि वाहने' },
  categoryEducation: { en: 'Education & Admissions', hi: 'शिक्षा और प्रवेश', mr: 'शिक्षण आणि प्रवेश' },

  // Guidance Engine
  overview: { en: 'Overview', hi: 'अवलोकन', mr: 'माहिती व सारांश' },
  requiredDocuments: { en: 'Required Documents', hi: 'आवश्यक दस्तावेज', mr: 'आवश्यक कागदपत्रे' },
  applicationProcedure: { en: 'Application Procedure', hi: 'आवेदन प्रक्रिया', mr: 'अर्ज करण्याची पद्धत' },
  officialSource: { en: 'Official Source & Verification', hi: 'आधिकारिक स्रोत और सत्यापन', mr: 'अधिकृत स्रोत आणि पडताळणी' },
  verifiedOn: { en: 'Verified on', hi: 'सत्यापन तिथि', mr: 'पडताळणी तारीख' },
  eligibility: { en: 'Eligibility Criteria', hi: 'पात्रता मानदंड', mr: 'पात्रता निकष' },
  conditions: { en: 'Important Conditions', hi: 'महत्वपूर्ण शर्तें', mr: 'महत्त्वाच्या अटी' },
  officialFee: { en: 'Statutory Fee', hi: 'वैधानिक शुल्क', mr: 'शासकीय शुल्क' },
  processingTime: { en: 'Expected Processing Time', hi: 'अनुमानित समय', mr: 'अपेक्षित कालावधी' },
  mandatoryBadge: { en: 'Mandatory', hi: 'अनिवार्य', mr: 'अनिवार्य' },
  conditionalBadge: { en: 'Conditional', hi: 'सशर्त', mr: 'विशिष्ट अटींनुसार' },
  optionalBadge: { en: 'Optional', hi: 'वैकल्पिक', mr: 'पर्यायी' },
  acceptedAlternatives: { en: 'Accepted Alternative Documents', hi: 'स्वीकार्य वैकल्पिक दस्तावेज', mr: 'पर्यायी मान्य कागदपत्रे' },
  howToObtainBtn: { en: 'How to Obtain Missing Document', hi: 'लापता दस्तावेज कैसे प्राप्त करें', mr: 'नसलेले कागदपत्र कसे मिळवावे' },
  startChecklistBtn: { en: 'Start Preparation Checklist', hi: 'तैयारी चेकलिस्ट शुरू करें', mr: 'तयारी यादी सुरू करा' },
  resumeChecklistBtn: { en: 'Resume Checklist', hi: 'चेकलिस्ट जारी रखें', mr: 'यादी सुरू ठेवा' },
  bookAppointmentBtn: { en: 'Book Office Appointment', hi: 'कार्यालय अपॉइंटमेंट बुक करें', mr: 'कार्यालयीन अपॉइंटमेंट बुक करा' },
  openOfficialPortal: { en: 'Open Official Application Portal', hi: 'आधिकारिक पोर्टल खोलें', mr: 'अधिकृत संकेतस्थळ उघडा' },

  // Checklist Actions
  statusAvailable: { en: 'I Have This Document', hi: 'मेरे पास यह दस्तावेज है', mr: 'माझ्याकडे हे कागदपत्र आहे' },
  statusMissing: { en: 'Missing / Need to Apply', hi: 'लापता / आवेदन करना बाकी', mr: 'कागदपत्र नाही / अर्ज करायचा आहे' },
  statusNotApplicable: { en: 'Not Applicable to Me', hi: 'मेरे लिए लागू नहीं', mr: 'मला लागू नाही' },
  userReportedNotice: {
    en: 'Note: Marking documents as available tracks your personal readiness. It does not replace in-person scrutiny by official authorities.',
    hi: 'सूचना: दस्तावेजों को उपलब्ध चिह्नित करना आपकी व्यक्तिगत तैयारी को ट्रैक करता है। यह आधिकारिक जांच का विकल्प नहीं है।',
    mr: 'टीप: कागदपत्र उपलब्ध म्हणून नोंदवणे ही तुमची वैयक्तिक पूर्वतयारी आहे. ही अधिकृत सरकारी पडताळणी नाही.'
  },
  checklistCompleted: { en: 'All required documents prepared! You are ready for next steps.', hi: 'सभी आवश्यक दस्तावेज तैयार हैं! आप अगले चरण के लिए तैयार हैं।', mr: 'सर्व आवश्यक कागदपत्रे तयार आहेत! तुम्ही पुढील प्रक्रियेसाठी सज्ज आहात.' },

  // Missing Doc Modal
  missingDocModalTitle: { en: 'How to Obtain This Document', hi: 'यह दस्तावेज़ कैसे प्राप्त करें', mr: 'हे कागदपत्र कसे मिळवावे' },
  whereToApply: { en: 'Where to Apply', hi: 'आवेदन कहां करें', mr: 'अर्ज कोठे करावा' },
  requiredProofsForMissing: { en: 'Required Supporting Proofs', hi: 'आवश्यक सहायक दस्तावेज', mr: 'लागणारे आवश्यक पुरावे' },
  nextConcreteAction: { en: 'Recommended Next Step', hi: 'सुझाया गया अगला कदम', mr: 'पुढील शिफारस केलेले पाऊल' },

  // Appointments
  findOffices: { en: 'Nearby Verified Offices', hi: 'निकटतम सत्यापित कार्यालय', mr: 'जवळची अधिकृत कार्यालये' },
  officeHours: { en: 'Operating Hours', hi: 'कार्य समय', mr: 'कामाची वेळ' },
  getDirections: { en: 'Get Directions', hi: 'दिशा-निर्देश प्राप्त करें', mr: 'गुगल मॅपवर दिशा मिळवा' },
  selectDate: { en: 'Select Appointment Date', hi: 'अपॉइंटमेंट की तारीख चुनें', mr: 'अपॉइंटमेंटची तारीख निवडा' },
  selectSlot: { en: 'Select Time Slot', hi: 'समय स्लॉट चुनें', mr: 'वेळेचा स्लॉट निवडा' },
  weekendWarning: { en: 'Government facilitation centers remain closed on Saturdays and Sundays.', hi: 'सरकारी सुविधा केंद्र शनिवार और रविवार को बंद रहते हैं।', mr: 'सरकारी कार्यालये शनिवार व रविवारी बंद असतात.' },
  bookingConfirmation: { en: 'Appointment Confirmation Pass', hi: 'अपॉइंटमेंट पुष्टिकरण पास', mr: 'अपॉइंटमेंट पुष्टीकरण पास' },
  appointmentNumber: { en: 'Appointment Number', hi: 'अपॉइंटमेंट संख्या', mr: 'अपॉइंटमेंट क्रमांक' },
  qrPassNotice: {
    en: 'Show this digital QR pass at the security desk upon arrival. Only authorized officials can scan and verify this pass.',
    hi: 'आगमन पर सुरक्षा डेस्क पर यह डिजिटल क्यूआर पास दिखाएं। केवल अधिकृत अधिकारी ही इसे स्कैन और सत्यापित कर सकते हैं।',
    mr: 'कार्यालयात पोहोचल्यावर हा डिजिटल क्यूआर पास दाखवा. केवळ अधिकृत अधिकारीच हा पास स्कॅन करू शकतात.'
  },
  cancelAppointment: { en: 'Cancel Booking', hi: 'बुकिंग रद्द करें', mr: 'बुकिंग रद्द करा' },

  // Vault
  vaultTitle: { en: 'Secure Document Vault', hi: 'सुरक्षित दस्तावेज़ वॉल्ट', mr: 'सुरक्षित कागदपत्र व्हॉल्ट' },
  vaultDescription: {
    en: 'Keep your digital proofs safe in encrypted private cloud storage. Stored files are strictly accessible only by you.',
    hi: 'अपने डिजिटल दस्तावेजों को सुरक्षित निजी क्लाउड में रखें। संग्रहीत फाइलें केवल आपके लिए सुलभ हैं।',
    mr: 'तुमची डिजिटल कागदपत्रे सुरक्षित खासगी क्लाउडमध्ये साठवून ठेवा. ही कागदपत्रे केवळ तुम्हालाच पाहता येतात.'
  },
  uploadDocument: { en: 'Upload Document', hi: 'दस्तावेज़ अपलोड करें', mr: 'कागदपत्र अपलोड करा' },
  docTitleLabel: { en: 'Document Title (e.g., My 10th Marksheet)', hi: 'दस्तावेज़ शीर्षक', mr: 'कागदपत्राचे शीर्षक' },
  docCategoryLabel: { en: 'Category', hi: 'श्रेणी', mr: 'प्रवर्ग' },
  secureDownload: { en: 'Download', hi: 'डाउनलोड', mr: 'डाउनलोड' },
  deleteDoc: { en: 'Delete', hi: 'हटाएं', mr: 'हटवा' },
  emptyVault: { en: 'Your document vault is currently empty. Upload your first document securely.', hi: 'आपका दस्तावेज़ वॉल्ट वर्तमान में खाली है। पहला दस्तावेज़ सुरक्षित रूप से अपलोड करें।', mr: 'तुमचा व्हॉल्ट सध्या रिकामा आहे. तुमचे पहिले कागदपत्र सुरक्षित अपलोड करा.' },

  // Feedback & Reporting
  reportIssueBtn: { en: 'Report Missing or Outdated Info', hi: 'लापता या पुरानी जानकारी की रिपोर्ट करें', mr: 'अपूर्ण किंवा जुन्या माहितीची तक्रार करा' },
  reportSuccess: { en: 'Thank you! Our verification team will review this report against the official government gazette.', hi: 'धन्यवाद! हमारी सत्यापन टीम सरकारी राजपत्र के अनुसार इसकी समीक्षा करेगी।', mr: 'धन्यवाद! आमची पडताळणी टीम अधिकृत राजपत्राच्या आधारे याची तपासणी करेल.' },

  // Official Portal
  officialWelcome: { en: 'Government Official Desk', hi: 'शासकीय अधिकारी डेस्क', mr: 'शासकीय अधिकारी कक्ष' },
  scanQRTab: { en: 'Scan Citizen QR Pass', hi: 'नागरिक क्यूआर पास स्कैन करें', mr: 'नागरिक क्यूआर पास स्कॅन करा' },
  assignedRoster: { en: 'Assigned Appointments Roster', hi: 'निर्धारित अपॉइंटमेंट सूची', mr: 'नियोजित अपॉइंटमेंट्स यादी' },
  auditLogTab: { en: 'Verification Audit Trail', hi: 'सत्यापन ऑडिट ट्रेल', mr: 'पडताळणी ऑडिट लॉग' },
  verifyTokenBtn: { en: 'Verify QR Token', hi: 'क्यूआर टोकन सत्यापित करें', mr: 'क्यूआर टोकन पडताळा' },
  recordOutcome: { en: 'Record Verification Outcome', hi: 'सत्यापन परिणाम दर्ज करें', mr: 'पडताळणी निष्कर्ष नोंदवा' },

  // Auth & General
  emailOrMobile: { en: 'Email or Mobile Number', hi: 'ईमेल या मोबाइल नंबर', mr: 'ईमेल किंवा मोबाईल नंबर' },
  password: { en: 'Password', hi: 'पासवर्ड', mr: 'पासवर्ड' },
  confirmPassword: { en: 'Confirm Password', hi: 'पासवर्ड की पुष्टि करें', mr: 'पासवर्डची पुष्टी करा' },
  fullName: { en: 'Full Legal Name', hi: 'पूरा कानूनी नाम', mr: 'संपूर्ण कायदेशीर नाव' },
  preferredLang: { en: 'Preferred Language', hi: 'पसंदीदा भाषा', mr: 'पसंतीची भाषा' },
  state: { en: 'State', hi: 'राज्य', mr: 'राज्य' },
  city: { en: 'City / District', hi: 'शहर / जिला', mr: 'शहर / जिल्हा' },
  pinCode: { en: 'PIN Code', hi: 'पिन कोड', mr: 'पिन कोड' },
  enterOTP: { en: 'Enter 6-Digit Verification Code', hi: '6-अंकीय सत्यापन कोड दर्ज करें', mr: '६ अंकी पडताळणी कोड टाका' },
  resendOTP: { en: 'Resend OTP', hi: 'ओटीपी पुनः भेजें', mr: 'ओटीपी पुन्हा पाठवा' },
  verifyAndContinue: { en: 'Verify & Continue', hi: 'सत्यापित करें और आगे बढ़ें', mr: 'पडताळा आणि पुढे जा' }
};

export function t(key: keyof typeof translations, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
}

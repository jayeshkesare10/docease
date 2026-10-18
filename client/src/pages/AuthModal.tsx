import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { Language } from '../types';
import { 
  X, 
  FileCheck2, 
  User, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ArrowRight,
  Info
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, language } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'official' | 'otp'>(authModalMode);
  
  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactMode, setContactMode] = useState<'email' | 'mobile'>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [stateName, setStateName] = useState('Maharashtra');
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [preferredLang, setPreferredLang] = useState<Language>(language);

  // Official fields
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [officeId, setOfficeId] = useState<number | undefined>(undefined);

  // OTP flow
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync tab if mode changes
  React.useEffect(() => {
    setActiveTab(authModalMode);
    setError('');
    setSuccessMsg('');
  }, [authModalMode]);

  if (!isAuthModalOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your registered email/mobile and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login(identifier, password);
      login(data.token, data.user);
      closeAuthModal();
    } catch (err: any) {
      if (err.data?.needsOtp) {
        setPendingUserId(err.data.userId);
        setActiveTab('otp');
        setError('Please verify your account with the OTP sent to your contact.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Citizen Register
  const handleRegisterCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || (!email && !mobile) || !password || !confirmPassword) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.registerCitizen({
        fullName,
        email: contactMode === 'email' ? email : undefined,
        mobile: contactMode === 'mobile' ? mobile : undefined,
        password,
        confirmPassword,
        state: stateName,
        city,
        locality,
        pinCode,
        preferredLanguage: preferredLang
      });

      setPendingUserId(data.userId);
      setDevOtpNotice(data.gatewayNotice || null);
      setDevOtpCode(data.devOtp || null);
      if (data.devOtp) {
        setOtpCode(data.devOtp); // pre-populate in dev mode for seamless testing
      }
      setActiveTab('otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId || !otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.verifyOtp(pendingUserId, otpCode);
      login(data.token, data.user);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!pendingUserId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.resendOtp(pendingUserId);
      if (data.devOtp) {
        setDevOtpCode(data.devOtp);
        setOtpCode(data.devOtp);
      }
      setSuccessMsg('A new OTP has been dispatched.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Official Registration
  const handleRegisterOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !department || !designation || !employeeId) {
      setError('All fields are mandatory for government official registration.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.registerOfficial({
        fullName,
        email,
        mobile: mobile || undefined,
        password,
        department,
        designation,
        employeeId,
        officeId: officeId || 1,
        preferredLanguage: preferredLang
      });

      setSuccessMsg(data.message);
      setTimeout(() => {
        setActiveTab('login');
        setSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      setError(err.message || 'Official application failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-navy-950 via-brand-800 to-navy-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block">
                DOCEASE
              </span>
              <span className="text-[11px] text-brand-200 block font-medium">
                {t('brandSubtitle', language)}
              </span>
            </div>
          </div>
          <button onClick={closeAuthModal} className="p-1 rounded-lg text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher (Only shown when not in OTP mode) */}
        {activeTab !== 'otp' && (
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                activeTab === 'login' ? 'bg-white text-brand-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Citizen Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                activeTab === 'register' ? 'bg-white text-brand-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Citizen Sign Up
            </button>
            <button
              onClick={() => { setActiveTab('official'); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                activeTab === 'official' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Official Desk
            </button>
          </div>
        )}

        <div className="p-6">
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('emailOrMobile', language)}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. rahul@example.com or 9876543210"
                    className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('password', language)}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Logging in...' : t('login', language)}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  New to DOCEASE?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setError(''); }}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    Create a free account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: CITIZEN REGISTRATION */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterCitizen} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('fullName', language)} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh S. Patil"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                />
              </div>

              {/* Contact Method Choice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Contact Method for OTP Verification *
                  </label>
                  <div className="flex gap-2 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setContactMode('email')}
                      className={`px-2 py-0.5 rounded ${contactMode === 'email' ? 'bg-brand-100 text-brand-700' : 'text-slate-500'}`}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactMode('mobile')}
                      className={`px-2 py-0.5 rounded ${contactMode === 'mobile' ? 'bg-brand-100 text-brand-700' : 'text-slate-500'}`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                {contactMode === 'email' ? (
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9820123456"
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                )}
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('password', language)} *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('confirmPassword', language)} *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Location & Language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('city', language)}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Mumbai"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('pinCode', language)}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="e.g. 411001"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('preferredLang', language)}
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as Language)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50 font-medium"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating Account...' : 'Continue to OTP Verification'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: OFFICIAL REGISTRATION */}
          {activeTab === 'official' && (
            <form onSubmit={handleRegisterOfficial} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <strong>Government Staff Protocol:</strong> In compliance with security standards, official privileges are NOT granted merely by selecting this option. Your application will be held in pending state until an authorized administrator verifies your employment credentials.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer full name"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@gov.in or similar"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Mobile
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Revenue / RTO / UIDAI"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Nayab Tahsildar, Clerk"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Government Employee ID / Token Reference *
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-MH-2026-981"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Account Password (min 8 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Strong password"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting Application...' : 'Submit Official Credential Application'}
                <Building2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 4: OTP VERIFICATION */}
          {activeTab === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {t('enterOTP', language)}
                </h4>
                <p className="text-xs text-slate-500">
                  Please enter the 6-digit verification code to activate your DOCEASE account.
                </p>
              </div>

              {/* Requirement 4A Gateway Notice & Dev Code */}
              {devOtpNotice && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Info className="w-3.5 h-3.5" />
                    <span>Configuration & Environment Notice</span>
                  </div>
                  <p>{devOtpNotice}</p>
                  {devOtpCode && (
                    <div className="pt-1 flex items-center justify-between font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-blue-800">
                      <span>Simulated Development OTP:</span>
                      <span className="text-sm tracking-widest">{devOtpCode}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50/50 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : t('verifyAndContinue', language)}
                <ShieldCheck className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setPendingUserId(null); }}
                  className="text-slate-500 hover:text-slate-800"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-brand-600 font-bold hover:underline"
                >
                  {t('resendOTP', language)}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

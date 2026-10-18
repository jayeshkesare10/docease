import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { Language } from '../types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  LogOut, 
  Save, 
  ShieldCheck, 
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, officialProfile, language, setLanguage, logout, refreshUser, openAuthModal } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [stateName, setStateName] = useState(user?.state || 'Maharashtra');
  const [city, setCity] = useState(user?.city || '');
  const [locality, setLocality] = useState(user?.locality || '');
  const [pinCode, setPinCode] = useState(user?.pin_code || '');
  const [preferredLang, setPreferredLang] = useState<Language>(user?.preferred_language || language);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto">
        <User className="w-12 h-12 text-brand-600 mx-auto" />
        <h3 className="text-lg font-bold text-navy-950">
          Sign In to Manage Your Profile
        </h3>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl"
        >
          {t('login', language)}
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.auth.updateProfile({
        fullName,
        state: stateName,
        city,
        locality,
        pinCode,
        preferredLanguage: preferredLang
      });
      setLanguage(preferredLang);
      await refreshUser();
      setMessage('Profile settings updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          {t('profile', language)} & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your contact information, preferred language, and account credentials.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        
        {/* User Role Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-sm">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950">{user.full_name}</h3>
              <p className="text-xs text-slate-500">{user.email || user.mobile}</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100/70 px-3 py-1 rounded-full">
            {user.role} Account
          </span>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Personal Details
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="text"
                disabled
                value={user.email || 'None'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                disabled
                value={user.mobile || 'None'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Location & Language */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Location & Language Preferences
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / District
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              System Interface Language
            </label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value as Language)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="en">English (Default)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from All Devices</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

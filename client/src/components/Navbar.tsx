import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { Language } from '../types';
import { 
  FileCheck2, 
  Search, 
  CheckSquare, 
  ShieldCheck, 
  Calendar, 
  User, 
  LogOut, 
  Globe, 
  Bookmark, 
  Building2, 
  Menu, 
  X,
  SlidersHorizontal
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSearch }) => {
  const { user, language, setLanguage, logout, openAuthModal } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', labelKey: 'home', icon: FileCheck2 },
    { id: 'search', labelKey: 'search', icon: Search },
    { id: 'checklists', labelKey: 'checklists', icon: CheckSquare, authRequired: true },
    { id: 'vault', labelKey: 'vault', icon: ShieldCheck, authRequired: true },
    { id: 'appointments', labelKey: 'appointments', icon: Calendar, authRequired: true },
    { id: 'saved', labelKey: 'saved', icon: Bookmark, authRequired: true }
  ];

  const handleNavClick = (tabId: string, authRequired?: boolean) => {
    if (authRequired && !user) {
      openAuthModal('login');
      return;
    }
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div 
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-navy-900 group-hover:text-brand-700 transition-colors">
                  DOCEASE
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 uppercase tracking-wider">
                  India
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {t('brandSubtitle', language)}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.authRequired)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive 
                      ? 'bg-brand-50 text-brand-700 font-bold shadow-2xs' 
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {t(item.labelKey as any, language)}
                </button>
              );
            })}

            {/* Official Workspace Link */}
            {user?.role === 'official' && (
              <button
                onClick={() => handleNavClick('official')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  currentTab === 'official'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                {t('officialPortal', language)}
              </button>
            )}

            {/* Admin CMS Link */}
            {user?.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  currentTab === 'admin'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t('adminCMS', language)}
              </button>
            )}
          </nav>

          {/* Right Action Hub: Language + Auth */}
          <div className="flex items-center gap-2.5">
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="Change Language / भाषा बदलें"
              >
                <Globe className="w-3.5 h-3.5 text-brand-600" />
                <span className="uppercase">{language}</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => handleLangChange('en')}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${language === 'en' ? 'text-brand-600 font-bold bg-brand-50/50' : 'text-slate-700'}`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-[10px] text-brand-600 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => handleLangChange('hi')}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${language === 'hi' ? 'text-brand-600 font-bold bg-brand-50/50' : 'text-slate-700'}`}
                  >
                    <span>हिंदी (Hindi)</span>
                    {language === 'hi' && <span className="text-[10px] text-brand-600 font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => handleLangChange('mr')}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${language === 'mr' ? 'text-brand-600 font-bold bg-brand-50/50' : 'text-slate-700'}`}
                  >
                    <span>मराठी (Marathi)</span>
                    {language === 'mr' && <span className="text-[10px] text-brand-600 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* User Profile / Auth Action */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all text-xs font-medium text-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-[11px]">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-semibold max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                </button>

                <button
                  onClick={logout}
                  title={t('logout', language)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  {t('login', language)}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
                >
                  {t('register', language)}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.authRequired)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {t(item.labelKey as any, language)}
              </button>
            );
          })}

          {user?.role === 'official' && (
            <button
              onClick={() => handleNavClick('official')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100"
            >
              <Building2 className="w-5 h-5 text-amber-600" />
              {t('officialPortal', language)}
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
            >
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
              {t('adminCMS', language)}
            </button>
          )}

          {!user && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { openAuthModal('login'); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-brand-700 bg-brand-50 rounded-xl"
              >
                {t('login', language)}
              </button>
              <button
                onClick={() => { openAuthModal('register'); setIsMobileMenuOpen(false); }}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-brand-600 rounded-xl shadow-sm"
              >
                {t('register', language)}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { Home, Search, ShieldCheck, CheckSquare, User as UserIcon } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { user, language, openAuthModal } = useAuth();

  const handleTabClick = (tabId: string, authRequired: boolean = false) => {
    if (authRequired && !user) {
      openAuthModal('login');
      return;
    }
    setCurrentTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'dashboard', labelKey: 'home', icon: Home, authRequired: false },
    { id: 'search', labelKey: 'search', icon: Search, authRequired: false },
    { id: 'checklists', labelKey: 'checklists', icon: CheckSquare, authRequired: true },
    { id: 'vault', labelKey: 'vault', icon: ShieldCheck, authRequired: true },
    { id: 'profile', labelKey: 'profile', icon: UserIcon, authRequired: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id, item.authRequired)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
              isActive 
                ? 'text-brand-600 font-bold scale-105' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {t(item.labelKey as any, language)}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

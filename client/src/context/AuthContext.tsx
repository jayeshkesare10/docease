import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, OfficialProfile, Language } from '../types';
import { api, getToken, setToken as saveToken, clearToken } from '../api';

interface AuthContextType {
  user: User | null;
  officialProfile: OfficialProfile | null;
  stats: any | null;
  token: string | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'official';
  openAuthModal: (mode?: 'login' | 'register' | 'official') => void;
  closeAuthModal: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(null);
  const [officialProfile, setOfficialProfile] = useState<OfficialProfile | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('docease_lang') as Language) || 'en'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'official'>('login');
  const [loading, setLoading] = useState(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('docease_lang', lang);
    if (user) {
      api.auth.updateProfile({ preferredLanguage: lang }).catch(() => {});
    }
  };

  const refreshUser = async () => {
    if (!getToken()) {
      setUser(null);
      setOfficialProfile(null);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      setUser(data.user);
      if (data.user.preferred_language) {
        setLanguageState(data.user.preferred_language);
        localStorage.setItem('docease_lang', data.user.preferred_language);
      }
      setOfficialProfile(data.officialData || null);
      setStats(data.stats || null);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        clearToken();
        setTokenState(null);
        setUser(null);
        setOfficialProfile(null);
        setStats(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    saveToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    if (newUser.preferred_language) {
      setLanguage(newUser.preferred_language);
    }
    closeAuthModal();
    refreshUser();
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setOfficialProfile(null);
    setStats(null);
  };

  const openAuthModal = (mode: 'login' | 'register' | 'official' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        officialProfile,
        stats,
        token,
        language,
        setLanguage,
        login,
        logout,
        refreshUser,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QRPassModal } from './components/QRPassModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { AuthModal } from './pages/AuthModal';

import { SplashScreen } from './pages/SplashScreen';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ChecklistsPage } from './pages/ChecklistsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { VaultPage } from './pages/VaultPage';
import { SavedPage } from './pages/SavedPage';
import { ProfilePage } from './pages/ProfilePage';
import { OfficialDashboardPage } from './pages/OfficialDashboardPage';
import { AdminCMSPage } from './pages/AdminCMSPage';
import { Appointment } from './types';
import { FileCheck2, ShieldCheck, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>('');
  const [preselectedApptServiceId, setPreselectedApptServiceId] = useState<number | undefined>(undefined);
  
  // Modals
  const [qrPassModalAppt, setQrPassModalAppt] = useState<Appointment | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportQueryText, setReportQueryText] = useState('');

  const navigateToService = (slug: string) => {
    setSelectedServiceSlug(slug);
    setCurrentTab('service_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookAppointmentFromService = (serviceId: number) => {
    setPreselectedApptServiceId(serviceId);
    setCurrentTab('appointments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openReportModal = (queryText = '') => {
    setReportQueryText(queryText);
    setIsReportModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-brand-100 selection:text-brand-900">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => {
          setCurrentTab('search');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-12">
        {currentTab === 'splash' && (
          <SplashScreen
            onStartExploring={() => setCurrentTab('search')}
            onSelectCategory={() => setCurrentTab('search')}
            onOpenSearch={() => setCurrentTab('search')}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            onOpenSearch={() => setCurrentTab('search')}
            onOpenChecklists={() => setCurrentTab('checklists')}
            onOpenVault={() => setCurrentTab('vault')}
            onOpenAppointments={() => setCurrentTab('appointments')}
            onSelectService={navigateToService}
            onSelectCategory={() => setCurrentTab('search')}
            onViewQRPass={(appt) => setQrPassModalAppt(appt)}
          />
        )}

        {currentTab === 'search' && (
          <SearchPage
            onSelectService={navigateToService}
            onOpenReportModal={openReportModal}
          />
        )}

        {currentTab === 'service_detail' && (
          <ServiceDetailPage
            slug={selectedServiceSlug || 'passport-fresh-reissue'}
            onBack={() => setCurrentTab('search')}
            onBookAppointment={handleBookAppointmentFromService}
            onOpenReportModal={openReportModal}
          />
        )}

        {currentTab === 'checklists' && (
          <ChecklistsPage
            onSelectService={navigateToService}
            onOpenSearch={() => setCurrentTab('search')}
            onBookAppointment={(serviceId) => handleBookAppointmentFromService(serviceId)}
          />
        )}

        {currentTab === 'vault' && (
          <VaultPage />
        )}

        {currentTab === 'appointments' && (
          <AppointmentsPage
            onViewQRPass={(appt) => setQrPassModalAppt(appt)}
            preselectedServiceId={preselectedApptServiceId}
          />
        )}

        {currentTab === 'saved' && (
          <SavedPage
            onSelectService={navigateToService}
            onOpenSearch={() => setCurrentTab('search')}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage />
        )}

        {currentTab === 'official' && (
          <OfficialDashboardPage />
        )}

        {currentTab === 'admin' && (
          <AdminCMSPage />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal />
      
      {qrPassModalAppt && (
        <QRPassModal
          isOpen={true}
          onClose={() => setQrPassModalAppt(null)}
          appointment={qrPassModalAppt}
        />
      )}

      {isReportModalOpen && (
        <ReportIssueModal
          isOpen={true}
          onClose={() => setIsReportModalOpen(false)}
          queryText={reportQueryText}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-navy-900 tracking-tight text-sm">DOCEASE</span>
              <span className="text-[11px] text-slate-400 block font-medium">A Documentation Guide for Indian Citizens</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
            All document requirements are grounded in published central and state government notifications. Multi-language support in English, हिंदी, and मराठी.
          </p>

          <div className="flex items-center gap-3 font-semibold text-slate-600">
            <button onClick={() => setCurrentTab('splash')} className="hover:text-brand-600">About</button>
            <span>•</span>
            <button onClick={() => openReportModal()} className="hover:text-brand-600">Feedback</button>
            <span>•</span>
            <button onClick={() => setCurrentTab('official')} className="hover:text-brand-600">Official Portal</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

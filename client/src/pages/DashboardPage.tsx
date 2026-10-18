import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { UserChecklist, Appointment, ServiceSummary } from '../types';
import { 
  Search, 
  CheckSquare, 
  ShieldCheck, 
  Calendar, 
  Bookmark, 
  ArrowRight, 
  Clock, 
  FileCheck2, 
  AlertCircle,
  QrCode,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  onOpenSearch: () => void;
  onOpenChecklists: () => void;
  onOpenVault: () => void;
  onOpenAppointments: () => void;
  onSelectService: (slug: string) => void;
  onSelectCategory: (category: string) => void;
  onViewQRPass: (appt: Appointment) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenSearch,
  onOpenChecklists,
  onOpenVault,
  onOpenAppointments,
  onSelectService,
  onSelectCategory,
  onViewQRPass
}) => {
  const { user, language, openAuthModal, stats } = useAuth();
  const [checklists, setChecklists] = useState<UserChecklist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [featuredServices, setFeaturedServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const srvRes = await api.services.list();
        setFeaturedServices(srvRes.services.slice(0, 6));

        if (user) {
          const [chkRes, apptRes] = await Promise.all([
            api.checklists.list().catch(() => []),
            api.appointments.myAppointments().catch(() => [])
          ]);
          setChecklists(chkRes);
          setAppointments(apptRes);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const activeAppointments = appointments.filter(a => a.status === 'confirmed');
  const recentChecklists = checklists.slice(0, 3);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-brand-900 to-navy-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-brand-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to DOCEASE Documentation Guide</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {user ? `Namaste, ${user.full_name}` : 'Welcome, Indian Citizen'}
          </h1>

          <p className="text-xs sm:text-sm text-brand-100 font-medium leading-relaxed">
            Find required documents, alternative proofs, step-by-step procedures, and office appointment schedules across India.
          </p>

          {/* Prominent Search Input on Dashboard */}
          <div className="pt-2">
            <div 
              onClick={onOpenSearch}
              className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-lg text-slate-400 cursor-pointer hover:border-brand-400 transition-all group"
            >
              <Search className="w-5 h-5 text-brand-600 group-hover:scale-110 transition-transform ml-1" />
              <span className="text-xs sm:text-sm font-medium text-slate-500 flex-1">
                {t('searchPlaceholder', language)}
              </span>
              <span className="px-3 py-1 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs">
                {t('search', language)}
              </span>
            </div>
          </div>
        </div>

        {/* Background decorative document logo */}
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
          <FileCheck2 className="w-80 h-80 stroke-[1]" />
        </div>
      </div>

      {/* Citizen Quick Stats (When logged in) */}
      {user && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div 
            onClick={onOpenChecklists}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Active Checklists</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-navy-950">
                {checklists.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">in progress</span>
            </div>
          </div>

          <div 
            onClick={onOpenVault}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Document Vault</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-navy-950">
                {stats?.vaultDocuments || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">stored files</span>
            </div>
          </div>

          <div 
            onClick={onOpenAppointments}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Appointments</span>
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-navy-950">
                {activeAppointments.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">confirmed</span>
            </div>
          </div>

          <div 
            onClick={() => onSelectCategory('all')}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Saved Guides</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-navy-950">
                {stats?.savedGuides || 0}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">bookmarked</span>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Confirmed Appointment Alert Banner */}
      {user && activeAppointments.length > 0 && (
        <div className="bg-white border-2 border-brand-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                  Upcoming Appointment
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {activeAppointments[0].appointment_number}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-navy-900 mt-1">
                {activeAppointments[0].service_title_en} at {activeAppointments[0].office_name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Date: {activeAppointments[0].appointment_date}</span>
                <span>•</span>
                <span>Slot: {activeAppointments[0].time_slot}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onViewQRPass(activeAppointments[0])}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>View QR Pass</span>
          </button>
        </div>
      )}

      {/* Active Checklists Resume Section */}
      {user && recentChecklists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-extrabold text-navy-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-600" />
              <span>Resume Your Documentation Checklists</span>
            </h3>
            <button
              onClick={onOpenChecklists}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View all ({checklists.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentChecklists.map((chk) => (
              <div
                key={chk.id}
                onClick={() => onSelectService(chk.service_slug)}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {chk.service_category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-navy-900 mt-1 line-clamp-1">
                    {chk.service_title_en}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Readiness Progress</span>
                    <span className="font-bold text-brand-600">{chk.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${chk.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>{chk.available_items} of {chk.total_items} documents marked</span>
                    <span className="text-brand-600 font-bold flex items-center gap-0.5">Resume →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Documentation Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-navy-900">
              Verified Documentation Services
            </h3>
            <p className="text-xs text-slate-500">
              Select a process to inspect required proofs, alternative documents, and procedures.
            </p>
          </div>
          <button
            onClick={onOpenSearch}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredServices.map((srv) => (
            <div
              key={srv.id}
              onClick={() => onSelectService(srv.slug)}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                    {srv.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-navy-900 group-hover:text-brand-600 transition-colors">
                  {srv.title_en}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {srv.description_en}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-[11px]">
                  {srv.totalRequirements} proofs required
                </span>
                <span className="font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View Guide →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Gazette & Advisory Notice */}
      <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
        <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-800">
            Official Citizen Advisory
          </p>
          <p className="leading-relaxed">
            All document requirements are synchronized with Central & State public service acts (e.g., Aadhaar Act 2016, Passports Act 1967, and Motor Vehicles Act). Marking an item on your checklist is for your personal readiness and does not guarantee official clearance until verified at the center.
          </p>
        </div>
      </div>

    </div>
  );
};

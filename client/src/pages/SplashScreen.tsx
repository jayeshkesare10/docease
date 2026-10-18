import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { 
  FileCheck2, 
  Search, 
  ShieldCheck, 
  Calendar, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Lock,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';

interface SplashScreenProps {
  onStartExploring: () => void;
  onSelectCategory: (category: string) => void;
  onOpenSearch: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStartExploring,
  onSelectCategory,
  onOpenSearch
}) => {
  const { language, openAuthModal, user } = useAuth();

  const highlights = [
    {
      title: 'Verified Official Guidance',
      desc: 'Ground truth requirements sourced directly from government gazettes, UIDAI, MEA, and State Portals.',
      icon: CheckCircle2,
      color: 'text-brand-600 bg-brand-50 border-brand-200'
    },
    {
      title: 'Missing Document Solutions',
      desc: 'Don’t have a specific proof? Discover officially approved alternatives and step-by-step procedures to obtain it.',
      icon: HelpCircle,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      title: 'Interactive Citizen Checklists',
      desc: 'Mark documents as available, add notes, and track your readiness before visiting any office.',
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      title: 'Encrypted Document Vault',
      desc: 'Private cloud storage for your identity, address, and educational certificates protected by strict auth.',
      icon: Lock,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ];

  const popularServices = [
    { title: 'Indian Passport (Fresh / Renewal)', category: 'Passport & Travel', slug: 'passport-fresh-reissue' },
    { title: 'Aadhaar Card (Update / New)', category: 'Identity & Citizenship', slug: 'aadhaar-enrollment-update' },
    { title: 'PAN Card (Form 49A / Correction)', category: 'Tax & Financial', slug: 'pan-card-new-correction' },
    { title: 'Income Certificate (Tahsil Office)', category: 'Certificates & Revenue', slug: 'income-certificate' },
    { title: 'Caste Certificate & Validity', category: 'Social Justice & Welfare', slug: 'caste-certificate-validity' },
    { title: 'Driving Licence (Parivahan)', category: 'Transport & Vehicles', slug: 'driving-licence-parivahan' },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 rounded-3xl bg-gradient-to-b from-brand-50/80 via-white to-slate-50 border border-brand-100/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/90 border border-brand-200/90 text-brand-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>National Documentation Guidance Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-navy-950 tracking-tight leading-tight">
            DOCEASE — <span className="text-brand-600">A Documentation Guide</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('tagline', language)}
          </p>

          {/* Search Bar Call-to-Action */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div 
              onClick={onOpenSearch}
              className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white border-2 border-brand-200 shadow-md shadow-brand-500/10 cursor-pointer hover:border-brand-500 hover:shadow-lg transition-all text-slate-400 group"
            >
              <Search className="w-5 h-5 text-brand-600 group-hover:scale-110 transition-transform ml-1" />
              <span className="text-xs sm:text-sm font-medium text-slate-500 flex-1 text-left">
                {t('searchPlaceholder', language)}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs">
                {t('search', language)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartExploring}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102"
            >
              <span>Explore All Guidance Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!user ? (
              <button
                onClick={() => openAuthModal('register')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-brand-700 border border-brand-300 text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102"
              >
                <span>Citizen Sign Up / Login</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectCategory('all')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>My Dashboard</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Feature Value Props */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">
            How DOCEASE Solves Real Documentation Hurdles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Designed for students, parents, working professionals, job seekers, and senior citizens across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {highlights.map((h, idx) => {
            const Icon = h.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5 space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${h.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-navy-900">
                  {h.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {h.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Supported Processes */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">
              Essential Government & Institutional Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Fully verified requirements, alternative proofs, and official procedures.
            </p>
          </div>
          <button
            onClick={onStartExploring}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
          >
            <span>View all 8+ categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularServices.map((srv, idx) => (
            <div
              key={idx}
              onClick={onStartExploring}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                  {srv.category}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-navy-900 mt-2 group-hover:text-brand-600 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Complete checklist, accepted alternative proofs, statutory fees, and verified booking rules.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>View Checklist & Rules</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official Government Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
          <p>
            <strong>Official Integrity Disclaimer:</strong> DOCEASE is an independent citizen documentation guidance platform. All application guidance, fees, and requirements are grounded in verified government notifications. Unless explicitly stated, DOCEASE does not represent an endorsement by or official affiliation with any single government department.
          </p>
        </div>
      </section>

    </div>
  );
};

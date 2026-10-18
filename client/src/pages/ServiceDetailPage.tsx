import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { ServiceDetail, Requirement, Office } from '../types';
import { MissingDocModal } from '../components/MissingDocModal';
import { 
  ArrowLeft, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Building2, 
  CheckSquare, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  FileText,
  MapPin,
  Sparkles,
  Edit3
} from 'lucide-react';

interface ServiceDetailPageProps {
  slug: string;
  onBack: () => void;
  onBookAppointment: (serviceId: number, officeCategory?: string) => void;
  onOpenReportModal: () => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  slug,
  onBack,
  onBookAppointment,
  onOpenReportModal
}) => {
  const { user, language, openAuthModal } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [checklistData, setChecklistData] = useState<any | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Missing doc modal state
  const [selectedMissingDoc, setSelectedMissingDoc] = useState<{
    name: string;
    howToObtain: any;
    alternatives: string[];
  } | null>(null);

  // Expanded alternative accordions
  const [expandedAlts, setExpandedAlts] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.services.getDetail(slug);
        setService(data.service);
        setRequirements(data.requirements);
        setOffices(data.eligibleOffices || []);

        if (user) {
          // Check if checklist exists or get saved status
          const savedList = await api.services.getSaved().catch(() => []);
          setIsSaved(savedList.some(s => s.slug === slug));

          // Check for existing checklist for this service
          const allChecklists = await api.checklists.list().catch(() => []);
          const existing = allChecklists.find(c => c.service_slug === slug);
          if (existing) {
            const fullChecklist = await api.checklists.getDetail(existing.id);
            setChecklistData(fullChecklist);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load documentation guidance.');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [slug, user]);

  const handleStartChecklist = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!service) return;

    try {
      const res = await api.checklists.start(service.id, `${service.title_en} Checklist`);
      const fullChecklist = await api.checklists.getDetail(res.checklistId);
      setChecklistData(fullChecklist);
    } catch (err) {
      console.error('Start checklist error:', err);
    }
  };

  const handleUpdateItemStatus = async (itemId: number, newStatus: 'available' | 'missing' | 'not_applicable') => {
    if (!checklistData) return;
    try {
      await api.checklists.updateItem(itemId, newStatus);
      // Reload checklist
      const updated = await api.checklists.getDetail(checklistData.checklist.id);
      setChecklistData(updated);
    } catch (err) {
      console.error('Update item error:', err);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!service) return;
    try {
      const res = await api.services.toggleSave(service.id);
      setIsSaved(res.saved);
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  const toggleAltAccordion = (reqId: number) => {
    setExpandedAlts(prev => ({ ...prev, [reqId]: !prev[reqId] }));
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500 text-sm">
        Retrieving verified government guidance...
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-8 text-center space-y-4 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">
          {error || 'Documentation Service Not Found'}
        </h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const getLocalizedTitle = () => {
    if (language === 'hi') return service.title_hi || service.title_en;
    if (language === 'mr') return service.title_mr || service.title_en;
    return service.title_en;
  };

  const getLocalizedDesc = () => {
    if (language === 'hi') return service.description_hi || service.description_en;
    if (language === 'mr') return service.description_mr || service.description_en;
    return service.description_en;
  };

  const getLocalizedEligibility = () => {
    if (language === 'hi') return service.eligibility_hi || service.eligibility_en;
    if (language === 'mr') return service.eligibility_mr || service.eligibility_en;
    return service.eligibility_en;
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      
      {/* Top Back and Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services</span>
        </button>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isSaved 
                  ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save Guide'}</span>
            </button>
          )}

          <button
            onClick={onOpenReportModal}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium"
            title="Report inaccurate info"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flagship Service Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
            {service.category}
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Gazette Standard</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-navy-950 tracking-tight">
          {getLocalizedTitle()}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {getLocalizedDesc()}
        </p>

        {/* Quick Meta Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Statutory Fee</span>
              <span className="font-bold">{service.fees_info_en || 'Free / As per state gazette'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Processing Timeline</span>
              <span className="font-bold">{service.processing_time_en || '7 to 15 working days'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Verification Center</span>
              <span className="font-bold">{service.applicable_office_category || 'District Facilitation Center'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION A: Overview & Eligibility */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
        <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600" />
          <span>{t('overview', language)} & Eligibility</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
              {t('eligibility', language)}
            </h4>
            <p>{getLocalizedEligibility()}</p>
          </div>

          {service.conditions_en && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-amber-950">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                {t('conditions', language)}
              </h4>
              <p>{service.conditions_en}</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION B: Required Documents Interactive Checklist (The Primary Engine) */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-600" />
              <span>{t('requiredDocuments', language)} Checklist</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review every required proof, inspect accepted alternatives, and prepare your application file.
            </p>
          </div>

          {!checklistData ? (
            <button
              onClick={handleStartChecklist}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('startChecklistBtn', language)}</span>
            </button>
          ) : (
            <div className="shrink-0 text-right">
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                {checklistData.summary.available} of {checklistData.summary.total} marked available ({checklistData.summary.progressPercent}%)
              </span>
            </div>
          )}
        </div>

        {/* User-Reported Status Notice (Requirement 7) */}
        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p>{t('userReportedNotice', language)}</p>
        </div>

        {/* Progress Bar when checklist active */}
        {checklistData && (
          <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Personal Preparation Progress</span>
              <span className="text-brand-600">{checklistData.summary.progressPercent}% Ready</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${checklistData.summary.progressPercent}%` }}
              />
            </div>
            {checklistData.summary.isReadyForNextStep && (
              <p className="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('checklistCompleted', language)}</span>
              </p>
            )}
          </div>
        )}

        {/* Requirements Interactive List */}
        <div className="space-y-4">
          {(checklistData ? checklistData.items : requirements).map((reqItem: any, idx: number) => {
            const isChecklistMode = !!checklistData;
            const itemStatus = isChecklistMode ? reqItem.status : 'missing';
            const reqName = language === 'hi' ? (reqItem.name_hi || reqItem.name_en) : language === 'mr' ? (reqItem.name_mr || reqItem.name_en) : reqItem.name_en;
            const reqPurpose = language === 'hi' ? (reqItem.purpose_hi || reqItem.purpose_en) : language === 'mr' ? (reqItem.purpose_mr || reqItem.purpose_en) : reqItem.purpose_en;
            const alternatives: string[] = reqItem.accepted_alternatives || [];
            const isAltOpen = !!expandedAlts[reqItem.id || reqItem.requirement_id];

            return (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  itemStatus === 'available'
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                    : itemStatus === 'not_applicable'
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  
                  {/* Left Metadata */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-navy-950">
                        {reqName}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                        reqItem.requirement_type === 'mandatory'
                          ? 'bg-rose-100 text-rose-800'
                          : reqItem.requirement_type === 'conditional'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {reqItem.requirement_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Purpose:</strong> {reqPurpose}
                    </p>

                    {reqItem.format_conditions_en && (
                      <p className="text-[11px] text-slate-500 italic">
                        Condition: {reqItem.format_conditions_en}
                      </p>
                    )}
                  </div>

                  {/* Right Action Buttons */}
                  <div className="shrink-0 flex flex-wrap sm:flex-col items-end gap-2">
                    {/* How to Obtain Missing Document Modal Button */}
                    <button
                      onClick={() => setSelectedMissingDoc({
                        name: reqName,
                        howToObtain: reqItem.how_to_obtain,
                        alternatives: alternatives
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{t('howToObtainBtn', language)}</span>
                    </button>

                    {/* Interactive Status Switcher (Active Checklist Mode) */}
                    {isChecklistMode && (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                        <button
                          onClick={() => handleUpdateItemStatus(reqItem.item_id, 'available')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            itemStatus === 'available'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => handleUpdateItemStatus(reqItem.item_id, 'missing')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            itemStatus === 'missing'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Missing
                        </button>
                        <button
                          onClick={() => handleUpdateItemStatus(reqItem.item_id, 'not_applicable')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            itemStatus === 'not_applicable'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Collapsible Alternatives Drawer */}
                {alternatives.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => toggleAltAccordion(reqItem.id || reqItem.requirement_id)}
                      className="text-brand-600 font-bold hover:underline flex items-center gap-1 text-xs"
                    >
                      <span>{alternatives.length} Officially Accepted Alternatives</span>
                      {isAltOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isAltOpen && (
                      <div className="mt-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 animate-in fade-in duration-150 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          You may provide any one of these documents instead:
                        </p>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                          {alternatives.map((alt, aIdx) => (
                            <li key={aIdx} className="leading-relaxed">
                              {alt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION D: Application Procedure Steps */}
      {service.procedure_steps && service.procedure_steps.length > 0 && (
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
          <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span>{t('applicationProcedure', language)}</span>
          </h2>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-brand-200">
            {service.procedure_steps.map((stepItem: any, sIdx: number) => {
              const stepTitle = language === 'hi' ? (stepItem.title_hi || stepItem.title_en) : language === 'mr' ? (stepItem.title_mr || stepItem.title_en) : stepItem.title_en;
              const stepDesc = language === 'hi' ? (stepItem.desc_hi || stepItem.desc_en) : language === 'mr' ? (stepItem.desc_mr || stepItem.desc_en) : stepItem.desc_en;

              return (
                <div key={sIdx} className="relative group">
                  <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-white shadow-xs">
                    {stepItem.step || sIdx + 1}
                  </div>
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 group-hover:border-brand-200 transition-colors">
                    <h4 className="text-xs sm:text-sm font-bold text-navy-950">
                      {stepTitle}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {stepDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION E: Official Links, Gazette Verification & Next Actions */}
      <section className="bg-gradient-to-tr from-brand-900 via-brand-800 to-navy-950 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-300">
            OFFICIAL INTEGRITY DISCLOSURE
          </span>
          <h3 className="text-xl font-extrabold text-white">
            {t('officialSource', language)}
          </h3>
          <p className="text-xs text-brand-100 max-w-2xl leading-relaxed">
            This guidance is actively verified against official government notifications published by {service.official_source_name}. Last audited on {service.last_verified_date}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={service.official_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-900 font-bold text-xs sm:text-sm shadow-sm hover:bg-brand-50 transition-colors"
          >
            <span>{t('openOfficialPortal', language)}</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => onBookAppointment(service.id, service.applicable_office_category)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>{t('bookAppointmentBtn', language)}</span>
          </button>
        </div>
      </section>

      {/* Missing Doc Explanation Modal */}
      {selectedMissingDoc && (
        <MissingDocModal
          isOpen={true}
          onClose={() => setSelectedMissingDoc(null)}
          docName={selectedMissingDoc.name}
          howToObtain={selectedMissingDoc.howToObtain}
          alternatives={selectedMissingDoc.alternatives}
        />
      )}

    </div>
  );
};

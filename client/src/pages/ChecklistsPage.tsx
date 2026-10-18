import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { UserChecklist } from '../types';
import { 
  CheckSquare, 
  ArrowRight, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface ChecklistsPageProps {
  onSelectService: (slug: string) => void;
  onOpenSearch: () => void;
  onBookAppointment: (serviceId: number) => void;
}

export const ChecklistsPage: React.FC<ChecklistsPageProps> = ({
  onSelectService,
  onOpenSearch,
  onBookAppointment
}) => {
  const { user, language, openAuthModal } = useAuth();
  const [checklists, setChecklists] = useState<UserChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchChecklists = async () => {
      try {
        const data = await api.checklists.list();
        setChecklists(data);
      } catch (err) {
        console.error('Fetch checklists error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [user]);

  const handleDeleteChecklist = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this checklist?')) return;
    try {
      await api.checklists.delete(id);
      setChecklists(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete checklist error:', err);
    }
  };

  if (!user) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto">
        <CheckSquare className="w-12 h-12 text-brand-600 mx-auto" />
        <h3 className="text-lg font-bold text-navy-950">
          Sign In to Access Your Personalized Checklists
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Create customized preparation checklists, mark your available proofs, track your progress, and resume anytime.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          {t('login', language)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t('checklists', language)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Independent preparation checklists belonging to your profile. Progress is saved persistently to your account.
          </p>
        </div>

        <button
          onClick={onOpenSearch}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Start New Checklist</span>
        </button>
      </div>

      {/* Notice */}
      <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <p>{t('userReportedNotice', language)}</p>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading your active checklists...
        </div>
      ) : checklists.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {checklists.map((chk) => (
            <div
              key={chk.id}
              onClick={() => onSelectService(chk.service_slug)}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                      {chk.service_category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      chk.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {chk.isComplete ? 'Ready for Next Step' : 'In Progress'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-navy-950 group-hover:text-brand-600 transition-colors">
                    {chk.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Service: {chk.service_title_en}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteChecklist(e, chk.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete checklist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectService(chk.service_slug)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition-colors"
                  >
                    <span>{t('resumeChecklistBtn', language)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Progress Bar & Readiness Status */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Document Readiness</span>
                  <span className="font-bold text-brand-600">{chk.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${chk.progressPercent}%` }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500">
                  <span>{chk.available_items} marked available, {chk.missing_items} missing of {chk.total_items} total</span>

                  {chk.isComplete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All documents ready</span>
                      </span>
                      {chk.applicable_office_category && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookAppointment(chk.service_id);
                          }}
                          className="font-bold text-brand-600 hover:underline"
                        >
                          Book appointment now →
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-700 font-medium">
                      Inspect missing documents to view accepted alternatives
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-navy-900">
              No Active Checklists Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Explore government services like Passport, Aadhaar, PAN, or College Admissions and click "Start Preparation Checklist" to track your documents here.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenSearch}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Explore Documentation Services
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

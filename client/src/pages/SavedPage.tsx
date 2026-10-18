import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { Bookmark, ArrowRight, Trash2 } from 'lucide-react';

interface SavedPageProps {
  onSelectService: (slug: string) => void;
  onOpenSearch: () => void;
}

export const SavedPage: React.FC<SavedPageProps> = ({ onSelectService, onOpenSearch }) => {
  const { user, language, openAuthModal } = useAuth();
  const [savedServices, setSavedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    api.services.getSaved().then(setSavedServices).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.services.toggleSave(id);
      setSavedServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto">
        <Bookmark className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-navy-950">
          Sign In to View Saved Guides
        </h3>
        <p className="text-xs text-slate-500">
          Bookmark important documentation processes and access them anytime.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl"
        >
          {t('login', language)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          {t('saved', language)}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Government and institutional documentation processes bookmarked to your profile.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading saved guides...
        </div>
      ) : savedServices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedServices.map((srv) => (
            <div
              key={srv.id}
              onClick={() => onSelectService(srv.slug)}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                    {srv.category}
                  </span>
                  <button
                    onClick={(e) => handleRemove(e, srv.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-navy-900">
                  {srv.title_en}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {srv.description_en}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>View Guide</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-navy-900">No Saved Guides Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any document guidance page to save it for quick reference.
          </p>
          <button
            onClick={onOpenSearch}
            className="px-5 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl"
          >
            Explore Services
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { ServiceSummary } from '../types';
import { 
  Search, 
  Filter, 
  Bookmark, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileText,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface SearchPageProps {
  onSelectService: (slug: string) => void;
  onOpenReportModal: (queryText?: string) => void;
  initialQuery?: string;
  initialCategory?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  onSelectService,
  onOpenReportModal,
  initialQuery = '',
  initialCategory = 'all'
}) => {
  const { language, user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [savedServiceIds, setSavedServiceIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch categories & saved items on mount
  useEffect(() => {
    api.services.categories().then(setCategories).catch(() => {});
    if (user) {
      api.services.getSaved().then(saved => {
        setSavedServiceIds(new Set(saved.map(s => s.id)));
      }).catch(() => {});
    }
  }, [user]);

  // Fetch search results
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await api.services.list(query, selectedCategory);
        setServices(res.services);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchServices();
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  const handleToggleSave = async (e: React.MouseEvent, serviceId: number) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await api.services.toggleSave(serviceId);
      setSavedServiceIds(prev => {
        const next = new Set(prev);
        if (res.saved) next.add(serviceId);
        else next.delete(serviceId);
        return next;
      });
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  const getLocalizedTitle = (s: ServiceSummary) => {
    if (language === 'hi') return s.title_hi || s.title_en;
    if (language === 'mr') return s.title_mr || s.title_en;
    return s.title_en;
  };

  const getLocalizedDesc = (s: ServiceSummary) => {
    if (language === 'hi') return s.description_hi || s.description_en;
    if (language === 'mr') return s.description_mr || s.description_en;
    return s.description_en;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Search Header */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          {t('search', language)}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Search by document name, alternative proof, eligibility keyword, or department in English, Hindi, or Marathi.
        </p>

        {/* Large Search Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder', language)}
            className="w-full pl-11 pr-10 py-3.5 sm:py-4 rounded-2xl border-2 border-slate-200/90 focus:border-brand-500 focus:outline-hidden focus:ring-4 focus:ring-brand-100 text-sm sm:text-base font-medium shadow-xs placeholder:text-slate-400 bg-white"
          />
          <Search className="w-5 h-5 text-brand-600 absolute left-4 top-4 sm:top-4.5" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 sm:top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-navy-950 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {t('allCategories', language)}
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === cat.category
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{cat.category}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === cat.category ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing <strong>{services.length}</strong> official documentation {services.length === 1 ? 'guide' : 'guides'}
        </span>
        <button
          onClick={() => onOpenReportModal(query)}
          className="text-brand-600 hover:underline font-bold flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Can't find your document? Report it</span>
        </button>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Searching verified government databases...
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => {
            const isSaved = savedServiceIds.has(srv.id);
            return (
              <div
                key={srv.id}
                onClick={() => onSelectService(srv.slug)}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                      {srv.category}
                    </span>

                    {user && (
                      <button
                        onClick={(e) => handleToggleSave(e, srv.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-600'
                        }`}
                        title={isSaved ? 'Saved to Profile' : 'Save Guidance'}
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-navy-900 group-hover:text-brand-600 transition-colors">
                    {getLocalizedTitle(srv)}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {getLocalizedDesc(srv)}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-600">{srv.totalRequirements} proofs</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                      Verified
                    </span>
                  </div>

                  <span className="font-bold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View Guide →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-navy-900">
              No matching document or service found for "{query}"
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              We frequently update requirements from central and state gazettes. You can request this document or report missing guidance to our verification team.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => { setQuery(''); setSelectedCategory('all'); }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Clear Search Filters
            </button>
            <button
              onClick={() => onOpenReportModal(query)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Report Missing Document
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

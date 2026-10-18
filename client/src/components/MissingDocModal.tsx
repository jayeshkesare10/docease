import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { HowToObtain } from '../types';
import { 
  X, 
  HelpCircle, 
  MapPin, 
  FileText, 
  ExternalLink, 
  IndianRupee, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface MissingDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  docName: string;
  howToObtain?: HowToObtain;
  alternatives?: string[];
}

export const MissingDocModal: React.FC<MissingDocModalProps> = ({
  isOpen,
  onClose,
  docName,
  howToObtain,
  alternatives = []
}) => {
  const { language } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                {t('missingDocModalTitle', language)}
              </h3>
              <p className="text-brand-100 text-xs sm:text-sm mt-0.5 font-medium line-clamp-1">
                {docName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-800 max-h-[75vh] overflow-y-auto">
          
          {/* Important Alternative Documents Alert */}
          {alternatives.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    {t('acceptedAlternatives', language)}
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 mb-2">
                    Under official rules, you do NOT need this specific document if you can present any of these approved alternatives:
                  </p>
                  <ul className="list-disc list-inside text-xs font-medium text-slate-700 space-y-1">
                    {alternatives.map((alt, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {howToObtain ? (
            <div className="space-y-4">
              
              {/* Where to Apply */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('whereToApply', language)}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {howToObtain.apply_where}
                  </p>
                </div>
              </div>

              {/* Required Proofs */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <FileText className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t('requiredProofsForMissing', language)}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {howToObtain.required_docs}
                  </p>
                </div>
              </div>

              {/* Fee & Timeline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <IndianRupee className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      {t('officialFee', language)}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {howToObtain.fee}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      {t('processingTime', language)}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {howToObtain.processing_time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Next Step */}
              <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800 block mb-1">
                  {t('nextConcreteAction', language)}
                </span>
                <p className="text-sm text-brand-950 font-medium">
                  {howToObtain.next_action}
                </p>
              </div>

              {/* Official Link */}
              {howToObtain.official_url && (
                <div className="pt-2">
                  <a
                    href={howToObtain.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition-all"
                  >
                    <span>{t('openOfficialPortal', language)}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-sm">
              Detailed procedure for this specific requirement is being reviewed by official authorities. Check accepted alternatives above or contact the nearest facilitation center.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};

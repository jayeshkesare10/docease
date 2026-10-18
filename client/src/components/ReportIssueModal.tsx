import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { X, AlertCircle, CheckCircle2, Send } from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: number;
  queryText?: string;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  serviceId,
  queryText
}) => {
  const { language } = useAuth();
  const [reportType, setReportType] = useState('missing_info');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim() || details.trim().length < 5) {
      setError('Please provide specific details regarding the document or requirement.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.services.reportIssue({
        serviceId,
        reportType,
        queryText,
        details: details.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              {t('reportIssueBtn', language)}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Feedback Submitted</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {t('reportSuccess', language)}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="missing_info">Missing Document or Service Information</option>
                  <option value="outdated_link">Outdated or Broken Official URL</option>
                  <option value="procedure_changed">Government Procedure or Fee Changed</option>
                  <option value="alternative_proof">Suggest Additional Accepted Alternative</option>
                  <option value="other">General Documentation Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Explanation
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what information is missing, which alternative document was accepted at your office, or what official guideline has updated..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

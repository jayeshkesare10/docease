import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { VaultDocument } from '../types';
import { 
  ShieldCheck, 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Eye,
  File,
  X
} from 'lucide-react';

export const VaultPage: React.FC = () => {
  const { user, language, openAuthModal, refreshUser } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Identity Proof');
  const [docNotes, setDocNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Preview state
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDocs = async () => {
      try {
        const data = await api.vault.list();
        setDocuments(data);
      } catch (err) {
        console.error('Fetch vault error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [user]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    if (uploadFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10MB limit.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', docTitle || uploadFile.name);
    formData.append('category', docCategory);
    if (docNotes) formData.append('notes', docNotes);

    try {
      const res = await api.vault.upload(formData);
      setDocuments(prev => [res.document, ...prev]);
      setUploadSuccess('Document securely encrypted and saved in your vault.');
      refreshUser();
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadFile(null);
        setDocTitle('');
        setDocNotes('');
        setUploadSuccess('');
      }, 1500);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from your vault?`)) return;
    try {
      await api.vault.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      refreshUser();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!user) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4 max-w-lg mx-auto">
        <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="text-lg font-bold text-navy-950">
          Sign In to Access Your Secure Document Vault
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Store digital copies of your Aadhaar, 10th marksheet, PAN, and address proofs in your private encrypted vault.
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
            {t('vaultTitle', language)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('vaultDescription', language)}
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>{t('uploadDocument', language)}</span>
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          <strong>Private Storage Guarantee:</strong> Your documents are stored outside the public web root. Access is permitted strictly through authenticated, signed session requests belonging to your account.
        </p>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading your document vault...
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-brand-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                    {doc.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {formatFileSize(doc.file_size)}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-brand-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy-950 line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                      {doc.original_name}
                    </p>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-xs text-slate-500 mt-2 italic bg-slate-50/60 p-2 rounded-lg">
                    "{doc.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Preview inline"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <a
                    href={api.vault.getDownloadUrl(doc.id)}
                    download
                    className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                <button
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete from vault"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-navy-900">
              Your Document Vault is Empty
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {t('emptyVault', language)}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {t('uploadDocument', language)}
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-600" />
                <span>Upload to Document Vault</span>
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl">
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select File (PDF, JPG, PNG up to 10MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. 10th Board Marksheet / Aadhaar Card"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="Identity Proof">Identity Proof (Aadhaar, Voter ID, PAN)</option>
                  <option value="Address Proof">Address Proof (Electricity, Water, Rent)</option>
                  <option value="Educational Certificates">Educational Certificates (10th, 12th, Degree)</option>
                  <option value="Income & Financial">Income & Financial Proofs (Salary, ITR)</option>
                  <option value="Caste & Social">Caste & Domicile Certificates</option>
                  <option value="General">Other Documents</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Personal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Original retained at home; copy certified by Gazette Officer"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {uploading ? 'Encrypting & Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h4 className="text-sm font-bold text-white truncate max-w-md">
                {previewDoc.title} ({previewDoc.original_name})
              </h4>
              <button onClick={() => setPreviewDoc(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-2 bg-slate-100 flex items-center justify-center overflow-auto min-h-[300px]">
              {previewDoc.mime_type.startsWith('image/') ? (
                <img
                  src={api.vault.getViewUrl(previewDoc.id)}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-xs"
                />
              ) : (
                <iframe
                  src={api.vault.getViewUrl(previewDoc.id)}
                  title={previewDoc.title}
                  className="w-full h-[60vh] rounded-xl border border-slate-200"
                />
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">
                {formatFileSize(previewDoc.file_size)} • {previewDoc.category}
              </span>
              <a
                href={api.vault.getDownloadUrl(previewDoc.id)}
                download
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
              >
                Download Copy
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

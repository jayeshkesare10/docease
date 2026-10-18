import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { 
  SlidersHorizontal, 
  UserCheck, 
  FileEdit, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building2, 
  ExternalLink,
  Plus,
  Save,
  Check
} from 'lucide-react';

export const AdminCMSPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'services' | 'feedback'>('approvals');
  const [pendingOfficials, setPendingOfficials] = useState<any[]>([]);
  const [feedbackReports, setFeedbackReports] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New service form
  const [isAddingService, setIsAddingService] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState('Certificates & Revenue');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleHi, setNewTitleHi] = useState('');
  const [newTitleMr, setNewTitleMr] = useState('');
  const [newDescEn, setNewDescEn] = useState('');
  const [newOfficialSource, setNewOfficialSource] = useState('');
  const [newOfficialUrl, setNewOfficialUrl] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [officials, fb, srv] = await Promise.all([
          api.admin.getPendingOfficials().catch(() => []),
          api.admin.getFeedback().catch(() => []),
          api.services.list().catch(() => ({ services: [] }))
        ]);
        setPendingOfficials(officials);
        setFeedbackReports(fb);
        setServices(srv.services);
      } catch (err) {
        console.error('Fetch admin data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveOfficial = async (profileId: number) => {
    try {
      await api.admin.approveOfficial(profileId);
      setPendingOfficials(prev => prev.filter(p => p.profile_id !== profileId));
      setActionSuccess('Official application approved and credentials activated.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    }
  };

  const handleRejectOfficial = async (profileId: number) => {
    const reason = prompt('Please enter reason for rejection:') || 'Verification criteria not satisfied';
    try {
      await api.admin.rejectOfficial(profileId, reason);
      setPendingOfficials(prev => prev.filter(p => p.profile_id !== profileId));
      setActionSuccess('Official application rejected.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.addService({
        slug: newSlug,
        category: newCategory,
        titleEn: newTitleEn,
        titleHi: newTitleHi,
        titleMr: newTitleMr,
        descriptionEn: newDescEn,
        officialSourceName: newOfficialSource,
        officialSourceUrl: newOfficialUrl,
        lastVerifiedDate: new Date().toISOString().split('T')[0],
        verificationStatus: 'verified'
      });
      const srvRes = await api.services.list();
      setServices(srvRes.services);
      setIsAddingService(false);
      setActionSuccess('New documentation service published.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add service.');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-indigo-950 to-navy-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
              CENTRAL ADMINISTRATOR CONTROLS
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Verified Information & Officials Management
            </h1>
            <p className="text-xs text-indigo-200">
              Review official registration applications, publish verified documentation guidelines, and inspect citizen reports.
            </p>
          </div>

          <div className="flex bg-white/10 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'approvals' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Official Approvals ({pendingOfficials.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'services' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'feedback' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Feedback ({feedbackReports.length})
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: PENDING OFFICIAL APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-navy-900">
                Pending Government Official Applications
              </h3>
              <p className="text-xs text-slate-500">
                Under Requirement 4B, officials must be verified and approved before receiving privileged dashboard access.
              </p>
            </div>
          </div>

          {pendingOfficials.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {pendingOfficials.map((profile) => (
                <div
                  key={profile.profile_id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-navy-950">
                          {profile.full_name}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                          Pending Review
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {profile.designation} • {profile.department} (Emp ID: <strong>{profile.employee_id}</strong>)
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Email: {profile.email} • Mobile: {profile.mobile || 'N/A'} • Assigned Office: {profile.office_name || 'General'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveOfficial(profile.profile_id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Approve Access</span>
                      </button>

                      <button
                        onClick={() => handleRejectOfficial(profile.profile_id)}
                        className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No pending official credential applications at this time.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-navy-900">
              Published Documentation Services
            </h3>

            <button
              onClick={() => setIsAddingService(!isAddingService)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service Guide</span>
            </button>
          </div>

          {/* New Service Form */}
          {isAddingService && (
            <form onSubmit={handleAddService} className="p-6 bg-white rounded-3xl border border-brand-200 shadow-md space-y-4">
              <h4 className="text-sm font-bold text-navy-900">Create New Documentation Service Entry</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slug (e.g. birth-certificate)</label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title (English) *</label>
                <input
                  type="text"
                  required
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. Birth Certificate (Municipal Corporation)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={newDescEn}
                  onChange={(e) => setNewDescEn(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Source Name *</label>
                  <input
                    type="text"
                    required
                    value={newOfficialSource}
                    onChange={(e) => setNewOfficialSource(e.target.value)}
                    placeholder="e.g. Registrar General of India"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Portal URL *</label>
                  <input
                    type="url"
                    required
                    value={newOfficialUrl}
                    onChange={(e) => setNewOfficialUrl(e.target.value)}
                    placeholder="https://crsorgi.gov.in"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingService(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
                >
                  Publish Service
                </button>
              </div>
            </form>
          )}

          {/* Existing Services List */}
          <div className="grid grid-cols-1 gap-3">
            {services.map((srv) => (
              <div key={srv.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-navy-900 block">{srv.title_en}</span>
                  <span className="text-slate-500">{srv.category} • Verified: {srv.last_verified_date}</span>
                </div>
                <a
                  href={srv.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CITIZEN FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-navy-900">
            Citizen Reported Issues & Missing Documentation Inquiries
          </h3>

          {feedbackReports.length > 0 ? (
            <div className="space-y-3">
              {feedbackReports.map((fb) => (
                <div key={fb.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-navy-900">Type: {fb.report_type}</span>
                    <span className="text-[11px] text-slate-400">{fb.created_at}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">"{fb.details}"</p>
                  <p className="text-[11px] text-slate-400">
                    Reporter: {fb.citizen_name || 'Anonymous Citizen'} ({fb.citizen_email || 'No email'})
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
              No open citizen reports.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

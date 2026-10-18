import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { api } from '../api';
import { 
  Building2, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  User, 
  ShieldCheck, 
  Search, 
  FileText, 
  History, 
  Check, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export const OfficialDashboardPage: React.FC = () => {
  const { user, officialProfile, language } = useAuth();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'qr_verify' | 'roster' | 'audit'>('qr_verify');
  const [loading, setLoading] = useState(true);

  // QR Verification State
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState('');
  
  // Outcome recording state
  const [outcomeStatus, setOutcomeStatus] = useState<'verified' | 'flagged_issues' | 'completed'>('verified');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [recordingOutcome, setRecordingOutcome] = useState(false);
  const [outcomeSuccess, setOutcomeSuccess] = useState('');

  // Roster Filter
  const [rosterDate, setRosterDate] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatus, setRosterStatus] = useState('all');

  useEffect(() => {
    const fetchOfficialData = async () => {
      try {
        const [dash, appts, logs] = await Promise.all([
          api.official.getDashboard().catch(() => null),
          api.official.getAppointments().catch(() => []),
          api.official.getAuditLogs().catch(() => [])
        ]);
        setDashboardData(dash);
        setAppointments(appts);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Fetch official dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficialData();
  }, []);

  const handleVerifyQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrTokenInput.trim()) {
      setVerificationError('Please enter a valid QR verification token.');
      return;
    }

    setVerifying(true);
    setVerificationError('');
    setVerificationResult(null);
    setOutcomeSuccess('');

    try {
      const res = await api.official.verifyQR(qrTokenInput.trim());
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationError(err.message || 'Token verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationResult?.appointment) return;

    setRecordingOutcome(true);
    try {
      const res = await api.official.recordOutcome({
        appointmentId: verificationResult.appointment.id,
        status: outcomeStatus,
        notes: outcomeNotes
      });
      setOutcomeSuccess(res.message);
      // Reload appointments and audit logs
      const [appts, logs] = await Promise.all([
        api.official.getAppointments(),
        api.official.getAuditLogs()
      ]);
      setAppointments(appts);
      setAuditLogs(logs);
    } catch (err: any) {
      alert(err.message || 'Failed to record outcome.');
    } finally {
      setRecordingOutcome(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Authenticating official credentials...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Official Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>Government Official Desk (Authorized Access)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {user?.full_name}
            </h1>
            <p className="text-xs text-slate-300">
              {officialProfile?.designation} • {officialProfile?.department} (ID: {officialProfile?.employee_id})
            </p>
          </div>

          <div className="flex bg-white/10 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('qr_verify')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'qr_verify' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              QR Scanner / Token
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'roster' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Office Roster ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'audit' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block">Today's Queue</span>
            <span className="text-2xl font-black text-navy-950 mt-1 block">
              {dashboardData.stats?.todayCount || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block">Confirmed Slots</span>
            <span className="text-2xl font-black text-brand-600 mt-1 block">
              {dashboardData.stats?.confirmedCount || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block">Completed Verifications</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {dashboardData.stats?.completedCount || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block">Total Assigned</span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">
              {dashboardData.stats?.totalAssigned || 0}
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: QR TOKEN VERIFIER */}
      {activeTab === 'qr_verify' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Verification Form */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleVerifyQR} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-extrabold text-navy-900">
                  Verify Citizen QR Pass
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Scan citizen's QR pass or paste the opaque verification token reference (e.g., <code>vtoken_...</code>).
              </p>

              {verificationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {verificationError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cryptographic Verification Token *
                </label>
                <input
                  type="text"
                  required
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                  placeholder="vtoken_8f9a..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {verifying ? 'Validating Token on Server...' : 'Verify Citizen Pass'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Verification Result Display */}
          <div className="lg:col-span-7 space-y-4">
            {verificationResult?.appointment ? (
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Valid Appointment Record Verified</span>
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">
                    {verificationResult.appointment.appointment_number}
                  </span>
                </div>

                {/* Citizen Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Citizen Name</span>
                    <span className="font-extrabold text-navy-950 text-sm">
                      {verificationResult.appointment.citizen_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Mobile Contact</span>
                    <span className="font-semibold text-slate-700">
                      {verificationResult.appointment.citizen_mobile || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Service</span>
                    <span className="font-bold text-brand-700">
                      {verificationResult.appointment.service_title}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Scheduled Slot</span>
                    <span className="font-bold text-slate-800">
                      {verificationResult.appointment.appointment_date} ({verificationResult.appointment.time_slot})
                    </span>
                  </div>
                </div>

                {/* Citizen Checklist Preparation Status */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                    Citizen Self-Reported Document Checklist
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      {verificationResult.citizenChecklist.availableItems} of {verificationResult.citizenChecklist.totalItems} documents marked ready
                    </span>
                    <span className={`font-bold ${verificationResult.citizenChecklist.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {verificationResult.citizenChecklist.ready ? 'All Proofs Ready' : 'Incomplete Proofs'}
                    </span>
                  </div>
                </div>

                {/* Outcome Form */}
                <form onSubmit={handleRecordOutcome} className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                    Record Official Verification Outcome
                  </h4>

                  {outcomeSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                      {outcomeSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('verified')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        outcomeStatus === 'verified'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      All Docs Verified
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('flagged_issues')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        outcomeStatus === 'flagged_issues'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Flag Missing Proofs
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('completed')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        outcomeStatus === 'completed'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Process Completed
                    </button>
                  </div>

                  <input
                    type="text"
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="Official remarks (e.g. verified original 10th LC and Aadhaar)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />

                  <button
                    type="submit"
                    disabled={recordingOutcome}
                    className="w-full py-2.5 bg-navy-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {recordingOutcome ? 'Saving Outcome...' : 'Save Official Outcome & Log Audit Trail'}
                  </button>
                </form>

              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm space-y-2">
                <QrCode className="w-10 h-10 mx-auto text-slate-300" />
                <p>No QR Token scanned yet. Enter a token above to inspect appointment details.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: OFFICE ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-navy-900">
              Assigned Appointment Queue
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Search citizen or appointment number..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="date"
                value={rosterDate}
                onChange={(e) => setRosterDate(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-200"
              />
              <select
                value={rosterStatus}
                onChange={(e) => setRosterStatus(e.target.value)}
                className="text-xs p-2.5 rounded-xl border border-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Appt No</th>
                  <th className="p-3.5">Citizen</th>
                  <th className="p-3.5">Service</th>
                  <th className="p-3.5">Date & Slot</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{a.appointment_number}</td>
                    <td className="p-3.5 font-bold text-navy-950">{a.citizen_name}</td>
                    <td className="p-3.5">{a.service_title}</td>
                    <td className="p-3.5">{a.appointment_date} ({a.time_slot})</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            <span>Official Action & Verification Audit Log</span>
          </h3>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-navy-900">{log.appointment_number} - {log.citizen_name}</span>
                  <span className="text-[11px] text-slate-400">{log.verified_at}</span>
                </div>
                <p className="text-slate-600">
                  Service: <strong>{log.service_title}</strong> • Outcome: <span className="font-bold text-brand-600 uppercase">{log.status}</span>
                </p>
                {log.notes && (
                  <p className="text-slate-500 italic">"{log.notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

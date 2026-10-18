import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { Appointment } from '../types';
import { 
  X, 
  Printer, 
  QrCode, 
  Building, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface QRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({ isOpen, onClose, appointment }) => {
  const { language } = useAuth();

  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:m-0 print:p-0"
        role="dialog"
      >
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-navy-950 via-brand-800 to-navy-900 text-white p-5 text-center relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1 rounded-lg text-white/70 hover:text-white print:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2 text-white">
            <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-widest uppercase font-bold text-brand-300">
            DOCEASE FACILITATION PASS
          </span>
          <h3 className="text-lg font-extrabold text-white mt-0.5">
            {t('bookingConfirmation', language)}
          </h3>
          <p className="text-xs text-brand-200 font-mono mt-1 font-semibold">
            {appointment.appointment_number}
          </p>
        </div>

        {/* Pass Card Body */}
        <div className="p-6 space-y-5">
          
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-inner">
            {appointment.qr_data_url ? (
              <img 
                src={appointment.qr_data_url} 
                alt="Appointment QR Verification Token" 
                className="w-48 h-48 rounded-xl object-contain shadow-xs bg-white p-2 border border-slate-200"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                <QrCode className="w-16 h-16" />
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-3 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Opaque Cryptographic Token Verified</span>
            </div>
          </div>

          {/* Appointment Meta Details */}
          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="pt-2 flex justify-between items-start">
              <span className="text-slate-500 font-medium">Service</span>
              <span className="font-bold text-slate-900 text-right max-w-[220px]">
                {appointment.service_title_en}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-start">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-brand-600" />
                Office
              </span>
              <div className="text-right max-w-[220px]">
                <p className="font-bold text-slate-900">{appointment.office_name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{appointment.office_address}, {appointment.office_city}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                Date
              </span>
              <span className="font-bold text-slate-900">
                {appointment.appointment_date}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Time Slot
              </span>
              <span className="font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md">
                {appointment.time_slot}
              </span>
            </div>
          </div>

          {/* Official Security Advisory Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              {t('qrPassNotice', language)}
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

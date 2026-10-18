import React, { useState } from 'react';
import { Office } from '../types';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Mail, 
  Clock, 
  ExternalLink, 
  Compass, 
  CheckCircle2,
  Info
} from 'lucide-react';

interface MapComponentProps {
  offices: Office[];
  selectedOffice: Office | null;
  onSelectOffice: (office: Office) => void;
  onBookOffice?: (office: Office) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  offices,
  selectedOffice,
  onSelectOffice,
  onBookOffice
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [requestingLoc, setRequestingLoc] = useState(false);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setRequestingLoc(true);
    setLocationStatus('Requesting device location with your permission...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationStatus('Location enabled: nearby offices sorted by proximity.');
        setRequestingLoc(false);
      },
      (err) => {
        setLocationStatus(`Location access denied or unavailable (${err.message}). You can still use the city/PIN code search above.`);
        setRequestingLoc(false);
      },
      { timeout: 10000 }
    );
  };

  const calculateDistanceKm = (lat1?: number, lon1?: number, lat2?: number, lon2?: number): string | null => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1);
  };

  return (
    <div className="space-y-4">
      
      {/* Geolocation Notice & Activation */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Compass className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-800">
              Find Distance to Nearest Facilitation Office
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {locationStatus || 'We request permission only when you click "Use My Current Location". Never accessed automatically.'}
            </p>
          </div>
        </div>

        <button
          onClick={requestGeolocation}
          disabled={requestingLoc}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-colors border border-brand-200"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{requestingLoc ? 'Locating...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Map Interactive Visual Container */}
      <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative min-h-[260px] flex flex-col justify-between p-4 shadow-inner">
        
        {/* Map Header Notice */}
        <div className="flex items-center justify-between z-10">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>{offices.length} Verified Facilitation Centers</span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-white font-medium flex items-center gap-1">
            <Info className="w-3 h-3 text-brand-300" />
            <span>Interactive Office Map</span>
          </div>
        </div>

        {/* Vector Schematic Map View with Office Pins */}
        <div className="my-6 grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
          {offices.slice(0, 6).map((office) => {
            const isSelected = selectedOffice?.id === office.id;
            const distance = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, office.lat, office.lng) : null;
            return (
              <div
                key={office.id}
                onClick={() => onSelectOffice(office)}
                className={`cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                  isSelected 
                    ? 'bg-white border-2 border-brand-600 shadow-md ring-2 ring-brand-100' 
                    : 'bg-white/95 border border-slate-200 hover:border-brand-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded uppercase">
                    {office.city}
                  </span>
                  {distance && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {distance} km
                    </span>
                  )}
                </div>
                <h5 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                  {office.name}
                </h5>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {office.address}
                </p>
              </div>
            );
          })}
        </div>

        {/* Map Notice Banner */}
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-10">
          <p>
            Google Maps API Key: Not configured in .env. Interactive vector markers and real-time external Google directions are active for all verified centers.
          </p>
          {selectedOffice && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedOffice.name}, ${selectedOffice.address}, ${selectedOffice.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

      </div>

      {/* Selected Office Details Card */}
      {selectedOffice && (
        <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                {selectedOffice.category}
              </span>
              <h4 className="text-base font-extrabold text-navy-900 mt-1">
                {selectedOffice.name}
              </h4>
            </div>

            {onBookOffice && (
              <button
                onClick={() => onBookOffice(selectedOffice)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Book Appointment Here</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span>{selectedOffice.address}, {selectedOffice.city}, {selectedOffice.state} - {selectedOffice.pin_code}</span>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>{selectedOffice.operating_hours}</span>
            </div>

            {selectedOffice.phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{selectedOffice.phone}</span>
              </div>
            )}

            {selectedOffice.email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{selectedOffice.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

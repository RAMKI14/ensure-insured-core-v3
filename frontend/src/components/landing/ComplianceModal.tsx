import React, { useState, useEffect } from 'react';
import { ShieldAlert, Globe, CheckCircle, Ban, Loader2, RefreshCw } from 'lucide-react';

const API_URL = "http://localhost:3001/api";
// Updated Banned List (Includes UK & UAE per your latest strategy)
const BANNED_COUNTRIES = ['US', 'IN', 'CN', 'KP', 'IR', 'RU', 'AE', 'GB'];

const ComplianceModal = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const hasConsented = localStorage.getItem("eit_compliance_accepted");
    return !hasConsented;
  });

  const [userCountry, setUserCountry] = useState(null);
  const [userIP, setUserIP] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // --- API WATERFALL ---
  const fetchCountryCode = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); 

    const apis = [
        'https://ipapi.co/json/',
        'https://api.country.is/',
        'https://get.geojs.io/v1/ip/country.json'
    ];

    for (const api of apis) {
        try {
            const res = await fetch(api, { signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                clearTimeout(timeoutId);
                const code = data.country_code || data.country; 
                const ip = data.ip;
                if (code) return { code, ip };
            }
        } catch (e) {}
    }
    clearTimeout(timeoutId);
    return null;
  };

  const runCheck = async (isRetry = false) => {
      setCheckingLocation(true);
      if(isRetry) setUserCountry(null);

      const result = await fetchCountryCode();

      if (result) {
          setUserCountry(result.code);
          setUserIP(result.ip);
          
          if (BANNED_COUNTRIES.includes(result.code)) {
              setIsBanned(true); // STRICT BLOCK
          }
          setCheckingLocation(false);
      } 
      else if (retryAttempt < 2 && !isRetry) {
          setRetryAttempt(prev => prev + 1);
          setTimeout(() => runCheck(), 1000);
      } 
      else {
          setCheckingLocation(false);
      }
  };

  useEffect(() => {
    if (!isOpen) {
        document.body.style.overflow = 'unset';
        return;
    }
    document.body.style.overflow = 'hidden';
    runCheck();
  }, [isOpen, retryAttempt]);

  const handleAccept = async () => {
    if (isBanned) return;

    try {
        await fetch(`${API_URL}/log-consent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: "Pre-Connection", 
                userAgent: navigator.userAgent,
                ip: userIP || "Detected-Fail",
                country: userCountry || "UNKNOWN"
            })
        });
    } catch(e) { console.error("Log failed", e); }

    localStorage.setItem("eit_compliance_accepted", "true");
    setIsOpen(false);
    document.body.style.overflow = 'unset'; 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-black border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* HEADER */}
        <div className={`p-6 border-b flex items-center gap-4 ${isBanned ? "bg-red-900/20 border-red-900/50" : "bg-blue-900/20 border-blue-900/50"}`}>
            <div className={`p-3 rounded-full ${isBanned ? "bg-red-500/10" : "bg-blue-500/10"}`}>
                <ShieldAlert size={32} className={isBanned ? "text-red-500" : "text-blue-500"} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">
                    {checkingLocation ? "Checking Eligibility..." : (isBanned ? "Access Restricted" : "Compliance Check")}
                </h2>
                <p className={`text-xs font-mono uppercase tracking-widest mt-1 ${isBanned ? "text-red-400" : "text-blue-400"}`}>
                    {checkingLocation ? "Verifying Location" : (isBanned ? "Jurisdiction Not Supported" : "Action Required")}
                </p>
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-6 bg-black">
            
            {/* STATUS BOX */}
            <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${isBanned ? "bg-red-900/10 border-red-900/20" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-center gap-3">
                    <Globe size={20} className={isBanned ? "text-red-400" : "text-gray-400"} />
                    <span className="text-sm text-gray-300 flex items-center gap-2">
                        Detected Location: 
                        {checkingLocation ? (
                            <span className="flex items-center gap-2 text-yellow-500 font-mono text-xs">
                                <Loader2 size={14} className="animate-spin"/> Scanning...
                            </span>
                        ) : (
                            <span className="font-bold text-white">{userCountry || "Unknown"}</span>
                        )}
                        {isBanned && !checkingLocation && <span className="font-bold text-red-400 ml-1">(BLOCKED)</span>}
                    </span>
                </div>
                {!checkingLocation && !userCountry && (
                    <button onClick={() => runCheck(true)} className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition"><RefreshCw size={14}/></button>
                )}
            </div>

            <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                <p>
                    The <strong>EIT Token Sale</strong> is strictly <span className="text-red-400 font-bold">NOT open</span> to citizens or residents of:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-400 text-xs">
                    <li>United States of America (USA) 🇺🇸</li>
                    <li>United Kingdom (UK) 🇬🇧</li>
                    <li>United Arab Emirates (UAE) 🇦🇪</li>
                    <li>India 🇮🇳</li>
                    <li>China 🇨🇳</li>
                    <li>Sanctioned Regions (Iran, North Korea, Russia)</li>
                </ul>

                {/* CONDITIONAL TEXT: Only show Certify text if NOT banned */}
                {!isBanned && (
                    <p className="text-xs text-gray-500 border-t border-gray-800 pt-4">
                        By clicking "I Certify & Enter", you confirm that you are NOT a resident of these restricted regions and you explicitly agree to our <strong>Terms of Service</strong>.
                    </p>
                )}
            </div>

            {/* BUTTONS */}
            {checkingLocation ? (
                 <button disabled className="w-full py-4 bg-gray-800 text-gray-500 font-bold rounded-lg cursor-wait flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Verifying...
                 </button>
            ) : isBanned ? (
                <button disabled className="w-full py-4 bg-gray-800 text-gray-500 font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 opacity-50">
                    <Ban size={18} /> Access Denied
                </button>
            ) : (
                <button 
                    onClick={handleAccept}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                    <CheckCircle size={18} /> I Certify & Enter
                </button>
            )}
            
        </div>
      </div>
    </div>
  );
};

export default ComplianceModal;
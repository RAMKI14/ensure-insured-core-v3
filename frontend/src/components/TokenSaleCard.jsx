import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MESSAGES } from '../constants/messages';
import ProgressBar from './landing/ProgressBar';

const KYC_OVERLAY_COPY = {
  required: {
    title: 'Identity Verification Required',
    body: 'Verify to continue with this KYC-protected token sale.',
    buttonLabel: 'Start Verification',
    tone: 'text-amber-200',
  },
  error: {
    title: 'Identity Verification Required',
    body: 'Your last credential could not be verified. Start verification again to continue.',
    buttonLabel: 'Start Verification',
    tone: 'text-red-200',
  },
  pending: {
    title: 'Verification Submitted',
    body: 'Your wallet is awaiting whitelist approval. Check status or reopen the verification flow.',
    buttonLabel: 'View Verification',
    tone: 'text-sky-200',
  },
};

const TokenSaleCard = ({
  account,
  isCorrectNetwork,
  currency,
  setCurrency,
  amount,
  setAmount,
  balances,
  livePrice,
  estimatedEIT,
  handleBuy,
  isLoading,
  status,
  statusColor,
  isSalePaused,
  totalRaised,
  phaseInfo,
  activeReferrer,
  ethPrice, // <--- Receive Real Price
  kycOverlay,
}) => {

  const MIN_USD_LIMIT = 100;
  
  // FALLBACK: If Oracle hasn't loaded yet, use 2000 to prevent division by zero, 
  // but button will update as soon as data loads.
  const CURRENT_ETH_PRICE = ethPrice > 0 ? ethPrice : 2000;

  const inputVal = parseFloat(amount || "0");
  const balanceVal = parseFloat(balances[currency] || "0");
  const isInsufficientBalance = inputVal > balanceVal;

  // Official Brand Logos
const CRYPTO_ICONS = {
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=029",
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=029",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=029"
};

  // --- ACCURATE VALIDATION LOGIC ---
  let currentUSDValue = 0;
  if (currency === "ETH") {
      // Use the REAL Oracle Price
      currentUSDValue = inputVal * CURRENT_ETH_PRICE;
  } else {
      // USDT/USDC are pegged to $1
      currentUSDValue = inputVal;
  }
  
  const isBelowMinimum = inputVal > 0 && currentUSDValue < MIN_USD_LIMIT;
  const isInvalidAmount = inputVal <= 0;

  const targetAmount = phaseInfo?.phaseTargetUSD || 15000000;
  const phaseTitle = phaseInfo?.phaseName || "Phase 1: Seed Round";
  const overlayCopy = KYC_OVERLAY_COPY[kycOverlay?.state] || KYC_OVERLAY_COPY.required;

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full border border-gray-700 relative overflow-hidden">
      {kycOverlay?.active && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-slate-950/80 p-6 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-amber-400/20 bg-slate-900/90 p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/20">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">{overlayCopy.title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${overlayCopy.tone}`}>{overlayCopy.body}</p>
            <button
              type="button"
              onClick={kycOverlay.onOpen}
              className="mt-5 w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-300"
            >
              {overlayCopy.buttonLabel}
            </button>
          </div>
        </div>
      )}
      
      {/* PAUSE OVERLAY */}
      {isSalePaused && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm p-6 text-center transition-all duration-300 rounded-xl">
            <div className="bg-yellow-500/10 p-4 rounded-full mb-4 ring-1 ring-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <AlertTriangle size={40} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{MESSAGES.SALE_PAUSED_TITLE}</h2>
            <p className="text-gray-400 max-w-[260px] mx-auto text-sm leading-relaxed mb-6">{MESSAGES.SALE_PAUSED_DESC}</p>
            <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-mono font-bold rounded border border-yellow-500/20 uppercase tracking-widest">
                Status: Sale Temporarily Paused
            </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-6 text-center tracking-wide">{MESSAGES.CARD_TITLE}</h2>

      {/* CURRENCY SELECTOR */}
      <div className="flex bg-gray-900/50 rounded-lg p-1 mb-6 border border-gray-700">
        {["ETH", "USDT", "USDC"].map((curr) => (
          <button
            key={curr}
            onClick={() => setCurrency(curr)}
            className={`flex-1 py-2 rounded-md font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              currency === curr
                ? "bg-blue-600 text-white shadow-lg transform scale-105"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {/* Logo Image */}
            <img 
                src={CRYPTO_ICONS[curr]} 
                alt={curr} 
                className="w-5 h-5 object-contain" 
            />
            {curr}
          </button>
        ))}
      </div>

      {/* 3. INPUT AREA */}
      <div className="mb-6">
        
        {/* Label Row (The part you pasted) */}
        <div className="flex justify-between text-xs mb-2 px-1">
          <label className="text-gray-400 uppercase font-bold tracking-wider">{MESSAGES.LABEL_PAY_AMOUNT}</label>
          <span className={isInsufficientBalance ? "text-red-400 font-bold transition-colors" : "text-gray-400 transition-colors"}>
            {MESSAGES.LABEL_BALANCE} <span className="font-mono text-white">{parseFloat(balances[currency] || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</span> {currency}
          </span>
        </div>
        
        {/* Input Field Row (The part we are changing) */}
        <div className="flex items-center relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min $${MIN_USD_LIMIT}`}
            className={`w-full bg-gray-900 border rounded-l-lg p-3 text-xl focus:outline-none transition-colors duration-200 ${
              isInsufficientBalance || isBelowMinimum ? "border-red-500 text-red-300" : "border-gray-600 focus:border-blue-500 text-white"
            }`}
          />
          
          {/* CURRENCY BADGE WITH ICON */}
          <div className="bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg p-3 px-3 font-bold text-gray-300 min-w-[90px] flex items-center justify-center gap-2">
            <img 
                src={CRYPTO_ICONS[currency]} 
                alt="" 
                className="w-5 h-5 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            {currency}
          </div>
        </div>
        
        {/* Validation Errors */}
        {isBelowMinimum && (
            <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">
                ⚠️ Minimum purchase is ${MIN_USD_LIMIT}
            </p>
        )}
        
        {/* Price Badge */}
        <div className="mt-2 flex justify-between items-center">
            <span className="bg-blue-900/50 px-2 py-1 rounded text-xs border border-blue-800 text-blue-200">
                1 EIT = ${livePrice}
            </span>
            {currency === "ETH" && (
                <span className="text-[10px] text-gray-500 font-mono">
                    Oracle ETH: ${CURRENT_ETH_PRICE.toLocaleString()}
                </span>
            )}
        </div>
      </div>

      <div className="mb-4">
          <ProgressBar raised={totalRaised} target={targetAmount} stage={phaseTitle} />
      </div>

      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-6 text-center">
        <div className="text-xs text-blue-300 mb-1 uppercase tracking-wide">{MESSAGES.LABEL_RECEIVE}</div>
        <div className="text-3xl font-bold text-white">
          {estimatedEIT} <span className="text-lg text-blue-400">{MESSAGES.LABEL_EIT}</span>
        </div>
      </div>

      {/* REFERRAL INDICATOR */}
      {activeReferrer && (
          <div className="mb-4 flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg animate-fade-in">
              <span className="text-xs text-blue-400 font-bold">🤝 Supporting:</span>
              <code className="text-xs text-blue-200 font-mono bg-blue-900/40 px-1 rounded">
                  {activeReferrer.substring(0,6)}...{activeReferrer.slice(-4)}
              </code>
          </div>
      )}

      <button
        onClick={handleBuy}
        disabled={isLoading || !account || !isCorrectNetwork || isInsufficientBalance || isInvalidAmount || isSalePaused || isBelowMinimum}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg ${
          (isLoading || isInsufficientBalance || isInvalidAmount || !account || isSalePaused || isBelowMinimum)
            ? "bg-gray-700 cursor-not-allowed text-gray-500 opacity-70"
            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white transform hover:-translate-y-0.5"
        }`}
      >
        {isSalePaused 
            ? MESSAGES.SALE_PAUSED 
            : isBelowMinimum 
                ? `MINIMUM $${MIN_USD_LIMIT}` 
                : (isLoading ? MESSAGES.BTN_PROCESS : `${MESSAGES.BTN_BUY} ${currency}`)
        }
      </button>

      <div className={`mt-6 text-center text-sm font-medium p-3 rounded-lg min-h-[50px] flex items-center justify-center border border-gray-700/50 bg-gray-900/50 ${statusColor}`}>
        {status || <span className="text-gray-600 italic">{MESSAGES.READY}</span>}
      </div>
    </div>
  );
};

export default TokenSaleCard;

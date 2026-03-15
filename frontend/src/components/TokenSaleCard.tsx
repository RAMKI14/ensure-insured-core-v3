import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
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
    ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
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

  const targetAmount = phaseInfo?.phaseTargetUSD || 5000000;

  // Header just shows PHASE X
  const phaseNumber = phaseInfo?.id || 1;
  const phaseTitle = `PHASE ${phaseNumber}`;
  const overlayCopy = KYC_OVERLAY_COPY[kycOverlay?.state] || KYC_OVERLAY_COPY.required;

  return (
    <div className="bg-gradient-to-br from-black via-black to-purple-950/40 p-8 rounded-xl shadow-[0_0_80px_rgba(168,85,247,0.3)] w-full border-2 border-purple-500/50 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_100px_rgba(168,85,247,0.4)]">
      {/* Dynamic Purple Glow Accent - intensified */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-600/30 transition-colors" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-600/30 transition-colors" />
      {kycOverlay?.active && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-black/80 p-6 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/90 p-5 text-center shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-6 text-center transition-all duration-300 rounded-xl">
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

      <h2 className="text-xl font-bold mb-1 text-center tracking-wide">{MESSAGES.CARD_TITLE}</h2>

      {/* TRUST ELEMENT: CERTIK VERIFICATION */}
      <div className="flex items-center justify-center gap-1.5 mb-6">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-gray-400">
          Smart Contract Verified:
          <a
            href="https://www.certik.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-emerald-400 hover:text-emerald-300 transition-colors underline decoration-emerald-400/30 underline-offset-2"
          >
            CertiK
          </a>
        </span>
      </div>

      {/* CURRENCY SELECTOR */}
      <div className="flex bg-white/5 rounded-lg p-1 mb-6 border border-white/10">
        {["ETH", "USDT", "USDC"].map((curr) => (
          <button
            key={curr}
            onClick={() => setCurrency(curr)}
            className={`flex-1 py-2 rounded-md font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${currency === curr
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

        {/* Input Field Row (Unified Borders) */}
        <div className={`flex items-center relative group/input border-2 rounded-lg transition-all duration-300 overflow-hidden ${isInsufficientBalance || isBelowMinimum
          ? "border-red-500/50 bg-red-500/5"
          : "border-white/20 focus-within:border-blue-500/50 focus-within:bg-blue-500/5"
          }`}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min $${MIN_USD_LIMIT}`}
            className="w-full bg-transparent p-4 text-2xl focus:outline-none text-white placeholder:text-gray-600 min-w-0"
          />

          {/* CURRENCY BADGE WITH ICON (Integrated) */}
          <div className="bg-white/5 border-l border-white/10 p-4 px-4 font-bold text-gray-300 min-w-[110px] flex items-center justify-center gap-2 transition-all duration-300">
            <img
              src={CRYPTO_ICONS[currency]}
              alt=""
              className="w-6 h-6 object-contain flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-lg">{currency}</span>
          </div>
        </div>

        {/* Validation Errors */}
        {isBelowMinimum && (
          <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">
            ⚠️ Minimum purchase is ${MIN_USD_LIMIT}
          </p>
        )}

        {/* MILESTONE MESSAGE */}
        <div className="mb-2 text-center">
          <span className="text-[9px] uppercase tracking-[0.2em] font-black text-blue-400/50">
            Price increases at next milestone
          </span>
        </div>

        {/* Price & Balance Badge (Responsive Layout) */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="bg-blue-900/50 px-3 py-1.5 rounded-full text-xs border border-blue-800 text-blue-200 shadow-sm whitespace-nowrap">
            1 EIT = ${livePrice}
          </span>

          {/* Price badges contain EIT, Holding, and ETH info */}
          {balances.EIT && parseFloat(balances.EIT) > 0 && (
            <span className="bg-emerald-900/30 px-3 py-1.5 rounded-full text-xs border border-emerald-800/50 text-emerald-300 flex items-center gap-1.5 shadow-sm whitespace-nowrap">
              🏦 <span className="text-[10px] opacity-70">Holding:</span> {parseFloat(balances.EIT).toLocaleString(undefined, { maximumFractionDigits: 0 })}<span className="text-[10px] opacity-70">EIT</span>
            </span>
          )}

          {/* ETH Price Badge (Commented out for now) */}
          {/* {currency === "ETH" && (
            <span className="bg-white/5 px-3 py-1.5 rounded-full text-xs border border-white/10 text-gray-400 font-mono shadow-sm whitespace-nowrap">
              ETH: ${CURRENT_ETH_PRICE.toLocaleString()}
            </span>
          )} */}
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
            {activeReferrer.substring(0, 6)}...{activeReferrer.slice(-4)}
          </code>
        </div>
      )}

      <button
        onClick={handleBuy}
        disabled={isLoading || !account || !isCorrectNetwork || isInsufficientBalance || isInvalidAmount || isSalePaused || isBelowMinimum}
        className={`w-full py-6 rounded-xl font-black text-xl transition-all duration-300 flex items-center justify-center min-h-[70px] uppercase tracking-wider ${(isLoading || isInsufficientBalance || isInvalidAmount || !account || !isCorrectNetwork || isSalePaused || isBelowMinimum)
          ? "bg-slate-800 cursor-not-allowed text-slate-500 opacity-60 grayscale border border-white/10"
          : "bg-emerald-600 hover:bg-emerald-500 text-white transform hover:-translate-y-1 active:scale-95 border-t border-white/20"
          }`}
      >
        <div className="whitespace-nowrap flex items-center justify-center gap-2 flex-shrink-0 px-6">
          {isSalePaused
            ? MESSAGES.SALE_PAUSED
            : isBelowMinimum
              ? `MINIMUM $${MIN_USD_LIMIT}`
              : (isLoading ? MESSAGES.BTN_PROCESS : <>{MESSAGES.BTN_BUY} <span className="opacity-90">{currency}</span></>)
          }
        </div>
      </button>

    </div>
  );
};

export default TokenSaleCard;

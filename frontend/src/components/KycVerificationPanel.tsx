import React from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, ShieldCheck, X } from 'lucide-react';

const providerButtonStyles = {
  civic_pass: 'border-cyan-400/30 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-500/10',
  fractal_id: 'border-emerald-400/30 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-500/10',
  blockpass: 'border-amber-400/30 text-amber-200 hover:border-amber-300 hover:bg-amber-500/10',
};

const stateCopy = {
  required: {
    title: 'Identity Verification Required',
    body: 'This token sale currently requires identity verification. Your wallet is not yet approved to participate.',
    tone: 'text-amber-200',
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
  },
  verifying: {
    title: 'Checking credential validity...',
    body: 'Your credential is being validated and queued for whitelist review.',
    tone: 'text-blue-200',
    icon: LoaderCircle,
    iconClass: 'text-blue-400 animate-spin',
  },
  pending: {
    title: 'Identity verified. Awaiting whitelist approval',
    body: 'Your credential was accepted and placed in the approval queue. An admin must whitelist this wallet before purchases are unlocked.',
    tone: 'text-sky-200',
    icon: ShieldCheck,
    iconClass: 'text-sky-400',
  },
  verified: {
    title: 'Wallet successfully verified',
    body: 'You are now whitelisted and may proceed with the token purchase.',
    tone: 'text-green-200',
    icon: CheckCircle2,
    iconClass: 'text-green-400',
  },
  error: {
    title: 'Identity verification failed',
    body: 'Please check the credential contents and provider, then try again.',
    tone: 'text-red-200',
    icon: AlertTriangle,
    iconClass: 'text-red-400',
  },
};

const KycVerificationPanel = ({
  visible,
  state,
  errorMessage,
  providers,
  selectedProvider,
  credential,
  onCredentialChange,
  onProviderSelect,
  onVerify,
  onRefresh,
  isSubmitting,
  onClose,
}) => {
  if (!visible) return null;

  const currentState = stateCopy[state] || stateCopy.required;
  const StateIcon = currentState.icon;

  return (
    <div className="w-full rounded-2xl border border-amber-400/20 bg-slate-950/95 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <StateIcon size={24} className={currentState.iconClass} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{currentState.title}</h3>
          <p className={`mt-2 text-sm leading-relaxed ${currentState.tone}`}>
            {currentState.body}
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Verify your wallet using a supported Web3 identity provider. This process does not require sharing personal data with Ensure Insured.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-gray-500">
          Supported Verification Providers
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => {
            const isActive = provider.key === selectedProvider;
            return (
              <button
                key={provider.key}
                type="button"
                onClick={() => onProviderSelect(provider.key, provider.url)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${providerButtonStyles[provider.key] || 'border-white/10 text-white'} ${isActive ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/[0.03]'}`}
              >
                Verify with {provider.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="block text-sm font-bold text-white">Verification Credential</label>
        <p className="mt-1 text-xs text-gray-400">
          Paste your identity verification credential issued by a supported provider.
        </p>
        <textarea
          value={credential}
          onChange={(e) => onCredentialChange(e.target.value)}
          className="mt-3 min-h-[130px] w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/40"
          placeholder='{"provider":"civic pass","walletAddress":"0x...","expiresAt":"2026-12-31T00:00:00Z","proof":"..."}'
        />

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onVerify}
            disabled={isSubmitting || !selectedProvider || !credential.trim()}
            className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Credential'}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycVerificationPanel;

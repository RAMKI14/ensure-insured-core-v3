import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import addresses from './frontend-config.json';
import CrowdsaleABI from './EITCrowdsale.json';
import UsdtABI from './MockUSDT.json';
import { MESSAGES } from './constants/messages';
import TokenABI from './EnsureInsuredToken.json';
import { getReferralHoldingValue } from './utils/referralEligibility';

// Logic Hooks
import { useAccount, useChainId, usePublicClient, useDisconnect } from 'wagmi';
import { useEthersSigner } from './web3/useEthersSigner';

// UI Components
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import TokenomicsPremium from './components/landing/TokenomicsPremium';
import Roadmap from './components/landing/Roadmap';
import Footer from './components/landing/Footer';
import SystemArchitecture from './components/landing/SystemArchitecture';
import SectionSeparator from './components/landing/SectionSeparator';
import ComplianceModal from './components/landing/ComplianceModal';
import ReferralWidget from './components/ReferralWidget';
import DashboardRoot from './components/dashboard/DashboardRoot';
import { Share2, AlertTriangle, ShieldCheck } from 'lucide-react';

const ESTIMATED_ETH_PRICE = 2000;
const API_URL = "http://localhost:3001/api"; // Backend URL
const WALLET_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WALLET_ACTIVITY_STORAGE_KEY = "eit_wallet_last_activity_at";
const WALLET_ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "scroll",
  "mousemove",
  "wheel",
  "touchstart",
  "focus"
];

// Minimal Chainlink ABI
const CHAINLINK_ABI = [
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
];

function App() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const signer = useEthersSigner();
  const publicClient = usePublicClient();
  const { disconnect } = useDisconnect();
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(0);
  const disconnectingForIdleRef = useRef(false);

  // State Variables
  const [balances, setBalances] = useState({ ETH: "0.0", USDT: "0.0", USDC: "0.0", EIT: "0" });
  const [livePrice, setLivePrice] = useState(0.01);
  const [ethPrice, setEthPrice] = useState(0); // Real ETH Price
  const [isSalePaused, setIsSalePaused] = useState(false);
  const [currency, setCurrency] = useState("ETH");
  const [amount, setAmount] = useState("");
  const [estimatedEIT, setEstimatedEIT] = useState("0");
  const [status, setStatus] = useState(MESSAGES.READY);
  const [statusColor, setStatusColor] = useState("text-gray-400");
  const [isLoading, setIsLoading] = useState(false);
  const [isWhitelistEnabled, setIsWhitelistEnabled] = useState(false); // Default to false for UI testing locally
  const [isWhitelistingReady, setIsWhitelistingReady] = useState(false); // Track if contract data is fetched
  const [showStatusPopup, setShowStatusPopup] = useState(false);

  // Advanced Features State
  const [totalRaised, setTotalRaised] = useState(0);
  const [phaseInfo, setPhaseInfo] = useState({ phaseName: "", phaseTargetUSD: 0, referralActive: false, isActive: false });
  const [ukFirstSeen, setUkFirstSeen] = useState(null);
  const [activeReferrer, setActiveReferrer] = useState(null);
  const [userTotalUSD, setUserTotalUSD] = useState(0n);
  const [maxContribution, setMaxContribution] = useState(0n);
  const [kycProviders, setKycProviders] = useState([]);
  const [selectedKycProvider, setSelectedKycProvider] = useState("civic_pass");
  const [kycCredential, setKycCredential] = useState("");
  const [showKycPrompt, setShowKycPrompt] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycPanelState, setKycPanelState] = useState("required");
  const [kycError, setKycError] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const stampWalletActivity = (timestamp = Date.now()) => {
    lastActivityRef.current = timestamp;
    localStorage.setItem(WALLET_ACTIVITY_STORAGE_KEY, String(timestamp));
  };

  const expireWalletSession = (reason = "idle") => {
    if (!isConnected || disconnectingForIdleRef.current) return;

    disconnectingForIdleRef.current = true;

    // 1. Clear State
    clearIdleTimer();
    localStorage.removeItem(WALLET_ACTIVITY_STORAGE_KEY);
    // Force clear wagmi/rainbowkit cache to prevent auto-reconnect
    localStorage.removeItem("wagmi.store");
    localStorage.removeItem("wagmi.connected");

    setShowKycPrompt(false);
    setIsKycModalOpen(false);
    setBalances({ ETH: "0.0", USDT: "0.0", USDC: "0.0", EIT: "0" });

    // 2. Disconnect
    try {
      if (connector) {
        disconnect({ connector });
      } else {
        disconnect();
      }
    } catch (e) {
      // Silently fail if disconnect throws, the reload/fallback will handle it
    }

    // 3. Set UI Message
    const msg = reason === "restore"
      ? "⚠️ Your session has expired due to inactivity. Please reconnect."
      : "⚠️ You have been logged out due to inactivity. Please reconnect to continue.";

    setStatus(msg);
    setStatusColor("text-amber-400 font-bold");
    setShowStatusPopup(true);

    // 4. Final Fallback: If still connected after 2 seconds, force reload
    setTimeout(() => {
      if (isConnected) {
        window.location.reload();
      }
    }, 2000);
  };

  const scheduleIdleDisconnect = (baseTimestamp = lastActivityRef.current || Date.now()) => {
    clearIdleTimer();
    const elapsed = Date.now() - baseTimestamp;
    const remaining = Math.max(WALLET_IDLE_TIMEOUT_MS - elapsed, 0);
    idleTimerRef.current = setTimeout(() => expireWalletSession("idle"), remaining);
  };

  // --- 1. INITIAL FETCH (Price, Phase, Oracle) ---
  useEffect(() => {
    const fetchGlobalData = async () => {
      if (!window.ethereum) return;
      try {
        // Read-Only Provider
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 1. Crowdsale Data
        const contract = new ethers.Contract(addresses.CROWDSALE, CrowdsaleABI.abi, provider);
        const phaseIndex = await contract.currentPhase();
        const phase = await contract.phases(phaseIndex);
        const priceEth = ethers.formatEther(phase.priceUSD);
        const paused = await contract.paused();
        const whitelist = await contract.whitelistEnabled();

        setLivePrice(parseFloat(priceEth));
        setIsSalePaused(paused);
        setIsWhitelistEnabled(whitelist);
        setIsWhitelistingReady(true);

        // 1b. Limits
        const maxContrib = await contract.MAX_CONTRIBUTION();
        setMaxContribution(maxContrib);

        // 2. Oracle Data (ETH Price)
        try {
          const oracleAddress = await contract.oracle();
          const oracle = new ethers.Contract(oracleAddress, CHAINLINK_ABI, provider);
          const roundData = await oracle.latestRoundData();
          const realEthPrice = Number(roundData[1]) / 100000000; // 8 decimals
          setEthPrice(realEthPrice);
        } catch (err) {
          console.warn("Oracle fetch failed, using default.");
        }

      } catch (e) {
        console.error("Global Data Error:", e);
      }
    };

    const fetchPhaseInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/ico-status`);
        const data = await res.json();
        if (data) {
          setPhaseInfo(data);
        }
      } catch (e) {
        // Silently fail if backend is offline
      }
    };

    const fetchKycProviders = async () => {
      try {
        const res = await fetch(`${API_URL}/kyc/providers`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setKycProviders(data);
          setSelectedKycProvider(data[0].key);
        }
      } catch (e) {
        console.warn("KYC provider fetch failed", e);
      }
    };

    if (window.ethereum) fetchGlobalData();
    fetchPhaseInfo();
    fetchKycProviders();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      disconnectingForIdleRef.current = false;
      clearIdleTimer();
      return;
    }

    const storedTimestamp = Number(localStorage.getItem(WALLET_ACTIVITY_STORAGE_KEY) || 0);
    const now = Date.now();

    // Logic: If we have an old timestamp, check if it's expired.
    // HOWEVER, if this is a "fresh" connection for this specific page instance (lastActivityRef is 0),
    // we should be more lenient or just reset it.
    const isExpired = lastActivityRef.current === 0
      ? (storedTimestamp > 0 && now - storedTimestamp >= WALLET_IDLE_TIMEOUT_MS)
      : (now - lastActivityRef.current >= WALLET_IDLE_TIMEOUT_MS);

    if (isExpired && storedTimestamp > 0) {
      expireWalletSession("restore");
      return;
    }

    const connectionTimestamp = storedTimestamp > 0 && !isExpired ? storedTimestamp : now;
    stampWalletActivity(connectionTimestamp);
    scheduleIdleDisconnect(connectionTimestamp);

    const handleActivity = () => {
      if (document.hidden || disconnectingForIdleRef.current) return;

      const now = Date.now();
      // Throttle storage updates to once every 10 seconds for performance
      if (now - lastActivityRef.current > 10000) {
        stampWalletActivity(now);
        scheduleIdleDisconnect(now);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When coming back to page, check if we've already expired in the background
        const stored = Number(localStorage.getItem(WALLET_ACTIVITY_STORAGE_KEY) || 0);
        const elapsed = Date.now() - (stored || lastActivityRef.current);

        if (elapsed >= WALLET_IDLE_TIMEOUT_MS) {
          expireWalletSession("restore");
        } else {
          handleActivity();
        }
      }
    };

    WALLET_ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Heartbeat check (every 10 seconds) to catch background throttling
    const heartbeat = setInterval(() => {
      if (disconnectingForIdleRef.current) return;

      const stored = Number(localStorage.getItem(WALLET_ACTIVITY_STORAGE_KEY) || 0);
      const last = stored || lastActivityRef.current;
      if (last > 0 && Date.now() - last >= WALLET_IDLE_TIMEOUT_MS) {
        expireWalletSession("idle");
      }
    }, 10000);

    return () => {
      clearIdleTimer();
      clearInterval(heartbeat);
      WALLET_ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, disconnect]);

  // --- SECURE REFERRAL CAPTURE ---
  useEffect(() => {
    const validateAndSetReferrer = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get("ref");

      // 1. Determine Candidate (URL > LocalStorage)
      let candidate = urlRef;
      if (!candidate) candidate = localStorage.getItem("eit_referrer");

      // 2. Initial Validation (Is it an address?)
      if (candidate && ethers.isAddress(candidate)) {

        // Don't let user refer themselves (Basic check, Backend does stricter check)
        if (address && candidate.toLowerCase() === address.toLowerCase()) {
          console.warn("Cannot refer self");
          localStorage.removeItem("eit_referrer");
          setActiveReferrer(null);
          return;
        }

        try {
          // 3. ON-CHAIN VERIFICATION
          // We use a read-only provider to check the candidate's eligibility
          if (!window.ethereum) return;
          const provider = new ethers.BrowserProvider(window.ethereum);
          const { valueUsd: valUSD } = await getReferralHoldingValue(
            candidate,
            provider,
            addresses,
            TokenABI,
            CrowdsaleABI
          );
          const MIN_REQUIRED = 100; // $100 Limit

          if (valUSD >= MIN_REQUIRED) {
            // ELIGIBLE: Save and Display
            console.log(`✅ Referrer Validated ($${valUSD.toFixed(2)})`);
            localStorage.setItem("eit_referrer", candidate);
            setActiveReferrer(candidate);
          } else {
            // INELIGIBLE: Scrub it
            console.warn(`❌ Referrer Ineligible (Only holds $${valUSD.toFixed(2)})`);
            localStorage.removeItem("eit_referrer");
            setActiveReferrer(null);
          }

        } catch (e) {
          console.error("Referrer Validation Failed (Network Error?)", e);
          // Fallback: If network fails, do we accept or reject? 
          // Security-wise, it is better to REJECT until verified.
          setActiveReferrer(null);
        }
      } else {
        // Invalid Address format
        localStorage.removeItem("eit_referrer");
        setActiveReferrer(null);
      }
    };

    if (window.ethereum) {
      validateAndSetReferrer();
    }
  }, [address]); // Re-run if user connects/changes wallet (to check self-referral)

  // --- 3. USER DATA & COMPLIANCE ---
  useEffect(() => {
    if (isConnected && signer) {
      updateUserData();
      checkCoolingOff(address); // Check UK status
      if (isWhitelistEnabled && address) {
        refreshKycStatus(address);
      }

      // If we just reconnected, clear any old disconnect messages
      if (status.includes("session expired") || status.includes("timed out")) {
        // Only clear if the user actually clicked or performed an action, but here we'll just not clear it automatically
        // to avoid race conditions with the disconnect logic.
      }
    } else {
      setBalances({ ETH: "0.0", USDT: "0.0", USDC: "0.0", EIT: "0" });
      setUkFirstSeen(null);
      setShowKycPrompt(false);
      setIsKycModalOpen(false);

      // If we disconnected but NOT because of inactivity, set default ready status
      if (!disconnectingForIdleRef.current) {
        setStatus(MESSAGES.READY);
        setStatusColor("text-gray-400");
        setShowStatusPopup(false);
      }
    }
  }, [isConnected, signer, chainId, address]);

  // Handle status popup trigger
  useEffect(() => {
    if (status && status !== MESSAGES.READY && status !== "") {
      setShowStatusPopup(true);

      // Auto-hide success messages after 6 seconds, keep errors longer or until closed
      const isSuccess = status.includes("✅") || status.includes("successfully");
      if (isSuccess) {
        const timer = setTimeout(() => setShowStatusPopup(false), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  useEffect(() => {
    if (!address || !showKycPrompt || kycPanelState !== "pending") return;
    const timer = setInterval(() => {
      refreshKycStatus(address);
    }, 15000);
    return () => clearInterval(timer);
  }, [address, showKycPrompt, kycPanelState]);

  const refreshKycStatus = async (walletAddress = address) => {
    if (!walletAddress) return null;
    try {
      const res = await fetch(`${API_URL}/kyc/status/${walletAddress}`);
      const data = await res.json();
      if (!res.ok) return null;

      if (data.status === "WHITELISTED") {
        setShowKycPrompt(false);
        setIsKycModalOpen(false);
        setKycPanelState("verified");
        setKycError("");
        setStatus("✅ Wallet successfully verified. You may proceed with the token purchase.");
        setStatusColor("text-green-400 font-bold");
      } else if (data.status === "VERIFIED_PENDING_WHITELIST") {
        setShowKycPrompt(true);
        setKycPanelState("pending");
        setKycError("");
      } else if (data.status === "REJECTED") {
        setShowKycPrompt(true);
        setKycPanelState("error");
        setKycError(data.lastError || "Invalid credential");
      } else {
        setKycPanelState("required");
      }

      return data;
    } catch (e) {
      console.warn("KYC status refresh failed", e);
      return null;
    }
  };

  const handleProviderSelect = (providerKey, providerUrl) => {
    setSelectedKycProvider(providerKey);
    if (providerUrl) {
      window.open(providerUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleVerifyKyc = async () => {
    if (!address || !selectedKycProvider || !kycCredential.trim()) return;

    setKycSubmitting(true);
    setKycPanelState("verifying");
    setKycError("");

    try {
      const res = await fetch(`${API_URL}/kyc/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          provider: selectedKycProvider,
          credential: kycCredential.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setShowKycPrompt(true);
        setIsKycModalOpen(true);
        setKycPanelState("error");
        setKycError(data.error || "Invalid credential");
        return;
      }

      setKycPanelState("pending");
      setShowKycPrompt(true);
      setStatus("✅ Identity verified. Awaiting whitelist approval.");
      setStatusColor("text-sky-300 font-bold");
    } catch (e) {
      console.error("KYC verify error:", e);
      setShowKycPrompt(true);
      setIsKycModalOpen(true);
      setKycPanelState("error");
      setKycError("Verification service is currently unavailable.");
    } finally {
      setKycSubmitting(false);
    }
  };

  // --- UK COMPLIANCE CHECK (Robust Waterfall) ---
  const checkCoolingOff = async (userAddr) => {
    const fetchCountry = async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (res.ok) { const d = await res.json(); if (d.country_code) return d.country_code; }
      } catch (e) { }
      try {
        const res = await fetch('https://api.country.is/');
        if (res.ok) { const d = await res.json(); if (d.country) return d.country; }
      } catch (e) { }
      return null;
    };

    try {
      const countryCode = await fetchCountry();
      if (countryCode === "GB") {
        const dbRes = await fetch(`${API_URL}/check-cooling-off`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: userAddr })
        });
        const dbData = await dbRes.json();

        if (dbData.firstSeen) {
          setUkFirstSeen(dbData.firstSeen);
        } else {
          const now = new Date().toISOString();
          setUkFirstSeen(now);
        }
      } else {
        setUkFirstSeen(null);
      }
    } catch (e) { setUkFirstSeen(null); }
  };

  const updateUserData = async () => {
    try {
      const ethBal = await signer.provider.getBalance(address);
      const tokenContract = new ethers.Contract(addresses.USDT, UsdtABI.abi, signer);
      const usdtBal = await tokenContract.balanceOf(address);

      const eitTokenContract = new ethers.Contract(addresses.EIT, TokenABI.abi, signer);
      const eitBal = await eitTokenContract.balanceOf(address);

      // --- Aggregate DB Holdings (Seed/Private/Manual Public) ---
      let dbEIT = 0;
      try {
        const dbRes = await fetch(`${API_URL}/investor/total/${address}`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          dbEIT = dbData.totalEIT || 0;
        }
      } catch (e) {
        console.warn("Could not fetch DB EIT balance", e);
      }

      setBalances({
        ETH: ethers.formatEther(ethBal),
        USDT: ethers.formatUnits(usdtBal, 6),
        USDC: ethers.formatUnits(usdtBal, 6),
        EIT: (parseFloat(ethers.formatUnits(eitBal, 18)) + dbEIT).toString()
      });

      const crowdContract = new ethers.Contract(addresses.CROWDSALE, CrowdsaleABI.abi, signer);
      const phaseIndex = await crowdContract.currentPhase();
      const phase = await crowdContract.phases(phaseIndex);
      setLivePrice(parseFloat(ethers.formatEther(phase.priceUSD)));
      const paused = await crowdContract.paused();
      setIsSalePaused(paused);

      const totalUsd = await crowdContract.userTotalUSD(address);
      setUserTotalUSD(totalUsd);
    } catch (e) { console.error("Data Load Error:", e); }
  };

  // --- 4. CALCULATOR ---
  useEffect(() => {
    // Only clear status if user is actively typing
    if (amount !== "") {
      setStatus("");
      setStatusColor("text-gray-400");
    }

    if (!amount || isNaN(Number(amount))) {
      setEstimatedEIT("0");
      return;
    }

    const val = parseFloat(amount);

    // Use Real ETH Price if available, otherwise estimate
    const currentEthPrice = ethPrice > 0 ? ethPrice : ESTIMATED_ETH_PRICE;

    let usdValue = (currency === "ETH") ? val * currentEthPrice : val;

    // Avoid divide by zero
    const safePrice = livePrice > 0 ? livePrice : 0.01;
    const tokens = usdValue / safePrice;

    setEstimatedEIT(tokens.toLocaleString());
  }, [amount, currency, livePrice, ethPrice]);

  const isCorrectNetwork = () => chainId === 11155111;

  // --- ACTIONS ---
  const handleBuy = async () => {
    if (!isConnected || !signer) return alert(MESSAGES.ERR_CONNECT_FIRST);
    if (!isCorrectNetwork()) return alert(MESSAGES.WARN_NETWORK);

    const inputVal = parseFloat(amount || "0");
    const balanceVal = parseFloat(balances[currency] || "0");

    if (inputVal <= 0) return;
    if (inputVal > balanceVal) {
      setStatus(MESSAGES.ERR_INSUFFICIENT_DETAILED(currency, balanceVal.toFixed(4)));
      setStatusColor("text-red-500 font-bold");
      return;
    }

    setIsLoading(true);
    setStatus(MESSAGES.STATUS_INIT);
    setStatusColor("text-yellow-300");

    try {
      const crowdsale = new ethers.Contract(addresses.CROWDSALE, CrowdsaleABI.abi, signer);

      // Calculate USD value of current attempt
      const usdValueWei = currency === "ETH"
        ? (ethers.parseEther(amount) * BigInt(Math.floor(ethPrice || 2000))) / 1n
        : ethers.parseUnits(amount, 18); // Internal contract math uses 18 decimals for USD values

      // PROACTIVE CHECK (Industry Standard)
      if (userTotalUSD + usdValueWei > maxContribution) {
        const remainingWei = maxContribution > userTotalUSD ? maxContribution - userTotalUSD : 0n;
        const remainingUSD = ethers.formatUnits(remainingWei, 18);
        setStatus(MESSAGES.ERR_MAX_WALLET_LIMIT(parseFloat(remainingUSD).toLocaleString()));
        setStatusColor("text-red-400 font-bold");
        setIsLoading(false);
        return;
      }

      let tx;

      // 1. EXECUTE BLOCKCHAIN TRANSACTION
      if (currency === "ETH") {
        tx = await crowdsale.buyWithNative(0n, { value: ethers.parseEther(amount) });
        setStatus(MESSAGES.STATUS_WAITING);
        await tx.wait();
      } else {
        const tokenContract = new ethers.Contract(addresses.USDT, UsdtABI.abi, signer);
        const amountWei = ethers.parseUnits(amount, 6);

        setStatus(MESSAGES.STATUS_APPROVE(currency));
        const txApprove = await tokenContract.approve(addresses.CROWDSALE, amountWei);
        await txApprove.wait();

        setStatus(MESSAGES.STATUS_CONFIRM);
        tx = await crowdsale.buyWithStablecoin(addresses.USDT, amountWei, 0n);
        await tx.wait();
      }

      // 2. SHOW SUCCESS (Prioritize this!)
      setStatus(MESSAGES.SUCCESS_PURCHASE(estimatedEIT));
      setStatusColor("text-green-400 font-bold");
      setAmount("");
      updateUserData();

      // 3. AUTO-RECORD INVESTOR LEDGER (Sales Log)
      try {
        console.log("📝 Recording Sale to Ledger...");
        const tokens = parseFloat(estimatedEIT.replace(/,/g, ''));

        // Calculate USD value for the ledger
        const val = parseFloat(amount);
        const usdVal = currency === "ETH" ? val * (ethPrice || 2000) : val;
        const userCountry = localStorage.getItem("eit_user_country") || "Unknown";

        await fetch(`${API_URL}/sales/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address,
            name: "Public Investor",
            role: isWhitelistEnabled ? "PUBLIC_KYC" : "PUBLIC_OPEN",
            amount: tokens,
            amountUSD: usdVal,
            phase: phaseInfo.phaseName,
            country: userCountry,
            eitPrice: livePrice,
            txHash: tx.hash,
            crypto: currency,
            note: isWhitelistEnabled ? `Purchased during KYC enforced mode` : `Purchased during Open Sale mode`,
            kycStatus: isWhitelistEnabled ? "Yes" : "No"
          })
        });
        console.log("✅ Sale Recorded to Ledger");
      } catch (ledgerError) {
        console.error("Ledger Recording Failed:", ledgerError);
      }

      // 4. PROCESS REFERRAL (Safe Isolated Block)
      try {
        const referrer = localStorage.getItem("eit_referrer");

        if (referrer && address) {
          console.log("🔗 Reporting Referral...");
          const val = parseFloat(amount);
          const usdVal = currency === "ETH" ? val * (ethPrice || 2000) : val;

          await fetch(`${API_URL}/record-referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrer: referrer,
              referee: address,
              amountUSD: usdVal,
              txHash: tx.hash,
              eitPrice: livePrice
            })
          });
          console.log("✅ Referral Reported");
        }
      } catch (refError) {
        console.error("Referral Log Failed:", refError);
      }

    } catch (e) {
      console.error("Transaction Error Detail:", e);
      setStatusColor("text-red-400");

      const errorMessage = e.reason || e.message || "";

      if (e.code === "INSUFFICIENT_FUNDS") {
        setStatus(MESSAGES.ERR_GAS);
      } else if (errorMessage.includes("user rejected")) {
        setStatus(MESSAGES.ERR_USER_REJECTED);
      } else if (errorMessage.includes("User cap exceeded")) {
        const remainingWei = maxContribution > userTotalUSD ? maxContribution - userTotalUSD : 0n;
        setStatus(MESSAGES.ERR_MAX_WALLET_LIMIT(parseFloat(ethers.formatUnits(remainingWei, 18)).toLocaleString()));
      } else if (errorMessage.includes("Hard cap exceeded")) {
        setStatus(MESSAGES.ERR_HARD_CAP);
      } else if (errorMessage.includes("Below minimum contribution")) {
        setStatus(MESSAGES.ERR_MIN_CONTRIBUTION || "⚠️ Below minimum contribution ($100)");
      } else if (errorMessage.includes("Not whitelisted")) {
        setStatus(MESSAGES.ERR_NOT_WHITELISTED);
        setShowKycPrompt(true);
        setIsKycModalOpen(false);
        const record = await refreshKycStatus(address);
        if (!record || record.status === "NOT_VERIFIED") {
          setKycPanelState("required");
          setKycError("");
        }
      } else if (errorMessage.includes("Sale not active")) {
        setStatus(MESSAGES.ERR_SALE_NOT_ACTIVE);
      } else if (errorMessage.includes("Phase cap exceeded")) {
        setStatus(MESSAGES.ERR_PHASE_CAP);
      } else if (errorMessage.includes("Unsupported stablecoin")) {
        setStatus("⚠️ This currency is not yet supported in the contract.");
      } else {
        setStatus(MESSAGES.ERR_GENERIC + (e.reason || "Blockchain Revert"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFreeUSDT = async () => {
    if (!signer) return;
    setIsLoading(true);
    setStatus(MESSAGES.STATUS_MINTING);
    setStatusColor("text-yellow-300");
    try {
      const usdt = new ethers.Contract(addresses.USDT, UsdtABI.abi, signer);
      const tx = await usdt.faucet();
      await tx.wait();
      setStatus(MESSAGES.SUCCESS_MINT);
      setStatusColor("text-green-400 font-bold");
      updateUserData();
    } catch (e) {
      setStatus(MESSAGES.ERR_GENERIC);
      setStatusColor("text-red-400");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">

      <ComplianceModal />

      <Navbar
        account={address}
        onReferClick={() => setIsReferralModalOpen(true)}
        onDashboardClick={() => setIsDashboardOpen(true)}
        referralEnabled={phaseInfo.referralActive}
      />

      {isDashboardOpen && address && (
        <DashboardRoot 
          address={address} 
          onClose={() => setIsDashboardOpen(false)} 
        />
      )}

      {/* GLOBAL REFERRAL MODAL */}
      {isReferralModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsReferralModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <ReferralWidget account={address} onClose={() => setIsReferralModalOpen(false)} />
          </div>
        </div>
      )}

      {isWhitelistingReady && (
        isWhitelistEnabled ? (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-2">
            <div className="container mx-auto px-6 flex items-center justify-center gap-3">
              <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded animate-pulse">KYC PROTECTED</span>
              <p className="text-[11px] text-amber-200/80 font-medium">Whitelist enforcement is active. Only approved wallets can participate in this sale.</p>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border-b border-green-500/20 py-2">
            <div className="container mx-auto px-6 flex items-center justify-center gap-3">
              <span className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded animate-pulse">OPEN SALE ACTIVE</span>
              <p className="text-[11px] text-green-200/80 font-medium">Public wallets can participate in the sale without prior whitelisting.</p>
            </div>
          </div>
        )
      )}

      <Hero
        account={address}
        isCorrectNetwork={isCorrectNetwork()}
        currency={currency}
        setCurrency={setCurrency}
        amount={amount}
        setAmount={setAmount}
        balances={balances}
        livePrice={livePrice}
        estimatedEIT={estimatedEIT}
        handleBuy={handleBuy}
        getFreeUSDT={getFreeUSDT}
        isLoading={isLoading}
        status={status}
        statusColor={statusColor}
        isSalePaused={isSalePaused}

        totalRaised={totalRaised}
        phaseInfo={phaseInfo}
        ethPrice={ethPrice}

        ukFirstSeen={ukFirstSeen}
        activeReferrer={activeReferrer}
        kycPanel={{
          visible: isKycModalOpen && isWhitelistEnabled,
          modalVisible: isKycModalOpen && isWhitelistEnabled,
          state: kycPanelState,
          errorMessage: kycError,
          providers: kycProviders,
          selectedProvider: selectedKycProvider,
          credential: kycCredential,
          onCredentialChange: setKycCredential,
          onProviderSelect: handleProviderSelect,
          onVerify: handleVerifyKyc,
          onRefresh: () => refreshKycStatus(address),
          isSubmitting: kycSubmitting,
          onClose: () => setIsKycModalOpen(false),
          overlay: {
            active: isWhitelistEnabled && showKycPrompt && kycPanelState !== "verified",
            state: kycPanelState,
            onOpen: () => setIsKycModalOpen(true),
          },
          hideReferral: isWhitelistEnabled && kycPanelState !== "verified" && userTotalUSD === 0n,
        }}
      />

      <SectionSeparator />
      <Features />

      <SectionSeparator />
      <SystemArchitecture />

      <SectionSeparator />
      <TokenomicsPremium />

      <SectionSeparator />
      <Roadmap />

      <Footer contractAddress={addresses.EIT} />

      {/* TRENDY STATUS OVERLAY POP-UP */}
      {showStatusPopup && status && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-2xl border-2 border-white/10 bg-slate-900/90 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-zoom-in backdrop-blur-xl relative overflow-hidden group"
          >
            {/* Animated Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity ${status.includes("⚠️") || status.includes("Error") || status.includes("Failed") || status.includes("Limit")
              ? "bg-red-500"
              : status.includes("✅") || status.includes("Success")
                ? "bg-green-500"
                : "bg-blue-500"
              }`} />

            <div className="relative z-10">
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 shadow-lg ${status.includes("⚠️") || status.includes("Error") || status.includes("Failed") || status.includes("Limit")
                ? "bg-red-500/10 ring-red-500/30 text-red-400"
                : status.includes("✅") || status.includes("Success")
                  ? "bg-green-500/10 ring-green-500/30 text-green-400"
                  : "bg-blue-500/10 ring-blue-500/30 text-blue-400"
                }`}>
                {status.includes("⚠️") || status.includes("Error") || status.includes("Failed") || status.includes("Limit") ? (
                  <AlertTriangle size={32} />
                ) : status.includes("✅") || status.includes("Success") ? (
                  <ShieldCheck size={32} />
                ) : (
                  <div className="w-8 h-8 rounded-full border-4 border-t-transparent border-blue-400 animate-spin" />
                )}
              </div>

              <h3 className="text-xl font-black text-white mb-3 tracking-tight">
                {status.includes("⚠️") || status.includes("Error") || status.includes("Failed") || status.includes("Limit")
                  ? "Transaction Alert"
                  : status.includes("waiting") || status.includes("Confirm") || status.includes("Processing")
                    ? "Processing..."
                    : "Update"}
              </h3>

              <p className={`text-sm leading-relaxed font-medium mb-8 ${status.includes("⚠️") || status.includes("Error") || status.includes("Failed") || status.includes("Limit")
                ? "text-red-200/80"
                : "text-slate-200/80"
                }`}>
                {status}
              </p>

              <button
                onClick={() => setShowStatusPopup(false)}
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${status.includes("⚠️") || status.includes("Error") || status.includes("Failed") || status.includes("Limit")
                  ? "bg-red-500 hover:bg-red-400 text-white shadow-red-500/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                  }`}
              >
                Okay, Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

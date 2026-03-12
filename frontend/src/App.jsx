import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from './frontend-config.json';
import CrowdsaleABI from './EITCrowdsale.json';
import UsdtABI from './MockUSDT.json';
import { MESSAGES } from './constants/messages';
import TokenABI from './EnsureInsuredToken.json';

// Logic Hooks
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { useEthersSigner } from './web3/useEthersSigner';

// UI Components
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import Tokenomics from './components/landing/Tokenomics';
import Roadmap from './components/landing/Roadmap';
import Footer from './components/landing/Footer';
import SectionSeparator from './components/landing/SectionSeparator';
import ComplianceModal from './components/landing/ComplianceModal';

const ESTIMATED_ETH_PRICE = 2000; 
const API_URL = "http://localhost:3001/api"; // Backend URL

// Minimal Chainlink ABI
const CHAINLINK_ABI = [
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
];

function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const signer = useEthersSigner();
  const publicClient = usePublicClient(); 

  // State Variables
  const [balances, setBalances] = useState({ ETH: "0.0", USDT: "0.0", USDC: "0.0" });
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
  
  // Advanced Features State
  const [totalRaised, setTotalRaised] = useState(0);
  const [phaseInfo, setPhaseInfo] = useState({ phaseName: "Phase 1: Seed Round", phaseTargetUSD: 15000000 });
  const [ukFirstSeen, setUkFirstSeen] = useState(null);
  const [activeReferrer, setActiveReferrer] = useState(null);
  const [userTotalUSD, setUserTotalUSD] = useState(0n);
  const [maxContribution, setMaxContribution] = useState(0n);

  // --- 1. INITIAL FETCH (Price, Phase, Oracle) ---
  useEffect(() => {
    const fetchGlobalData = async () => {
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
            if(data && data.phaseName) {
                setPhaseInfo(data);
            }
        } catch (e) { 
            // Silently fail if backend is offline
        }
    };

    if (window.ethereum) fetchGlobalData();
    fetchPhaseInfo();
  }, []);

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
                const provider = new ethers.BrowserProvider(window.ethereum);
                const tokenContract = new ethers.Contract(addresses.EIT, TokenABI.abi, provider);
                const crowdContract = new ethers.Contract(addresses.CROWDSALE, CrowdsaleABI.abi, provider);

                // A. Get Balance
                const balanceWei = await tokenContract.balanceOf(candidate);
                const balance = parseFloat(ethers.formatEther(balanceWei));

                // B. Get Price
                const phaseIndex = await crowdContract.currentPhase();
                const phase = await crowdContract.phases(phaseIndex);
                const price = parseFloat(ethers.formatEther(phase.priceUSD));

                // C. Calculate Value
                const valUSD = balance * price;
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
    } else {
      setBalances({ ETH: "0.0", USDT: "0.0", USDC: "0.0" });
      setUkFirstSeen(null);
    }
  }, [isConnected, signer, chainId, address]);

  // --- UK COMPLIANCE CHECK (Robust Waterfall) ---
  const checkCoolingOff = async (userAddr) => {
    const fetchCountry = async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000); 
        try {
            const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            if(res.ok) { const d = await res.json(); if(d.country_code) return d.country_code; }
        } catch(e) {}
        try {
            const res = await fetch('https://api.country.is/'); 
            if(res.ok) { const d = await res.json(); if(d.country) return d.country; }
        } catch(e) {}
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
      
      setBalances({ 
        ETH: ethers.formatEther(ethBal), 
        USDT: ethers.formatUnits(usdtBal, 6), 
        USDC: ethers.formatUnits(usdtBal, 6) 
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

    if (!amount || isNaN(amount)) { 
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
          setStatus(MESSAGES.ERR_ZERO_PURCHASE);
      } else if (errorMessage.includes("Not whitelisted")) {
          setStatus(MESSAGES.ERR_NOT_WHITELISTED);
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
    if(!signer) return; 
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
    } catch(e) { 
        setStatus(MESSAGES.ERR_GENERIC); 
        setStatusColor("text-red-400"); 
    } finally { 
        setIsLoading(false); 
    }
  };

  // --- RENDER ---
  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">
     
      <ComplianceModal /> 

      <Navbar />

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
      />

      <SectionSeparator />
      <Features />

      <SectionSeparator />
      <Tokenomics />

      <SectionSeparator />
      <Roadmap />
      
      <Footer contractAddress={addresses.EIT} />

    </div>
  );
}

export default App;

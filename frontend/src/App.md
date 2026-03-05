import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from './frontend-config.json';
import CrowdsaleABI from './EITCrowdsale.json';
import UsdtABI from './MockUSDT.json';
import { MESSAGES } from './constants/messages';

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

function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const signer = useEthersSigner();
  const publicClient = usePublicClient(); 

  const [balances, setBalances] = useState({ ETH: "0.0", USDT: "0.0", USDC: "0.0" });
  const [livePrice, setLivePrice] = useState(0.01); 
  const [isSalePaused, setIsSalePaused] = useState(false);
  const [currency, setCurrency] = useState("ETH"); 
  const [amount, setAmount] = useState("");
  const [estimatedEIT, setEstimatedEIT] = useState("0");
  const [status, setStatus] = useState(MESSAGES.READY);
  const [statusColor, setStatusColor] = useState("text-gray-400");
  const [isLoading, setIsLoading] = useState(false);

  // --- LOGIC SECTION (Identical to your approved code) ---
  useEffect(() => {
    const fetchGlobalData = async () => {
        try {
            // Use window.ethereum or a default provider for read-only
            // In production, use a JsonRpcProvider if window.ethereum is undefined
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(addresses.CROWDSALE, CrowdsaleABI.abi, provider);
            
            const priceWei = await contract.pricePerTokenUSD();
            const priceEth = ethers.formatEther(priceWei);
            const paused = await contract.paused();
            
            setLivePrice(parseFloat(priceEth));
            setIsSalePaused(paused);
        } catch (e) { console.error("Price Fetch Error:", e); }
    };
    if (window.ethereum) fetchGlobalData();
  }, []);

  useEffect(() => {
    if (isConnected && signer) {
      updateUserData();
    } else {
      setBalances({ ETH: "0.0", USDT: "0.0", USDC: "0.0" });
    }
  }, [isConnected, signer, chainId]);

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
      const priceWei = await crowdContract.pricePerTokenUSD();
      setLivePrice(parseFloat(ethers.formatEther(priceWei)));
      const paused = await crowdContract.paused();
      setIsSalePaused(paused);
    } catch (e) { console.error("Data Load Error:", e); }
  };

  useEffect(() => {
    setStatus(""); setStatusColor("text-gray-400");
    if (!amount || isNaN(amount)) { setEstimatedEIT("0"); return; }
    const val = parseFloat(amount);
    let usdValue = (currency === "ETH") ? val * ESTIMATED_ETH_PRICE : val;
    const tokens = usdValue / livePrice; 
    setEstimatedEIT(tokens.toLocaleString());
  }, [amount, currency, livePrice]);

  const isCorrectNetwork = () => chainId === 11155111; 

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

    setIsLoading(true); setStatus(MESSAGES.STATUS_INIT); setStatusColor("text-yellow-300");

    try {
      const crowdsale = new ethers.Contract(addresses.CROWDSALE, CrowdsaleABI.abi, signer);

      if (currency === "ETH") {
        const tx = await crowdsale.buyWithNative({ value: ethers.parseEther(amount) });
        setStatus(MESSAGES.STATUS_WAITING); await tx.wait();
      } else {
        const tokenContract = new ethers.Contract(addresses.USDT, UsdtABI.abi, signer);
        const amountWei = ethers.parseUnits(amount, 6); 
        
        setStatus(MESSAGES.STATUS_APPROVE(currency));
        const txApprove = await tokenContract.approve(addresses.CROWDSALE, amountWei); await txApprove.wait();
        
        setStatus(MESSAGES.STATUS_CONFIRM);
        const txBuy = await crowdsale.buyWithStablecoin(addresses.USDT, amountWei); await txBuy.wait();
      }
      setStatus(MESSAGES.SUCCESS_PURCHASE(estimatedEIT)); setStatusColor("text-green-400 font-bold");
      setAmount(""); updateUserData();
    } catch (e) {
      console.error(e); setStatusColor("text-red-400");
      setStatus(MESSAGES.ERR_GENERIC + (e.reason || "Transaction Error"));
    } finally { setIsLoading(false); }
  };

  // --- RENDER (The Beautiful Layout) ---
  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">
     
      {/* 1. COMPLIANCE GATE (Loads first) */}
       <ComplianceModal />  {/* WE SHOULD ENABLE THIS IN PRODUCTION*/}



      <Navbar />

      <Hero 
        // Pass all the props needed for the TokenSaleCard
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
        isLoading={isLoading}
        status={status}
        statusColor={statusColor}
        isSalePaused={isSalePaused}
      />

      {/* SEPARATOR 1 */}
      <SectionSeparator />
      <Features />

      {/* SEPARATOR 2 */}
      <SectionSeparator />
      <Tokenomics />

      {/* SEPARATOR 3 */}
      <SectionSeparator />
      <Roadmap />
      <Footer contractAddress={addresses.EIT} />

    </div>
  );
}

export default App;
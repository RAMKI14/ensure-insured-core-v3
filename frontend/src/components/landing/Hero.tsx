import React from 'react';
import { Share2 } from 'lucide-react';
import TokenSaleCard from '../TokenSaleCard';
import ProgressBar from './ProgressBar';
import UKCoolingOff from './UKCoolingOff';
import ReferralWidget from '../ReferralWidget';
import KycVerificationPanel from '../KycVerificationPanel';
import { HeroHighlight, TextHighlight } from '../ui/hero-highlight';
import { TypewriterEffect } from '../ui/typewriter-effect';
import addresses from '../../frontend-config.json'; 

const Hero = ({ 
  totalRaised, 
  phaseInfo, 
  ukFirstSeen, 
  account, 
  activeReferrer, 
  kycPanel,
  // Detructure individual props for TokenSaleCard from ...props to avoid lint errors
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
  ethPrice,
  ...props 
}) => {

  return (
    <HeroHighlight 
      containerClassName="min-h-screen lg:min-h-[100dvh] !h-auto flex flex-col pt-20"
      className="w-full flex-grow flex flex-col justify-center py-6 lg:py-10"
    >
      <section className="relative w-full flex flex-col overflow-x-hidden">

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10 w-full">
        
        {/* LEFT: CONTENT */}
        <div className="text-center lg:text-left mt-10 lg:mt-0">
          <div className="inline-block px-3 py-1 mb-6 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            Live on Polygon Mainnet
          </div>
          <div className="mb-6 h-[120px] lg:h-auto flex items-center justify-center lg:justify-start">
            <TypewriterEffect 
              words={[
                { text: "The" },
                { text: "Future" },
                { text: "of" },
                { text: "Insurance" },
                { text: "on" },
                { text: "Chain.", className: "text-[#a855f7] !text-purple-500 font-extrabold" },
              ]}
              className="text-5xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-xl text-center lg:text-left"
              cursorClassName="bg-purple-500"
            />
          </div>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed drop-shadow-md">
            Eliminate uninsured vehicles, prevent fraud, and automate compliance. 
            Participate in the EIT Token Sale to power the global verification engine.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg shadow-white/10 text-center">Read Whitepaper</a>
            <a href={`https://polygonscan.com/address/${addresses.EIT}`} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-lg font-bold hover:bg-white/20 transition backdrop-blur-md text-center">View Contract</a>
          </div>
        </div>

        {/* RIGHT: TOKEN SALE WIDGET AREA */}
        <div className="flex flex-col items-center lg:items-end relative z-10 w-full">
            
            <div className="w-full max-w-[450px] relative pt-0 overflow-visible">
                
                
                {/* UK LOCK OVERLAY */}
                {ukFirstSeen && (
                    <UKCoolingOff firstSeenTime={ukFirstSeen} />
                )}


                {/* THE TOKEN CARD (All props passed explicitly now) */}
                <TokenSaleCard 
                    account={account}
                    isCorrectNetwork={isCorrectNetwork}
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
                    totalRaised={totalRaised}
                    phaseInfo={phaseInfo}
                    activeReferrer={activeReferrer}
                    ethPrice={ethPrice}
                    kycOverlay={kycPanel?.overlay}
                    {...props} 
                />

                {kycPanel?.modalVisible && (
                  <div className="absolute inset-0 z-40 rounded-xl bg-slate-950/70 p-4 backdrop-blur-md">
                    <div className="h-full overflow-y-auto">
                      <KycVerificationPanel {...kycPanel} visible={true} />
                    </div>
                  </div>
                )}


            </div>
        </div>

      </div>
      </section>
    </HeroHighlight>
  );
};

export default Hero;

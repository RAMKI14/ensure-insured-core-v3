import React from 'react';
import TokenSaleCard from '../TokenSaleCard';
import ProgressBar from './ProgressBar';
import UKCoolingOff from './UKCoolingOff';
// 1. IMPORT REFERRAL WIDGET
import ReferralWidget from '../ReferralWidget';
import KycVerificationPanel from '../KycVerificationPanel';
import heroBg from '../../assets/hero-bg.jpeg'; 
import addresses from '../../frontend-config.json'; 

const Hero = ({ totalRaised, phaseInfo, ukFirstSeen, account, activeReferrer, kycPanel, ...props }) => {
  // ^ Note: We extracted 'account' from props here so we can pass it to ReferralWidget
  const showReferral = !kycPanel?.hideReferral;

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-x-hidden">
      
      {/* BACKGROUND IMAGE LAYER */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
        style={{ 
            backgroundColor: '#111827', 
            backgroundImage: `url(${heroBg})` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
        
        {/* LEFT: CONTENT */}
        <div className="text-center lg:text-left mt-10 lg:mt-0">
          <div className="inline-block px-3 py-1 mb-6 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            Live on Polygon Mainnet
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-xl">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Insurance on Chain.
            </span>
          </h1>
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
            
            <div className="w-full max-w-[450px] relative">
                
                {/* UK LOCK OVERLAY */}
                {ukFirstSeen && (
                    <UKCoolingOff firstSeenTime={ukFirstSeen} />
                )}

                {/* THE TOKEN CARD (Contains Progress Bar) */}
                <TokenSaleCard 
                    totalRaised={totalRaised}
                    phaseInfo={phaseInfo}
                    account={account} // Pass account down too
                    activeReferrer={activeReferrer}
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

                {/* 2. REFERRAL WIDGET (Placed directly below card) */}
                {showReferral && (
                  <div className="mt-6 animate-fade-in-up">
                      <ReferralWidget account={account} />
                  </div>
                )}
            </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;

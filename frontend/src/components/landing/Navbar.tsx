import React, { useState } from 'react';
import { ShieldCheck, Menu, X, Share2 } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { HoverBorderGradient } from '../ui/hover-border-gradient';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ account, onReferClick, referralEnabled = true }: { account?: string; onReferClick: () => void; referralEnabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Tokenomics', href: '#tokenomics' },
    { name: 'Roadmap', href: '#roadmap' },
    { name: 'Whitepaper', href: '/whitepaper.pdf', target: '_blank' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  const AceternityLogo = () => {
    return (
        <svg
            width="66"
            height="65"
            viewBox="0 0 66 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-black dark:text-white"
        >
            <path
                d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
                stroke="currentColor"
                strokeWidth="15"
                strokeMiterlimit="3.86874"
                strokeLinecap="round"
            />
        </svg>
    );
};

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* 1. LOGO */}
        <div className="flex items-center gap-2 cursor-pointer z-50">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Ensure Insured</span>
        </div>

        {/* 2. DESKTOP MENU (Hidden on Mobile) */}
        <div 
          className="hidden md:flex items-center gap-2"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {menuItems.map((item, index) => (
            <a 
              key={item.name}
              href={item.href}
              target={item.target}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="relative px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium rounded-full border border-transparent hover:border-white/10"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-white/10 to-transparent backdrop-blur-md rounded-full -z-10 border border-white/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    layoutId="hoverBackground"
                    initial={{ opacity: 0, scale: 0.9, y: 2 }}
                    animate={{ 
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: { 
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      },
                    }}
                    exit={{ 
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.15 },
                    }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">{item.name}</span>
            </a>
          ))}

          {/* REFER BUTTON - SEPARATED BY GAP */}
          {account && referralEnabled && (
            <div className="ml-8 border-l border-white/10 pl-8">
              <button 
                onClick={onReferClick}
                className="group flex items-center gap-2 px-5 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/5 backdrop-blur-sm"
              >
                <Share2 size={14} className="group-hover:rotate-12 transition-transform" />
                Refer & Earn
              </button>
            </div>
          )}
        </div>

        {/* 3. CONNECT BUTTON & MOBILE TOGGLE */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <HoverBorderGradient 
                            onClick={openConnectModal} 
                            containerClassName="rounded-full" 
                            className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
                          >
                            <AceternityLogo />
                            <span>Connect Wallet</span>
                          </HoverBorderGradient>
                        );                      }

                      if (chain.unsupported) {
                        return (
                          <HoverBorderGradient 
                            onClick={openChainModal} 
                            containerClassName="rounded-full" 
                            className="bg-red-500 text-white flex items-center space-x-2"
                          >
                            <span>Wrong Network</span>
                          </HoverBorderGradient>
                        );
                      }
                      return (
                        <button 
                          onClick={openAccountModal} 
                          className="px-8 py-2 bg-white/5 border border-emerald-500/30 rounded-full text-white text-xs font-bold transition-all hover:bg-emerald-500/10 flex flex-col items-center justify-center min-w-[180px] shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] group/wallet"
                        >
                          <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase group-hover:text-emerald-300 transition-colors">Connected To</span>
                          <span className="text-[12px] font-bold tracking-wide mt-0.5">{account.displayName}</span>
                        </button>
                      );                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {/* Hamburger Icon (Visible only on Mobile) */}
          <button className="md:hidden text-gray-300 hover:text-white z-50" onClick={toggleMenu}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* 4. MOBILE MENU DROPDOWN */}
      <div className={`md:hidden absolute top-20 left-0 w-full bg-black border-b border-white/5 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <div className="flex flex-col p-6 space-y-6 text-center">
            <a href="#features" onClick={toggleMenu} className="text-gray-300 text-lg font-medium">Features</a>
            <a href="#tokenomics" onClick={toggleMenu} className="text-gray-300 text-lg font-medium">Tokenomics</a>
            <a href="#roadmap" onClick={toggleMenu} className="text-gray-300 text-lg font-medium">Roadmap</a>
            
            {/* PDF Link Mobile */}
            <a 
                href="/whitepaper.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={toggleMenu} 
                className="text-gray-300 text-lg font-medium"
            >
                Whitepaper
            </a>
            
            {/* Mobile Connect Button */}
            <div className="pt-4 flex justify-center">
                <ConnectButton showBalance={false} />
            </div>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
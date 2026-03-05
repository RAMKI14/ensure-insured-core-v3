import React, { useState } from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* 1. LOGO */}
        <div className="flex items-center gap-2 cursor-pointer z-50">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Ensure Insured</span>
        </div>

        {/* 2. DESKTOP MENU (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-400 hover:text-white transition text-sm font-medium">Features</a>
          <a href="#tokenomics" className="text-gray-400 hover:text-white transition text-sm font-medium">Tokenomics</a>
          <a href="#roadmap" className="text-gray-400 hover:text-white transition text-sm font-medium">Roadmap</a>
          {/* PDF Link */}
          <a 
            href="/whitepaper.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition text-sm font-medium"
          >
            Whitepaper
          </a>
        </div>

        {/* 3. CONNECT BUTTON & MOBILE TOGGLE */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>

          {/* Hamburger Icon (Visible only on Mobile) */}
          <button className="md:hidden text-gray-300 hover:text-white z-50" onClick={toggleMenu}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* 4. MOBILE MENU DROPDOWN */}
      <div className={`md:hidden absolute top-20 left-0 w-full bg-gray-900 border-b border-gray-800 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
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
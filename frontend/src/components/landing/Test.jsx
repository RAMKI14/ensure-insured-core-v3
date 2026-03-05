import React, { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import LegalModal from './LegalModal'; // Import the new modal
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../constants/legalText';

const Footer = ({ contractAddress }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", text: "" });

  const openModal = (title, text) => {
    setModalContent({ title, text });
    setModalOpen(true);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    // Restore background scrolling
    document.body.style.overflow = 'unset';
  };

  const handleCopyAddress = async () => {
    try {
        await navigator.clipboard.writeText(contractAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 5000); 
    } catch (err) { console.error("Copy failed", err); }
  };

  return (
    <>
        <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
            
            {/* 1. BRAND COLUMN */}
            <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Ensure Insured</h3>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
                The world's first blockchain-based insurance enforcement ecosystem. 
                Eliminating fraud and automating compliance through decentralized infrastructure.
            </p>
            </div>

            {/* 2. LINKS COLUMN */}
            <div className="col-span-1">
            <h4 className="text-white font-bold mb-6 tracking-wide">Ecosystem</h4>
            <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Whitepaper</a></li>
                <li><a href="#tokenomics" className="hover:text-blue-400 transition-colors">Tokenomics</a></li>
                <li><a href="#roadmap" className="hover:text-blue-400 transition-colors">Roadmap</a></li>
                <li><a href="mailto:contact@ensureinsured.io" className="hover:text-blue-400 transition-colors">Contact Support</a></li>
            </ul>
            </div>

            {/* 3. CONTRACT ADDRESS COLUMN */}
            <div className="col-span-1 md:col-span-2 min-w-0">
            <h4 className="text-white font-bold mb-6 tracking-wide">Official Contract</h4>
            <div className="flex flex-col items-start gap-3 w-full">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                        EIT Token Address (Polygon)
                    </p>
                    
                    <div className="flex items-center gap-2 w-full max-w-full">
                        <div className="flex-1 min-w-0 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50 transition-all duration-200 overflow-x-auto scrollbar-hide">
                            <p className={`text-gray-400 font-mono text-xs leading-tight select-all ${
                                isCopied ? "w-full truncate" : "w-max"
                            }`}>
                                {contractAddress}
                            </p>
                        </div>
                        <button 
                            onClick={handleCopyAddress}
                            className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200 h-full ${
                                isCopied 
                                    ? "bg-green-500/10 border-green-500/20 text-green-400 cursor-default" 
                                    : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-500 hover:text-white cursor-pointer active:scale-95"
                            }`}
                            title="Copy Address"
                            style={{ minWidth: isCopied ? "85px" : "40px" }}
                        >
                            {isCopied ? <><Check size={14} /><span className="text-xs font-bold">Copied</span></> : <Copy size={14} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">
                        Always verify the address on official channels.
                    </p>
                </div>
            </div>

        </div>

        {/* COPYRIGHT & LEGAL LINKS */}
        <div className="max-w-7xl mx-auto px-6 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()} A Blocks Nexus Ltd. All rights reserved.
            </p>
            <div className="flex gap-6">
                <button 
                    onClick={() => openModal("Privacy Policy", PRIVACY_POLICY)}
                    className="text-xs text-gray-500 hover:text-white transition"
                >
                    Privacy Policy
                </button>
                <button 
                    onClick={() => openModal("Terms of Service", TERMS_OF_SERVICE)}
                    className="text-xs text-gray-500 hover:text-white transition"
                >
                    Terms of Service
                </button>
            </div>
        </div>
        
        {/* Scrollbar CSS */}
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </footer>

        {/* THE MODAL COMPONENT */}
        <LegalModal 
            isOpen={modalOpen} 
            onClose={closeModal} 
            title={modalContent.title} 
            content={modalContent.text} 
        />
    </>
  );
};

export default Footer;
import React, { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import LegalModal from './LegalModal';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../constants/legalText';

// --- SOCIAL ICONS HELPER ---
const SocialIcon = ({ name, className }) => {
    switch (name) {
        case 'X':
            return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
        case 'Telegram':
            return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>;
        case 'Medium':
            return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.82 24 12z" /></svg>;
        case 'Facebook':
            return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.651-2.797 2.895v1.076h3.44l-.45 3.667h-2.99v7.982c-5.008 1.438-10.279 1.438-15.017 0Z" /></svg>;
        case 'WhatsApp':
            return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>;
        default: return null;
    }
};

const Footer = ({ contractAddress }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", text: "" });

  const socials = [
    { name: "X", url: "https://x.com", color: "hover:text-white" },
    { name: "Telegram", url: "https://t.me", color: "hover:text-[#229ED9]" },
    { name: "Medium", url: "https://medium.com", color: "hover:text-white" },
    { name: "Facebook", url: "https://facebook.com", color: "hover:text-[#1877F2]" },
    { name: "WhatsApp", url: "https://whatsapp.com", color: "hover:text-[#25D366]" },
  ];

  const openModal = (title, text) => {
    setModalContent({ title, text });
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
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
        
        {/* 1. BRAND COLUMN (Spans 2/5) */}
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

          {/* SOCIAL ICONS (Restored) */}
          <div className="flex gap-4">
            {socials.map((social, index) => (
                <a 
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-500 transition-all duration-300 transform hover:-translate-y-1 ${social.color}`}
                    title={social.name}
                >
                    <SocialIcon name={social.name} className="w-5 h-5" />
                </a>
            ))}
          </div>

          
        </div>

        {/* 2. LINKS COLUMN */}
        <div className="col-span-1">
          <h4 className="text-white font-bold mb-3 tracking-wide">Ecosystem</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Whitepaper</a></li>
            <li><a href="#tokenomics" className="hover:text-blue-400 transition-colors">Tokenomics</a></li>
            <li><a href="#roadmap" className="hover:text-blue-400 transition-colors">Roadmap</a></li>
            <li><a href="mailto:contact@ensureinsured.io" className="hover:text-blue-400 transition-colors">Contact Support</a></li>
          </ul>
        </div>

        {/* 3. CONTRACT ADDRESS COLUMN */}
        <div className="col-span-1 md:col-span-2 min-w-0">
          <h4 className="text-white font-bold mb-3 tracking-wide">Official Contract</h4>
          <div className="flex flex-col items-start gap-3 w-full max-w-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                    EIT Token Address (Polygon)
                </p>
                
                <div className="flex items-center gap-2 w-full max-w-full">
                    {/* ADDRESS BOX */}
                    <div className="flex-1 min-w-0 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700/50 transition-all duration-200 overflow-x-auto scrollbar-hide">
                        <p className={`text-gray-400 font-mono text-xs leading-tight select-all ${
                             isCopied ? "w-full truncate" : "w-max"
                           }`}>
                            {contractAddress}
                        </p>
                    </div>

                    {/* BUTTON */}
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
                        {isCopied ? (
                            <>
                                <Check size={14} />
                                <span className="text-xs font-bold">Copied</span>
                            </>
                        ) : (
                            <Copy size={14} />
                        )}
                    </button>
                </div>
                
                <p className="text-[10px] text-gray-600 mt-1">
                    Always verify the address on official channels.
                </p>
            </div>
        </div>

      </div>

      {/* COPYRIGHT */}
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
      
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </footer>

    {/* MODAL */}
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
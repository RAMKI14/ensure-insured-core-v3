import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

const LegalModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    // BACKDROP (Frosted Glass)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      
      {/* MODAL WINDOW */}
      <div 
        className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent clicking inside from closing
      >
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500">
                    {title.includes("Privacy") ? <ShieldCheck size={24}/> : <FileText size={24}/>}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">{title}</h2>
            </div>
            
            <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
            >
                <X size={24} />
            </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 text-gray-300 leading-relaxed text-sm md:text-base space-y-4 custom-scrollbar">
            {content.split('\n').map((line, index) => (
                <p key={index} className={line.startsWith('**') ? "text-white font-bold text-lg mt-6 mb-2" : "mb-2"}>
                    {line.replace(/\*\*/g, '')}
                </p>
            ))}
        </div>

        {/* FOOTER ACTION */}
        <div className="p-6 border-t border-gray-800 bg-gray-900 rounded-b-2xl flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-lg"
            >
                I Understand
            </button>
        </div>

      </div>
    </div>
  );
};

export default LegalModal;
import React from 'react';
import { MapPin, Globe, ShieldCheck, Rocket, ChevronRight } from 'lucide-react';

// Direct path to public folder image
const ROADMAP_IMAGE = "/images/roadmap.jpeg";

const Roadmap = () => {
  const phases = [
    {
      id: "PHASE 1",
      title: "Foundation & India Pilot",
      period: "Q4 2025 - Q1 2026",
      color: "blue",
      icon: <MapPin size={24} />,
      status: "In Progress",
      items: [
        "Deploy EIT Token & Vesting Contracts (Sepolia/Polygon).",
        "Secure IRDAI regulatory approval for Blockchain integration.",
        "Launch Pilot in 2 States of India (10M+ Vehicles).",
        "Integrate 5 Major Insurance Providers via API.",
        "Seed Round Fundraising ($15M Target)."
      ]
    },
    {
      id: "PHASE 2",
      title: "Pan-India Expansion",
      period: "2026",
      color: "green",
      icon: <ShieldCheck size={24} />,
      status: "Upcoming",
      items: [
        "Rollout to all 28 Indian States (150M+ Vehicles).",
        "Achieve $50M+ Annual Platform Revenue (Fiat).",
        "Activate 'Buyback & Burn' Engine using fiat profits.",
        "Full integration with RTO & Traffic Police databases.",
        "CEX Listing for public liquidity."
      ]
    },
    {
      id: "PHASE 3",
      title: "Global Entry (MENA & SEA)",
      period: "2027",
      color: "orange",
      icon: <Globe size={24} />,
      status: "Planned",
      items: [
        "Establish Offshore HQ in BVI / SVG (Global Operations).", // <--- UPDATED
        "Pilot launch in UAE & Thailand (Cross-border verification).",
        "Localization of App (Arabic, Thai, Vietnamese).",
        "Strategic Partnerships with Global Insurers (Allianz, AXA).",
        "Expand Transaction Reserve for international liquidity."
      ]
    },
    {
      id: "PHASE 4",
      title: "Global Standardization",
      period: "2027+",
      color: "purple",
      icon: <Rocket size={24} />,
      status: "Vision",
      items: [
        "Expansion into Europe & North America markets.",
        "Establish EIT as the ISO Standard for digital insurance proof.",
        "Transition governance to a decentralized DAO.",
        "Full automation of claims settlement via Smart Contracts.",
        "Target: 500M+ Vehicles Secured Globally."
      ]
    }
  ];

  return (
    <section id="roadmap" className="py-24 bg-black relative overflow-hidden">
      
      
      {/* --- BACKGROUND IMAGE LAYER --- */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
          <img 
            src={ROADMAP_IMAGE} 
            alt="Roadmap Background" 
            // CHANGE: 'object-contain' ensures the full width (Map + Globe) is always visible.
            // It prevents the image from zooming in and cutting off the sides.
            className="w-full h-full object-contain object-center opacity-40" 
            onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
          />
          {/* Gradient Overlay to blend the image edges into the background */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-block px-3 py-1 mb-4 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
            The Journey
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Roadmap to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Global Adoption</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            A phased approach to digitizing insurance enforcement, starting with India's 300M vehicles.
          </p>
        </div>

        {/* TIMELINE CONTAINER */}
        <div className="relative">
            {/* The Central Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-800 rounded-full md:-translate-x-1/2"></div>

            <div className="space-y-12 md:space-y-24">
                {phases.map((phase, index) => {
                    const isEven = index % 2 === 0;
                    
                    const themeColor = {
                        blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
                        green: "text-green-400 border-green-500/30 bg-green-500/10",
                        orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
                        purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
                    }[phase.color];

                    const glowColor = {
                        blue: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                        green: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
                        orange: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
                        purple: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
                    }[phase.color];

                    return (
                        <div key={index} className={`relative flex items-center ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
                            
                            {/* DOT ON LINE */}
                            <div className={`absolute left-8 md:left-1/2 w-4 h-4 rounded-full border-4 border-gray-900 bg-${phase.color}-500 z-10 md:-translate-x-1/2 -translate-x-1/2 ${index === 0 ? "animate-ping" : ""}`}></div>
                            
                            {/* SPACER */}
                            <div className="hidden md:block w-1/2"></div>

                            {/* CONTENT CARD */}
                            <div className={`w-full md:w-1/2 pl-20 md:pl-0 ${isEven ? "md:pr-12" : "md:pl-12"}`}>
                                <div className={`relative p-8 rounded-2xl bg-gray-800/90 border ${themeColor.split(" ")[1]} backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${index === 0 ? glowColor : "hover:shadow-lg"}`}>
                                    
                                    {/* Arrow */}
                                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-800 border-l border-b ${themeColor.split(" ")[1]} rotate-45 ${isEven ? "-right-2.5 border-r-0 border-t-0" : "-left-2.5 border-l-1 border-b-1"}`}></div>

                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${themeColor}`}>
                                            {phase.icon}
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${themeColor.split(" ")[0]}`}>
                                                {phase.id}
                                            </div>
                                            <div className="text-white font-mono text-sm opacity-80">{phase.period}</div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4">{phase.title}</h3>
                                    
                                    <ul className="space-y-3">
                                        {phase.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                                                <ChevronRight size={16} className={`mt-0.5 shrink-0 ${themeColor.split(" ")[0]}`} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${index === 0 ? "bg-green-500 animate-pulse" : "bg-gray-600"}`}></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase">{phase.status}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
        
    </section>
  );
};

export default Roadmap;
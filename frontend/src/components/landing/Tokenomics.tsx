import React from 'react';
import { PieChart, Lock, Zap, Users, Briefcase, Database } from 'lucide-react';
import tokenomicsSvg from '../../assets/tokenomics.svg'; 

const Tokenomics = () => {
  const allocations = [
    { 
        label: "Public Sale (ICO)", 
        percent: 30, 
        value: "15B", 
        // Color: #f5b169 (Orange/Gold)
        textColor: "text-[#f5b169]", 
        cardBg: "bg-[#f5b169]/10", 
        borderColor: "border-[#f5b169]/20", 
        iconColor: "text-[#f5b169]",
        iconBg: "bg-[#f5b169]/10"
    },
    { 
        label: "Company Inventory", // Transaction Reserve
        percent: 30, 
        value: "15B", 
        // Color: #cc412f (Red/Rust)
        textColor: "text-[#cc412f]", 
        cardBg: "bg-[#cc412f]/10", 
        borderColor: "border-[#cc412f]/20", 
        iconColor: "text-[#cc412f]",
        iconBg: "bg-[#cc412f]/10"
    },
    { 
        label: "Staking Rewards", 
        percent: 5, 
        value: "2.5B", 
        // Color: Royal Blue (Example: #3b82f6 - Replace with your Pie Chart Hex)
        textColor: "text-[#3b82f6]", 
        cardBg: "bg-[#3b82f6]/10", 
        borderColor: "border-[#3b82f6]/20", 
        iconColor: "text-[#3b82f6]",
        iconBg: "bg-[#3b82f6]/10"
    },
    { 
        label: "Team & Advisors", 
        percent: 10, 
        value: "5B", 
        // Color: Yellow (Example: #eab308 - Replace with your Pie Chart Hex)
        textColor: "text-[#eab308]", 
        cardBg: "bg-[#eab308]/10", 
        borderColor: "border-[#eab308]/20", 
        iconColor: "text-[#eab308]",
        iconBg: "bg-[#eab308]/10"
    },
    { 
        label: "Strategic Partners", 
        percent: 10, 
        value: "5B", 
        // Color: Cyan/Blue (Example: #06b6d4 - Replace with your Pie Chart Hex)
        textColor: "text-[#06b6d4]", 
        cardBg: "bg-[#06b6d4]/10", 
        borderColor: "border-[#06b6d4]/20", 
        iconColor: "text-[#06b6d4]",
        iconBg: "bg-[#06b6d4]/10"
    },
    { 
        label: "Founders (Locked)", 
        percent: 15, 
        value: "7.5B", 
        // Color: Green (Example: #22c55e - Replace with your Pie Chart Hex)
        textColor: "text-[#22c55e]", 
        cardBg: "bg-[#22c55e]/10", 
        borderColor: "border-[#22c55e]/20", 
        iconColor: "text-[#22c55e]",
        iconBg: "bg-[#22c55e]/10"
    },
    
    
    
  ];

  const getIcon = (label) => {
      if(label.includes("Public")) return <Zap size={18}/>;
      if(label.includes("Inventory")) return <Database size={18}/>;
      if(label.includes("Founders")) return <Lock size={18}/>;
      if(label.includes("Team")) return <Users size={18}/>;
      if(label.includes("Strategic")) return <Briefcase size={18}/>;
      return <PieChart size={18}/>;
  }

  return (
    <section id="tokenomics" className="py-24 bg-black border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* LEFT: CONTENT & STATS */}
        <div className="flex flex-col justify-center h-full">
            <div className="inline-block px-3 py-1 mb-4 border border-purple-500/30 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider w-fit">
                Transparent Economy
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-6">
                Tokenomics Designed for <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Long-Term Scarcity</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg leading-relaxed">
                Total Supply: <span className="text-white font-bold">50 Billion EIT</span>. 
                Our "Burn & Recycle" mechanics ensure supply decreases with every platform transaction.
            </p>

            {/* Allocation Grid - WIDER & SHORTER CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allocations.map((item, index) => (
                    <div 
                        key={index} 
                        className={`px-4 py-3 rounded-xl border ${item.borderColor} ${item.cardBg} flex items-center justify-between transition-transform hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm group`}
                    >
                        {/* LEFT SIDE: Icon + Text */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} border border-white/5`}>
                                {getIcon(item.label)}
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">{item.label}</div>
                                <div className={`text-sm font-mono ${item.textColor} font-bold`}>{item.value} Tokens</div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Big Percent */}
                        <div className="text-xl font-extrabold text-white opacity-90">
                            {item.percent}%
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: VISUAL (SVG) */}
        <div className="relative flex justify-center items-center h-full min-h-[400px]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            
            {/* The SVG Image */}
            <div className="relative z-10 w-full flex justify-center">
                <img 
                    src={tokenomicsSvg} 
                    alt="EIT Tokenomics Chart" 
                    className="w-full h-auto max-h-[500px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                />
            </div>
        </div>

      </div>
      
    </section>
  );
};

export default Tokenomics;
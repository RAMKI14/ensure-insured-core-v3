import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    ShieldCheck, 
    Layers
} from 'lucide-react';

// Counter component for 0 -> Value animation
const Counter = ({ value, duration = 2, delay = 0 }) => {
  const [count, setCount] = useState<string | number>(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) {
        setCount(value);
        return;
    }
    
    // Simple linear interpolation for the counter
    const startTime = performance.now();
    
    const updateCount = (now) => {
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use an easeOutQuad function for smoother counting
        const easeProgress = progress * (2 - progress);
        const currentCount = (easeProgress * end).toFixed(1);
        
        setCount(currentCount);
        
        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            setCount(value); // Final check to hit exact string
        }
    };
    
    const timeout = setTimeout(() => {
        requestAnimationFrame(updateCount);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return <span>{count}</span>;
}

const TokenomicsPremium = () => {
  const [activeIndex, setActiveIndex] = useState(0); 
  const [isHovered, setIsHovered] = useState(false);

  const TOTAL_SUPPLY = "50 Billion";
  const TOKEN_TICKER = "$EIT";

  // Data Clusters
  const clusters = [
    {
      id: 0, // Top-Left
      title: "Community & Ecosystem",
      percent: "35.0",
      glow: "rgba(168, 85, 247, 0.4)", // Purple
      color: "#A855F7",
      items: [
        { label: "Public Sale (ICO)", subLabel: "In Phases", value: "30.0", amount: "15", unit: "B", color: "#A855F7" },
        { label: "Staking Rewards", subLabel: "Long-term Incentives", value: "5.0", amount: "2.5", unit: "B", color: "#C084FC" },
      ]
    },
    {
      id: 1, // Top-Right
      title: "Core Contributors",
      percent: "25.0",
      glow: "rgba(59, 130, 246, 0.4)", // Blue
      color: "#3B82F6",
      items: [
        { label: "Founders", subLabel: "48 MONTHS LOCKED", value: "15.0", amount: "7.5", unit: "B", color: "#3B82F6" },
        { label: "Team & Advisors", subLabel: "Cliff & Vesting Schedule", value: "10.0", amount: "5", unit: "B", color: "#60A5FA" },
      ]
    },
    {
      id: 2, // Bottom-Left
      title: "Early Backers",
      percent: "10.0",
      glow: "rgba(34, 197, 94, 0.4)", // Green
      color: "#22C55E",
      items: [
        { label: "Strategic Partners", subLabel: "Marketing & PR", value: "10.0", amount: "5", unit: "B", color: "#22C55E" },
        { label: "Vesting Details", subLabel: "Cliff & Vesting Schedule", value: "", amount: "", unit: "", color: "#4ADE80" },
      ]
    },
    {
      id: 3, // Bottom-Right
      title: "Treasury & Liquidity",
      percent: "30.0",
      glow: "rgba(234, 179, 8, 0.4)", // Yellow
      color: "#EAB308",
      items: [
        { label: "Company Inventory", subLabel: "Platform Reserve", value: "30.0", amount: "15", unit: "B", color: "#EAB308" },
      ]
    }
  ];

  // Rotation Mapping (Ball starts at 3 o'clock/Right):
  // Top-Left: 225deg, Top-Right: 315deg, Bottom-Left: 135deg, Bottom-Right: 45deg
  const rotationMap = [225, 315, 135, 45];

  useEffect(() => {
    if (isHovered) return; // Pause on hover

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section id="tokenomics-premium" className="py-24 bg-[#050505] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Header Area */}
            <div className="text-center mb-16 relative">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest"
                >
                    <ShieldCheck size={14} />
                    Economic Infrastructure
                </motion.div>
                <div className="relative inline-block">
                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight flex flex-wrap items-center justify-center gap-4"
                  >
                      <span>{TOKEN_TICKER}</span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 pb-2">
                        Tokenomics
                      </span>
                  </motion.h2>
                </div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
                >
                    A balanced distribution model engineered for stability and confidence.
                </motion.p>
            </div>

            {/* Main Interactive Interactive Stage */}
            <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center">
                
                {/* MOBILE VIEW (Stacked Cards) */}
                <div className="lg:hidden w-full space-y-4 px-4 pb-12">
                    <div className="w-full py-8 text-center flex flex-col items-center">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Total Supply</div>
                        <div className="px-6 py-3 border border-white/10 bg-white/5 rounded-full inline-flex items-center gap-3 shadow-xl">
                            <span className="text-2xl font-black text-white">{TOTAL_SUPPLY}</span>
                            <span className="text-blue-400 font-bold text-sm tracking-widest">{TOKEN_TICKER}</span>
                        </div>
                    </div>

                    {clusters.map((cluster, idx) => (
                        <ClusterCard 
                            key={idx} 
                            cluster={cluster} 
                            isActive={activeIndex === idx} 
                            forceActive={true}
                        />
                    ))}
                </div>

                {/* DESKTOP VIEW: Stable Rectangle Layout */}
                <div className="hidden lg:block relative w-full h-[650px] max-w-5xl mx-auto">
                    
                    {/* layer 1: THE CORNER CARDS (Fixed Absolute Pinning) */}
                    <div className="absolute inset-0">
                        {/* Top-Left */}
                        <div className="absolute top-[5%] left-0 z-40" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <ClusterCard cluster={clusters[0]} isActive={activeIndex === 0} />
                        </div>
                        {/* Top-Right */}
                        <div className="absolute top-[5%] right-0 z-40" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <ClusterCard cluster={clusters[1]} isActive={activeIndex === 1} />
                        </div>
                        {/* Bottom-Left */}
                        <div className="absolute bottom-[5%] left-0 z-40" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <ClusterCard cluster={clusters[2]} isActive={activeIndex === 2} />
                        </div>
                        {/* Bottom-Right */}
                        <div className="absolute bottom-[5%] right-0 z-40" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <ClusterCard cluster={clusters[3]} isActive={activeIndex === 3} />
                        </div>
                    </div>

                    {/* layer 2: THE CENTRAL DONUT (Dead Center Absolute flex) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-80 h-80 pointer-events-auto">
                            {/* The Orbiting Ball Path */}
                            <motion.div 
                                className="absolute inset-[-55px] z-20"
                                animate={{ rotate: rotationMap[activeIndex] }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                            >
                                <motion.div 
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center"
                                    animate={{ backgroundColor: clusters[activeIndex].color, boxShadow: `0 0 45px ${clusters[activeIndex].color}` }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                                </motion.div>
                            </motion.div>

                            {/* Center Glow */}
                            <motion.div 
                                className="absolute inset-[-20px] blur-[120px] opacity-15 rounded-full pointer-events-none"
                                animate={{ backgroundColor: clusters[activeIndex].color }}
                                transition={{ duration: 1 }}
                            ></motion.div>
                            
                            {/* The Donut Base */}
                            <div className="relative w-full h-full rounded-full border-[12px] border-white/5 bg-[#0a0a0a] flex flex-col items-center justify-center shadow-2xl">
                                <div className="absolute inset-[-4px] rounded-full border-[2px] border-white/10 opacity-40"></div>
                                <div className="text-center relative z-20">
                                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-1">Total Supply</div>
                                    <div className="text-3xl font-black text-white tracking-tighter">{TOTAL_SUPPLY}</div>
                                    <div className="text-blue-400 font-bold text-xs mt-1 tracking-[0.2em]">{TOKEN_TICKER}</div>
                                </div>
                                <motion.div 
                                    className="absolute inset-0 rounded-full border opacity-15"
                                    animate={{ scale: [1, 1.3], opacity: [0.6, 0], borderColor: clusters[activeIndex].color }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

// Help Component for Clusters with Framer Motion
const ClusterCard = ({ cluster, isActive, forceActive = false }) => {
    const activeState = forceActive || isActive;

    return (
        <motion.div 
            layout
            initial={false}
            animate={{ 
                borderColor: activeState ? cluster.color : "rgba(255, 255, 255, 0.05)",
                backgroundColor: activeState ? "rgba(12, 12, 12, 0.95)" : "rgba(12, 12, 12, 0.8)",
                scale: activeState ? 1.05 : 0.95,
                opacity: activeState ? 1 : 0.3,
                boxShadow: activeState ? `0 20px 50px -10px ${cluster.glow}` : "none",
                y: activeState ? -5 : 0
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`w-full lg:w-[300px] border rounded-2xl p-6 backdrop-blur-3xl shadow-2xl flex flex-col ${
                !activeState && 'grayscale'
            } transition-all duration-300`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">{cluster.title}</h3>
                    <div className="text-3xl font-black text-white">
                        {activeState ? (
                            <><Counter value={cluster.percent} />%</>
                        ) : (
                            <>{cluster.percent}%</>
                        )}
                    </div>
                </div>
                <motion.div 
                    animate={{ rotate: activeState ? 360 : 0 }}
                    transition={{ duration: 1, ease: "backOut" }}
                    className={`p-2 rounded-lg ${activeState ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-700'}`}
                >
                    <Layers size={18} />
                </motion.div>
            </div>

            <div className="space-y-4">
                {cluster.items.map((item, idx) => (
                    <div key={idx} className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <motion.div 
                                    animate={activeState ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ backgroundColor: activeState ? item.color : '#222', boxShadow: activeState ? `0 0 10px ${item.color}` : 'none' }}
                                />
                                <span className={`text-[12px] font-bold ${activeState ? 'text-gray-200' : 'text-gray-600'}`}>{item.label}</span>
                            </div>
                            {item.value && (
                                <span className={`text-[12px] font-mono ${activeState ? 'text-gray-400' : 'text-gray-800'}`}>
                                    {activeState ? <Counter value={item.value} delay={0.2 * idx} /> : item.value}%
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{item.subLabel}</span>
                            {item.amount && (
                                <span className={`text-sm font-black ${activeState ? 'text-white' : 'text-gray-700'}`}>
                                    {activeState ? <Counter value={item.amount} delay={0.3 * idx} /> : item.amount}{item.unit}
                                </span>
                            )}
                        </div>
                        
                        {/* Micro Progress Bar Overlay for active state */}
                        {activeState && item.value && (
                            <motion.div 
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-[1px] w-full bg-white/5 mt-2 origin-left"
                            >
                                <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent w-full"></div>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export default TokenomicsPremium;







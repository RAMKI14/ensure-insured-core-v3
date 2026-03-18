import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { MapPin, Globe, ShieldCheck, Rocket, ChevronRight, Activity } from 'lucide-react';

const Roadmap = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: timelineRef,
        offset: ["start 90%", "end 45%"] // Reaches 100% when timeline bottom is near screen center
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 800,
        damping: 50,
        restDelta: 0.001
    });

    // Phase Data with Tokenomics-Consistent Colors
    const phases = [
        {
            id: "PHASE 1",
            title: "Foundation & India Pilot",
            period: "Q3 2026 - Q4 2026",
            color: "#3B82F6", // Tokenomics Blue
            glow: "rgba(59, 130, 246, 0.4)",
            icon: <MapPin size={22} />,
            status: "In Progress",
            items: [
                "Deploy EIT Token & Vesting Contracts.",
                "Secure IRDAI regulatory approval for Blockchain.",
                "Launch Pilot in 2 States of India (10M+ Vehicles).",
                "Integrate 5 Major Insurance Providers via API.",
                "Seed Round Fundraising ($15M Target)."
            ]
        },
        {
            id: "PHASE 2",
            title: "Pan-India Expansion",
            period: "Q2 2027",
            color: "#22C55E", // Tokenomics Green
            glow: "rgba(34, 197, 94, 0.4)",
            icon: <ShieldCheck size={22} />,
            status: "Upcoming",
            items: [
                "Rollout to all 28 Indian States (150M+ Vehicles).",
                "Achieve $50M+ Annual Platform Revenue.",
                "Activate 'Buyback & Burn' Engine via fiat profits.",
                "Full integration with RTO & Traffic Police.",
                "CEX Listing for public liquidity."
            ]
        },
        {
            id: "PHASE 3",
            title: "Global Entry (MENA & SEA)",
            period: "Q4 2027",
            color: "#EAB308", // Tokenomics Yellow
            glow: "rgba(234, 179, 8, 0.4)",
            icon: <Globe size={22} />,
            status: "Planned",
            items: [
                "Establish Offshore HQ in BVI / SVG.",
                "Pilot launch in UAE & Thailand.",
                "Localization of App (Arabic, Thai, Vietnamese).",
                "Strategic Partnerships with Global Insurers.",
                "Expand Transaction Reserve for liquidity."
            ]
        },
        {
            id: "PHASE 4",
            title: "Global Standardization",
            period: "2027+",
            color: "#A855F7", // Tokenomics Purple
            glow: "rgba(168, 85, 247, 0.4)",
            icon: <Rocket size={22} />,
            status: "Vision",
            items: [
                "Expansion into Europe & North America markets.",
                "Establish EIT as the ISO Standard.",
                "Transition governance to a decentralized DAO.",
                "Automation of claims via Smart Contracts.",
                "Target: 500M+ Vehicles Secured Globally."
            ]
        }
    ];

    return (
        <section id="roadmap" className="py-20 bg-[#050505] relative overflow-hidden font-sans">
            {/* Atmosphere Layer - No Image */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-[800px] h-[800px] bg-blue-600/5 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-1/4 -right-20 w-[800px] h-[800px] bg-purple-600/5 blur-[160px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header - Consistent with Tokenomics */}
                <div className="flex flex-col items-center mb-16 text-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-blue-500/20 rounded-full bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]"
                    >
                        <Activity size={12} className="text-blue-500 animate-pulse" />
                        Strategic Trajectory
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight"
                    >
                        Roadmap to <br />
                        <span className="text-white">Global </span>
                        <span className="text-[#A855F7]">Adoption</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-xl font-medium leading-relaxed opacity-60">
                        A phased evolution starting from India's pilot toward the worldwide
                        standard for trustless insurance enforcement.
                    </p>
                </div>

                {/* Timeline Engine */}
                <div className="relative" ref={timelineRef}>
                    {/* The "Orbit" Line - Subtle & Premium */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-white/10 md:-translate-x-1/2 -translate-x-1/2" />

                    {/* The Animated "Energy" Bar - Ultra-Thin Purple */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-white/5 md:-translate-x-1/2 -translate-x-1/2">
                        <motion.div
                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-400 via-purple-500 to-purple-900 origin-top"
                            style={{
                                scaleY,
                                boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)"
                            }}
                        />
                    </div>

                    <div className="space-y-12 md:space-y-16">
                        {phases.map((phase, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <div key={index} className={`relative flex items-center ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>

                                    {/* Pivot Point */}
                                    <div className="absolute left-8 md:left-1/2 w-3 h-3 rounded-full bg-black border-2 border-white/10 z-20 md:-translate-x-1/2 -translate-x-1/2 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="absolute inset-0 rounded-full"
                                            style={{ backgroundColor: phase.color }}
                                        />
                                    </div>

                                    <div className="hidden md:block w-1/2"></div>

                                    {/* Premium Content Card */}
                                    <div className={`w-full md:w-1/2 pl-10 md:pl-0 ${isEven ? "md:pl-2" : "md:pr-2"}`}>
                                        <motion.div
                                            initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, margin: "-100px" }}
                                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                            className="group relative"
                                        >
                                            <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0a0a]/90 backdrop-blur-3xl p-8 transition-all duration-700 hover:border-white/20 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">

                                                {/* Header Style consistent with Tokenomics Cards */}
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">
                                                            {phase.id}
                                                        </h4>
                                                        <div className="text-white font-black text-sm tracking-widest opacity-30">{phase.period}</div>
                                                    </div>
                                                    <div
                                                        className="p-3 rounded-xl bg-white/5 transition-all duration-500 group-hover:bg-white/10 shadow-2xl"
                                                        style={{ color: phase.color }}
                                                    >
                                                        {phase.icon}
                                                    </div>
                                                </div>

                                                <h3 className="text-3xl font-black text-white mb-6 leading-tight tracking-tight">
                                                    {phase.title}
                                                </h3>

                                                {/* High-Tracking Premium Typography */}
                                                <div className="space-y-4">
                                                    {phase.items.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-4">
                                                            <div
                                                                className="mt-2 w-2.5 h-2.5 rounded-full shrink-0 opacity-20 group-hover:opacity-100 transition-opacity"
                                                                style={{ backgroundColor: phase.color }}
                                                            />
                                                            <p className="text-[12px] font-bold tracking-widest text-gray-500 leading-relaxed group-hover:text-gray-300 transition-colors">
                                                                {item}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Institutional Footer */}
                                                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${index === 0 ? "animate-pulse" : "opacity-20"}`}
                                                            style={{ backgroundColor: phase.color, boxShadow: `0 0 10px ${phase.color}` }}
                                                        />
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{phase.status}</span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                                                </div>

                                                {/* Ambient Hover Glow (Tokenomics Style) */}
                                                <div
                                                    className="absolute -inset-24 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-3xl pointer-events-none"
                                                    style={{ background: `radial-gradient(circle at center, ${phase.glow}, transparent 70%)` }}
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Economic Infrastructure Footer */}
                <div className="mt-40 text-center relative pt-48 pb-24 border-t border-white/5 overflow-visible">
                    {/* Ultra-Wide Background Glow - Ensuring no edge darkness */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-screen-xl h-[500px] bg-indigo-600/[0.08] blur-[200px] rounded-full pointer-events-none"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover="hover"
                        className="cursor-default group relative overflow-visible inline-block px-12 md:px-32 lg:px-48"
                    >
                        <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[1em] mb-8 opacity-50">Institutional Excellence</p>

                        <div className="relative">
                            {/* Decorative Multi-Color Sparkles */}
                            <motion.div
                                variants={{
                                    hover: { opacity: 1, scale: 1.2, y: -30, rotate: 15 },
                                    initial: { opacity: 0, scale: 0, y: 0, rotate: 0 }
                                }}
                                initial="initial"
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="absolute -top-14 left-[10%] text-[#FF75C3] pointer-events-none"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                </svg>
                            </motion.div>
                            <motion.div
                                variants={{
                                    hover: { opacity: 1, scale: 1, y: 30, x: 30, rotate: -15 },
                                    initial: { opacity: 0, scale: 0, y: 0, x: 0, rotate: 0 }
                                }}
                                initial="initial"
                                transition={{ duration: 0.6, ease: "backOut" }}
                                className="absolute -bottom-12 right-[15%] text-[#00D2FF] pointer-events-none"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                </svg>
                            </motion.div>
                            <motion.div
                                variants={{
                                    hover: { opacity: 1, scale: 0.8, y: -20, x: 50, rotate: 45 },
                                    initial: { opacity: 0, scale: 0, y: 0, x: 0, rotate: 0 }
                                }}
                                initial="initial"
                                transition={{ duration: 0.7, ease: "backOut" }}
                                className="absolute -top-6 right-[5%] text-[#A855F7] pointer-events-none"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                </svg>
                            </motion.div>

                            <motion.h4
                                variants={{
                                    hover: {
                                        letterSpacing: "0.22em",
                                        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                                    }
                                }}
                                className="text-5xl md:text-8xl font-black text-white/10 tracking-tighter uppercase leading-none select-none transition-all duration-700 
                                group-hover:bg-[linear-gradient(to_right,#FF75C3,#A855F7,#00D2FF,#3B82F6,#6366F1)] group-hover:bg-clip-text group-hover:text-transparent"
                            >
                                EIT ECO SYSTEM
                            </motion.h4>

                            {/* Glimmer Scan Effect */}
                            <motion.div
                                variants={{
                                    hover: {
                                        x: ["-100%", "200%"],
                                        transition: { duration: 3.5, repeat: Infinity, ease: "linear" }
                                    }
                                }}
                                className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full pointer-events-none opacity-0 group-hover:opacity-100"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Roadmap;
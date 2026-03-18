import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const SystemArchitecture = () => {
    return (
        <section id="system-architecture" className="pt-24 pb-8 bg-[#050505] relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[160px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/5 blur-[160px] rounded-full"></div>
            </div>

            {/* Technical Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Section Header - Echoing Roadmap & Features */}
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-blue-500/20 rounded-full bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]"
                    >
                        <Zap size={12} className="text-blue-500" />
                        Operational Matrix
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight"
                    >
                        System <span className="text-[#A855F7]">Architecture</span>
                    </motion.h2>

                    <p className="text-gray-400 max-w-2xl mx-auto text-xl font-medium leading-relaxed opacity-60">
                        A decentralized protocol engineered for industrial-grade insurance
                        synchronization and seamless roadside enforcement.
                    </p>
                </div>

                {/* Hero Architecture Graphic */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-6xl mx-auto group"
                >
                    {/* Outer Glow for the Image - Optional but keeps it consistent with other sections */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-fuchsia-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative rounded-[2.5rem] overflow-hidden">
                        <img
                            src="/hero-architecture.png"
                            alt="System Architecture"
                            className="w-full h-auto object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default SystemArchitecture;

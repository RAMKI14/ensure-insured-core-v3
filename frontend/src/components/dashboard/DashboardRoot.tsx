import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    History, 
    Coins, 
    Users, 
    Bell, 
    X, 
    ChevronRight,
    Wallet,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';

// Sub-components (to be created)
import OverviewWidgets from './OverviewWidgets';
import TransactionHistory from './TransactionHistory';
import ClaimAndVesting from './ClaimAndVesting';
import ReferralStats from './ReferralStats';
import Announcements from './Announcements';

const API_URL = "http://localhost:3001/api";

interface DashboardRootProps {
    address: string;
    onClose: () => void;
}

const DashboardRoot: React.FC<DashboardRootProps> = ({ address, onClose }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'vesting' | 'referrals' | 'news'>('overview');
    const [icoStatus, setIcoStatus] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/ico-status`);
                const data = await res.json();
                setIcoStatus(data);
            } catch (e) {
                console.error("Error fetching ICO status in dashboard", e);
            }
        };
        fetchStatus();
    }, []);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'history', label: 'My Investments', icon: History },
        { id: 'vesting', label: 'Claim & Vesting', icon: Coins },
        { id: 'referrals', label: 'Referrals', icon: Users },
        { id: 'news', label: 'Updates', icon: Bell },
    ] as const;

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-fade-in overflow-hidden">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl h-full max-h-[850px] bg-[#0B0E14]/90 border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                {/* --- SIDEBAR NAVIGATION --- */}
                <div className="w-full md:w-64 bg-black/40 border-r border-white/5 p-6 flex flex-col gap-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-white font-black text-sm tracking-tighter">INVESTOR</h2>
                            <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase opacity-80">Portal V3</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2 flex-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                                    activeTab === tab.id 
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'} />
                                <span className="text-xs font-bold tracking-wide">{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        ))}
                    </nav>

                    {/* Announcement Bit */}
                    <div className="bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-white/5 rounded-3xl p-5 mt-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <Bell size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Updates</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                            Welcome to your investor portal. Track your investments, claim tokens, and stay updated.
                        </p>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
                    {/* Header */}
                    <div className="h-20 border-b border-white/5 px-8 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shrink-0">
                                <Wallet className="text-gray-400" size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Connected Wallet</p>
                                <p className="text-xs text-white font-mono truncate max-w-[150px] md:max-w-none">
                                    {address}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex flex-col items-end">
                                <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Mainnet Connected
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">Synced: &lt; 20ms</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-2xl border border-white/5 hover:border-red-500/20 transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {activeTab === 'overview' && <OverviewWidgets address={address} />}
                                {activeTab === 'history' && <TransactionHistory address={address} />}
                                {activeTab === 'vesting' && <ClaimAndVesting address={address} />}
                                {activeTab === 'referrals' && <ReferralStats address={address} icoStatus={icoStatus} />}
                                {activeTab === 'news' && <Announcements />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Background Style Overrides for custom scrollbar */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}} />
        </div>
    );
};

export default DashboardRoot;

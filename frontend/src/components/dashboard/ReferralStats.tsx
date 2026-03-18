import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    Link, 
    Copy, 
    Check, 
    Trophy, 
    AlertCircle,
    ArrowUpRight,
    MousePointer2,
    DollarSign
} from 'lucide-react';

const API_URL = "http://localhost:3001/api";

interface ReferralStatsProps {
    address: string;
    icoStatus: any;
}

const ReferralStats: React.FC<ReferralStatsProps> = ({ address, icoStatus }) => {
    const [stats, setStats] = useState<any>(null);
    const [totalInvested, setTotalInvested] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [statsRes, totalRes] = await Promise.all([
                    fetch(`${API_URL}/investor/referrals/${address}`),
                    fetch(`${API_URL}/investor/total/${address}`)
                ]);
                
                const statsData = await statsRes.json();
                const totalData = await totalRes.json();
                
                setStats(statsData);
                setTotalInvested(totalData.totalInvestedUSD || 0);
            } catch (e) {
                console.error("Error fetching referral stats", e);
            } finally {
                setLoading(false);
            }
        };

        if (address) fetchAllData();
    }, [address]);

    const referralLink = `${window.location.origin}?ref=${address}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />;

    return (
        <div className="space-y-8 pb-20">
            {/* Link Section */}
            <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-white/5 rounded-[2.5rem] p-8 md:p-12 text-center md:text-left relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="max-w-md space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            <Trophy size={12} />
                            Affiliate Program {(icoStatus?.referralActive && totalInvested >= 100) ? 'Active' : 'Locked'}
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight leading-tight">Your Referral Link</h3>
                        
                        {!icoStatus?.referralActive ? (
                            <p className="text-sm text-red-400/80 font-bold leading-relaxed border border-red-500/20 bg-red-500/5 p-4 rounded-2xl">
                                🚫 Referrals are currently not active. Please check back later or wait for an official announcement.
                            </p>
                        ) : totalInvested >= 100 ? (
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Invite your network to join EIT. You'll earn <span className="text-white font-bold">{icoStatus?.referralPercent || 5}% Commission</span> on every purchase they make, and they get a <span className="text-white font-bold">{icoStatus?.referralPercent || 5}% Bonus</span>!
                            </p>
                        ) : (
                            <p className="text-sm text-amber-500/80 font-bold leading-relaxed border border-amber-500/20 bg-amber-500/5 p-4 rounded-2xl">
                                ⚠️ Minimum $100 investment required to activate your referral link. You have currently invested <span className="text-white font-black">${totalInvested.toLocaleString()}</span>.
                            </p>
                        )}
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-4">
                        {icoStatus?.referralActive && totalInvested >= 100 ? (
                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-2 rounded-2xl md:w-96">
                                <code className="flex-1 px-4 text-xs font-mono text-gray-400 truncate text-left">{referralLink}</code>
                                <button 
                                    onClick={handleCopy}
                                    className={`p-3 rounded-xl transition-all active:scale-90 ${copied ? 'bg-green-500/20 text-green-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl md:w-96 flex flex-col items-center justify-center gap-2 opacity-50 grayscale">
                                <Users size={32} className="text-gray-500 mb-2" />
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Link Unavailable</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Decoration */}
                <Users className="absolute bottom-[-10%] right-[-5%] text-white/[0.02] w-64 h-64 pointer-events-none" />
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Total Referrals" 
                    value={stats?.totalReferrals || 0} 
                    icon={MousePointer2} 
                    subValue="Wallets joined via link"
                />
                <MetricCard 
                    title="Earnings (EIT)" 
                    value={stats?.totalEarnedEIT > 0 ? stats?.totalEarnedEIT?.toLocaleString() : "No Rewards"} 
                    icon={DollarSign} 
                    subValue="Total commission earned"
                    color="text-green-400"
                    bg="bg-green-500/10"
                />
                <MetricCard 
                    title="Pending Payouts" 
                    value={stats?.pendingPayouts > 0 ? stats?.pendingPayouts : "None"} 
                    icon={AlertCircle} 
                    subValue="Scheduled for next batch"
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                />
            </div>

            {/* Referral Log Table */}
            {stats?.referrals?.length > 0 && (
                <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="px-8 py-6 border-b border-white/5">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Direct Affiliate Log</h4>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Referee Wallet</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Purchase</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Reward</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {stats.referrals.map((ref: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="text-xs text-white font-mono">{ref.referee.slice(0, 10)}...{ref.referee.slice(-8)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-gray-400 font-bold">${ref.purchaseAmount?.toLocaleString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-black text-green-400">+{Number(ref.referrerReward).toLocaleString()} EIT</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${ref.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {ref.status || 'PROCESSING'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <p className="text-[10px] text-gray-500 font-bold">{new Date(ref.createdAt).toLocaleDateString()}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ title, value, subValue, icon: Icon, color = "text-blue-400", bg = "bg-blue-500/10" }: any) => (
    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 group hover:bg-white/5 transition-all">
        <div className={`p-2.5 rounded-xl ${bg} ${color} border border-white/5 mb-4 group-hover:scale-110 transition-transform inline-block`}>
            <Icon size={20} />
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-white tracking-tight mb-0.5">{value}</h4>
        <p className="text-[10px] text-gray-600 font-bold">{subValue}</p>
    </div>
);

export default ReferralStats;

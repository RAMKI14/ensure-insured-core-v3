import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    Coins,
    PieChart,
    ArrowUpRight,
    Trophy,
    Target
} from 'lucide-react';
import { ethers } from 'ethers';

const API_URL = "http://localhost:3001/api";

interface OverviewWidgetsProps {
    address: string;
}

const OverviewWidgets: React.FC<OverviewWidgetsProps> = ({ address }) => {
    const [stats, setStats] = useState<any>(null);
    const [icoStatus, setIcoStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, icoRes] = await Promise.all([
                    fetch(`${API_URL}/investor/total/${address}`),
                    fetch(`${API_URL}/ico-status`)
                ]);

                const statsData = await statsRes.json();
                const icoData = await icoRes.json();

                setStats(statsData);
                setIcoStatus(icoData);
            } catch (e) {
                console.error("Error fetching dashboard stats", e);
            } finally {
                setLoading(false);
            }
        };

        if (address) fetchData();
    }, [address]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/5" />
                ))}
            </div>
        );
    }

    const price = icoStatus?.priceUSD || (icoStatus?.phasePriceUSD) || 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Balance */}
                <WidgetCard
                    title="Total EIT Allocated"
                    value={stats?.totalEIT?.toLocaleString() || "0"}
                    subValue={stats?.totalInvestedUSD > 0 ? `Value: $${stats.totalInvestedUSD.toLocaleString()}` : `≈ $${(stats?.totalEIT * price).toLocaleString()}`}
                    icon={Coins}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    description="Total tokens across all allocation types"
                />

                {/* Investing Amount */}
                <WidgetCard
                    title="Public Sale Purchases"
                    value={stats?.publicEIT?.toLocaleString() || "0"}
                    subValue={stats?.publicEIT > 0 ? `Purchased with ${stats?.currenciesUsed || 'ETH/USDT'}` : "Direct ICO Participation"}
                    icon={TrendingUp}
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    description="Tokens bought during public crowdsale only"
                />

                {/* Vesting Amount */}
                <WidgetCard
                    title="Treasury / HR Vesting"
                    value={stats?.vestingEIT?.toLocaleString() || "0"}
                    subValue="Institutional Allocation"
                    icon={PieChart}
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                />

                {/* Referral Earnings */}
                <WidgetCard
                    title="Referral Rewards"
                    value={stats?.referralRewards > 0 ? `${stats.referralRewards.toLocaleString()} EIT` : "No Rewards"}
                    subValue={stats?.totalInvestedUSD >= 100 ? "Eligible for Referrals" : "Spend $100 to Unlock"}
                    icon={Trophy}
                    color="text-green-400"
                    bg="bg-green-500/10"
                />
            </div>

            {/* Middle Row: Progress & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ICO Status Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-48 h-48 rounded-full border-8 border-white/5 flex items-center justify-center relative">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="50%" cy="50%" r="42%"
                                className="fill-none stroke-white/5 stroke-[8px]"
                            />
                            <motion.circle
                                initial={{ strokeDasharray: "0 1000" }}
                                animate={{ strokeDasharray: "250 1000" }}
                                cx="50%" cy="50%" r="42%"
                                className="fill-none stroke-blue-500 stroke-[8px] transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-4 text-center">
                                {icoStatus?.isActive ? "Active Stage" : "Current Status"}
                            </p>
                            <h4 className={`font-black text-white tracking-tight ${(!icoStatus || !icoStatus.isActive || !icoStatus.phaseName) ? 'text-lg' : 'text-2xl'}`}>
                                {!icoStatus || icoStatus.id === undefined || !icoStatus.phaseName
                                    ? "No Sale Yet"
                                    : !icoStatus.isActive
                                        ? "No Active"
                                        : (icoStatus?.phaseName?.split(':')?.[0] || "Phase 2")
                                }
                            </h4>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={16} className="text-blue-400" />
                                <h3 className="text-lg font-black text-white tracking-tight">
                                    {!icoStatus || icoStatus.id === undefined || !icoStatus.phaseName
                                        ? "No Sale Yet"
                                        : !icoStatus.isActive
                                            ? "No Active"
                                            : (icoStatus?.phaseName?.split(':')?.[0] || "Phase 2")
                                    }
                                </h3>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">
                                {!icoStatus || !icoStatus.phaseName
                                    ? "Waiting for the official launch of the next investment phase. Stay tuned for updates."
                                    : `The current round is proceeding at a total target of `
                                }
                                {icoStatus?.phaseName && (
                                    <span className="text-white">${(icoStatus?.phaseTargetUSD || 0).toLocaleString()}</span>
                                )}
                                {icoStatus?.phaseName && ". Secure your tokens before the price increases in the next phase."}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Current Price</p>
                                <p className="text-xl font-black text-white">
                                    {price > 0 ? `$${price.toFixed(4)}` : "TBA"}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Next Price</p>
                                <p className="text-xl font-black text-gray-400">
                                    {icoStatus?.nextPriceUSD > 0 ? `$${icoStatus.nextPriceUSD.toFixed(4)}` : "TBA"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mini Stats Card */}
                <div className="bg-blue-600 border border-blue-500 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-[0_20px_40px_rgba(59,130,246,0.3)]">
                    <div>
                        <ArrowUpRight className="mb-4 opacity-50" size={32} />
                        <h4 className="text-xl font-black mb-2 leading-tight tracking-tight">EIT Ecosystem Valuation</h4>
                        <p className="text-blue-100/70 text-sm font-medium mb-6 leading-relaxed">Based on current trading volume and treasury assets.</p>
                    </div>
                    <div>
                        <p className="text-4xl font-black tracking-tighter mb-1">$0.018 <span className="text-sm text-blue-200 opacity-60 font-medium">EIT</span></p>
                        <p className="text-xs font-bold text-blue-200 tracking-widest uppercase">Institutional Fixed Price</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WidgetCard = ({ title, value, subValue, icon: Icon, color, bg, description }: any) => (
    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.05] group relative">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-xl ${bg} ${color} border border-white/5 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            <div className="h-1 w-8 bg-white/10 rounded-full" />
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-white tracking-tight mb-0.5">{value}</h4>
        <div className="flex flex-col gap-1">
            <p className="text-[10px] text-gray-400 font-bold">{subValue}</p>
            {description && <p className="text-[9px] text-gray-600 font-medium italic">{description}</p>}
        </div>
    </div>
);

export default OverviewWidgets;

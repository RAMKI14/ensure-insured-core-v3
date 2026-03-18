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

    const totalPhases = Math.max(Number(icoStatus?.totalPhases) || 1, 1);
    const currentIdx = Number(icoStatus?.currentPhase) || 0;
    const price = Number(icoStatus?.priceUSD) || 0;
    const phaseColors = [
        '#3B82F6', // Phase 1: Blue
        '#EAB308', // Phase 2: Yellow
        '#22C55E', // Phase 3: Green
        '#A855F7', // Phase 4: Purple
        '#F59E0B', // Phase 5: Amber
        '#EC4899', // Phase 6: Pink
        '#06B6D4'  // Phase 7: Cyan
    ];

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

                {/* Referral Rewards */}
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
            <div className="grid grid-cols-1 gap-6">
                {/* ICO Status Card */}
                <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="w-56 h-56 rounded-full border-8 border-white/5 flex items-center justify-center relative shadow-2xl">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background track */}
                            <circle
                                cx="50" cy="50" r="42"
                                className="fill-none stroke-white/10 stroke-[6px]"
                            />
                            
                            {/* Dynamic Phase Segments */}
                            {Array.from({ length: totalPhases }).map((_, i) => {
                                const circumference = 2 * Math.PI * 42;
                                const segment = circumference / totalPhases;
                                const gap = totalPhases > 1 ? 2 : 0;
                                const dash = segment - gap;
                                const offset = -(i * segment);
                                
                                const isFilled = i <= currentIdx;
                                const color = isFilled ? phaseColors[i % phaseColors.length] : 'rgba(255,255,255,0.05)';
                                
                                return (
                                    <circle
                                        key={i}
                                        cx="50" cy="50" r="42"
                                        className="fill-none transition-all duration-1000"
                                        stroke={color}
                                        strokeWidth={isFilled ? "8" : "4"}
                                        strokeDasharray={`${dash} ${circumference - dash}`}
                                        strokeDashoffset={offset}
                                        strokeLinecap={totalPhases > 1 ? "round" : "butt"}
                                        style={{ filter: isFilled ? `drop-shadow(0 0 8px ${color})` : 'none' }}
                                    />
                                );
                            })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-4 text-center">
                                {icoStatus?.isActive ? "Active Stage" : "Current Status"}
                            </p>
                            <h4 className={`font-black text-white tracking-tight ${(!icoStatus || !icoStatus.isActive || !icoStatus.phaseName) ? 'text-lg' : 'text-3xl'}`}>
                                {!icoStatus || icoStatus.id === undefined || !icoStatus.phaseName
                                    ? "No Sale Yet"
                                    : !icoStatus.isActive
                                        ? "No Active"
                                        : (icoStatus?.phaseName?.split(':')?.[0] || `Phase ${currentIdx + 1}`)
                                }
                            </h4>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Target size={20} className="text-blue-400" />
                                <h3 className="text-2xl font-black text-white tracking-tight">
                                    {!icoStatus || icoStatus.id === undefined || !icoStatus.phaseName
                                        ? "No Active Phase"
                                        : !icoStatus.isActive
                                            ? "ICO Not Started"
                                            : (icoStatus?.phaseName || "Stage 1")
                                    }
                                </h3>
                            </div>
                            <p className="text-base text-gray-400 font-medium leading-relaxed max-w-2xl">
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

                        <div className="flex flex-wrap gap-6">
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 min-w-[200px] flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Current Price</p>
                                <p className="text-3xl font-black text-white">
                                    {price > 0 ? `$${price.toFixed(4)}` : "TBA"}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 min-w-[200px] flex-1">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Next Price</p>
                                <p className="text-3xl font-black text-gray-400">
                                    {icoStatus?.nextPriceUSD > 0 ? `$${icoStatus.nextPriceUSD.toFixed(4)}` : "TBA"}
                                </p>
                            </div>
                        </div>
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

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Coins,
    Calendar,
    Lock,
    Unlock,
    ChevronRight,
    ArrowRightCircle,
    Info,
    CheckCircle2
} from 'lucide-react';
import { ethers } from 'ethers';
import addresses from '../../frontend-config.json';
import VestingVaultABI from '../../EITVestingVault.json';

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

interface ClaimAndVestingProps {
    address: string;
}

const ClaimAndVesting: React.FC<ClaimAndVestingProps> = ({ address }) => {
    const [schedule, setSchedule] = useState<any>(null);
    const [claimable, setClaimable] = useState<string>("0");
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    const fetchVestingData = async () => {
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(addresses.VESTING_VAULT, VestingVaultABI.abi, provider);

            // Get Schedule
            const scheduleData = await contract.vestingSchedules(address);

            if (scheduleData.totalAmount > 0n) {
                setSchedule({
                    isRevocable: scheduleData.isRevocable,
                    isRevoked: scheduleData.isRevoked,
                    totalAmount: ethers.formatEther(scheduleData.totalAmount),
                    amountClaimed: ethers.formatEther(scheduleData.amountClaimed),
                    startTime: Number(scheduleData.startTime),
                    cliffDuration: Number(scheduleData.cliffDuration),
                    vestingDuration: Number(scheduleData.vestingDuration),
                });

                // Calculate Claimable Now (Simplified simulation for UI, 
                // in real use we'd call a view function if available or match contract logic)
                const now = Math.floor(Date.now() / 1000);
                const start = Number(scheduleData.startTime);
                const cliff = Number(scheduleData.cliffDuration);
                const duration = Number(scheduleData.vestingDuration);
                const total = scheduleData.totalAmount;

                let vested = 0n;
                if (now >= start + cliff) {
                    if (now >= start + duration) {
                        vested = total;
                    } else {
                        vested = (total * BigInt(now - start)) / BigInt(duration);
                    }
                }

                const claimableWei = vested - scheduleData.amountClaimed;
                setClaimable(ethers.formatEther(claimableWei > 0n ? claimableWei : 0n));
            }
        } catch (e) {
            console.error("Error fetching vesting data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (address) fetchVestingData();
    }, [address]);

    const handleClaim = async () => {
        if (!window.ethereum || !address) return;
        try {
            setClaiming(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(addresses.VESTING_VAULT, VestingVaultABI.abi, signer);

            const tx = await contract.claim();
            await tx.wait();

            alert("Tokens claimed successfully!");
            fetchVestingData();
        } catch (e: any) {
            console.error("Claim failed", e);
            alert(e.reason || "Claim failed. Please try again.");
        } finally {
            setClaiming(false);
        }
    };

    if (loading) return <div className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />;

    if (!schedule) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="p-6 bg-white/5 rounded-full mb-6">
                    <Lock size={48} className="text-gray-600" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">No Vesting Schedule</h3>
                <p className="text-gray-500 max-w-sm font-medium">Your account does not have an active vesting schedule. This is normal for public sale participants who receive tokens directly.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Main Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="space-y-2">
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Available to Claim</p>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-5xl font-black text-white">
                                        {Number(claimable).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </h2>
                                    <span className="text-xl font-medium opacity-50">EIT</span>
                                </div>
                                <p className="text-xs text-gray-400 font-bold">Unlocks dynamically every second</p>
                            </div>

                            <button
                                onClick={handleClaim}
                                disabled={Number(claimable) <= 0 || claiming}
                                className={`group flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${Number(claimable) > 0 && !claiming
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_15px_30px_rgba(59,130,246,0.3)]'
                                        : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                                    }`}
                            >
                                {claiming ? "Processing..." : "Claim Tokens"}
                                <ArrowRightCircle size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />
                    </div>

                    {/* Progress Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ProgressMiniCard label="Total Allocated" value={schedule.totalAmount} icon={Coins} />
                        <ProgressMiniCard label="Already Claimed" value={schedule.amountClaimed} icon={CheckCircle2} color="text-green-500" />
                        <ProgressMiniCard label="Remaining Locked" value={Number(schedule.totalAmount) - Number(schedule.amountClaimed)} icon={Lock} color="text-amber-500" />
                    </div>
                </div>

                {/* Schedule Details */}
                <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={16} className="text-blue-400" />
                        Vesting Parameters
                    </h4>

                    <div className="space-y-4">
                        <ParamRow label="Start Date" value={new Date(schedule.startTime * 1000).toLocaleDateString()} />
                        <ParamRow label="Cliff End" value={new Date((schedule.startTime + schedule.cliffDuration) * 1000).toLocaleDateString()} />
                        <ParamRow label="Vesting End" value={new Date((schedule.startTime + schedule.vestingDuration) * 1000).toLocaleDateString()} />
                        <div className="h-px bg-white/5 my-2" />
                        <ParamRow label="Type" value={schedule.isRevocable ? "Revocable" : "Immutable"} highlight />
                        <ParamRow label="Status" value={schedule.isRevoked ? "Revoked" : "Active"} highlight={!schedule.isRevoked} />
                    </div>

                    <div className="mt-auto bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                            Vesting follows a linear model. Tokens unlock once per block after the cliff period.
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Timeline (Premium) */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-10">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h4 className="text-xl font-black text-white tracking-tight">Vesting Timeline</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Release Projection</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] text-gray-400 font-black uppercase">Unlocked</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/10" /><span className="text-[10px] text-gray-400 font-black uppercase">Locked</span></div>
                    </div>
                </div>

                <div className="relative pt-24 pb-12">
                    <VestingTimeline schedule={schedule} />
                </div>
            </div>
        </div>
    );
};

const ProgressMiniCard = ({ label, value, icon: Icon, color = "text-blue-400" }: any) => (
    <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
        <Icon size={20} className={`${color} mb-3`} />
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-white">{Number(value).toLocaleString()} <span className="text-[10px] opacity-50">EIT</span></p>
    </div>
);

const ParamRow = ({ label, value, highlight = false }: any) => (
    <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className={`text-xs font-bold ${highlight ? 'text-blue-400' : 'text-white'}`}>{value}</span>
    </div>
);

const VestingTimeline = ({ schedule }: any) => {
    const now = Math.floor(Date.now() / 1000);
    const progress = Math.min(100, Math.max(0, ((now - schedule.startTime) / schedule.vestingDuration) * 100));
    const cliffProgress = (schedule.cliffDuration / schedule.vestingDuration) * 100;

    return (
        <div className="px-12 md:px-20">
            <div className="relative w-full h-2">
                {/* Background Line */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full" />

                {/* Active Progress Line */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10"
                />

                {/* Cliff Marker */}
                <div className="absolute h-8 w-px bg-white/20 top-1/2 -translate-y-1/2 z-20" style={{ left: `${cliffProgress}%` }}>
                    <div className="absolute top-full mt-4 -translate-x-1/2 text-center whitespace-nowrap">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Cliff</p>
                        <p className="text-[10px] font-bold text-white">{(schedule.cliffDuration / 86400 / 30).toFixed(0)} Months</p>
                    </div>
                </div>

                {/* Start Marker */}
                <div className="absolute h-8 w-px bg-blue-500 top-1/2 -translate-y-1/2 z-20 left-0">
                    <div className="absolute bottom-full mb-4 left-0 text-left whitespace-nowrap">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">TGE</p>
                        <p className="text-[10px] font-bold text-white">{new Date(schedule.startTime * 1000).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* End Marker */}
                <div className="absolute h-8 w-px bg-white/20 top-1/2 -translate-y-1/2 z-20 right-0">
                    <div className="absolute bottom-full mb-4 right-0 text-right whitespace-nowrap">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Final Unlock</p>
                        <p className="text-[10px] font-bold text-white">{new Date((schedule.startTime + schedule.vestingDuration) * 1000).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Floating Now Bubble */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, left: `${progress}%` }}
                    className="absolute top-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
                >
                    <div className="w-4 h-4 rounded-full bg-white border-4 border-blue-600 shadow-[0_0_15px_rgba(59,130,246,1)]" />
                    <div className="absolute top-full mt-4 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-lg shadow-lg uppercase tracking-widest whitespace-nowrap">
                        Now
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default ClaimAndVesting;

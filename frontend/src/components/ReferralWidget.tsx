import React, { useState, useEffect } from 'react';
import { Share2, Copy, CheckCircle, Users, ExternalLink, X, Lock, AlertCircle, Check } from 'lucide-react';
import { ethers } from 'ethers';
import addresses from '../frontend-config.json';
import TokenABI from '../EnsureInsuredToken.json'; // Need this to check balance
import CrowdsaleABI from '../EITCrowdsale.json'; // Need this to check price
import { getReferralHoldingValue } from '../utils/referralEligibility';

const API_URL = "http://localhost:3001/api";

const ReferralWidget = ({ account, onClose }: { account: string; onClose?: () => void }) => {
    const [copied, setCopied] = useState(false);
    const [rewardPercent, setRewardPercent] = useState(5);
    const [isActive, setIsActive] = useState(false);

    // NEW: Eligibility State
    const [isEligible, setIsEligible] = useState(false);
    const [currentValueUSD, setCurrentValueUSD] = useState(0);
    const [loading, setLoading] = useState(true);

    // Configuration
    const MIN_HOLDING_USD = 100;

    // --- 1. FETCH DATA (Settings + Eligibility) ---
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                // A. Get Admin Settings
                const res = await fetch(`${API_URL}/ico-status`);
                const data = await res.json();
                if (data.referralPercent) setRewardPercent(data.referralPercent);
                if (data.referralActive === true) setIsActive(true);
                else {
                    setIsActive(false);
                    return; // Stop if system is disabled
                }

                if (!account || !window.ethereum) {
                    setIsEligible(false);
                    setCurrentValueUSD(0);
                    return;
                }

                // B. Check User Eligibility (On-Chain)
                const provider = new ethers.BrowserProvider(window.ethereum);
                const { valueUsd: valUSD } = await getReferralHoldingValue(
                    account,
                    provider,
                    addresses,
                    TokenABI,
                    CrowdsaleABI
                );
                setCurrentValueUSD(valUSD);

                if (valUSD >= MIN_HOLDING_USD) {
                    setIsEligible(true);
                } else {
                    setIsEligible(false);
                }

            } catch (e) {
                console.error("Referral Check Error", e);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [account]);

    if (!isActive) return null;

    const link = account ? `${window.location.origin}?ref=${account}` : "";

    const copyLink = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    if (!account) {
        return (
            <div className="w-full max-w-md mx-auto mt-6 bg-gray-900/70 border border-blue-500/20 rounded-xl p-6 text-center shadow-xl">
                <div className="flex justify-center mb-3">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 border border-blue-500/20">
                        <Share2 size={24} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Refer & Earn</h3>
                <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
                    Connect your wallet to unlock your referral link. You earn <span className="text-blue-400 font-bold">{rewardPercent}%</span>, and your friend gets <span className="text-green-400 font-bold">{rewardPercent}%</span> bonus tokens.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs">
                    <Share2 size={12} />
                    <span>Referral program is active</span>
                </div>
            </div>
        );
    }

    // --- RENDER LOCKED STATE ---
    if (loading) return <div className="text-center text-gray-500 text-xs mt-4">Checking eligibility...</div>;

    if (!isEligible) {
        return (
            <div className="w-full max-w-md mx-auto mt-8 bg-gray-900/50 border border-gray-700 rounded-xl p-6 text-center opacity-75">
                <div className="flex justify-center mb-3">
                    <div className="p-3 bg-gray-800 rounded-full text-gray-500 border border-gray-700">
                        <Lock size={24} />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-1">Referral Program Locked</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                    You must hold at least <span className="text-white font-bold">${MIN_HOLDING_USD}</span> worth of EIT to participate in the referral program.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs">
                    <AlertCircle size={12} />
                    <span>Your Balance: ${currentValueUSD.toFixed(2)}</span>
                </div>
            </div>
        );
    }

    // --- RENDER UNLOCKED STATE ---
    return (
        <div className="w-full max-w-md mx-auto mt-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden group animate-fade-in-up">

            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
                >
                    <X size={20} />
                </button>
            )}

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Share2 size={80} />
            </div>

            <div className="flex flex-col items-center text-center relative z-10">
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 mb-3 border border-blue-500/20">
                    <Share2 size={24} />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Refer & Earn</h3>

                <p className="text-xs text-gray-400 mb-4 max-w-xs">
                    Share your unique link. You get <span className="text-blue-400 font-bold">{rewardPercent}% Commission</span>, and your friend gets <span className="text-green-400 font-bold">{rewardPercent}% Bonus Tokens</span>!
                </p>

                {/* Link Box */}
                <div className="flex items-center gap-2 w-full bg-black/40 p-1.5 rounded-lg border border-gray-700/50">
                    <code className="text-[10px] text-gray-300 truncate flex-1 px-2 font-mono select-all">
                        {link}
                    </code>
                    <button
                        onClick={copyLink}
                        className={`p-2 rounded-md transition-all duration-200 ${copied ? "bg-green-500/20 text-green-400" : "bg-gray-700 hover:bg-gray-600 text-white"
                            }`}
                        title="Copy Link"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralWidget;

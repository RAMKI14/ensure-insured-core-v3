import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Download, 
    ExternalLink, 
    Search, 
    ArrowUpDown,
    CheckCircle2,
    Clock,
    ShieldAlert,
    Copy,
    Check
} from 'lucide-react';

const API_URL = "http://localhost:3001/api";

interface TransactionHistoryProps {
    address: string;
}

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-gray-500 hover:text-blue-400 active:scale-90"
            title="Copy Hash"
        >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
    );
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ address }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await fetch(`${API_URL}/investor/transactions/${address}`);
                const data = await res.json();
                setTransactions(data);
            } catch (e) {
                console.error("Error fetching transactions", e);
            } finally {
                setLoading(false);
            }
        };

        if (address) fetchTransactions();
    }, [address]);

    const filteredTransactions = transactions.filter(tx => 
        tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToCSV = () => {
        if (transactions.length === 0) return;
        
        const headers = ["Date", "Type", "Amount (EIT)", "USD Value", "Currency", "Tx Hash"];
        const rows = transactions.map(tx => [
            new Date(tx.date).toLocaleDateString(),
            tx.type,
            tx.amount,
            tx.amountUSD || "",
            tx.crypto || "USDT",
            tx.txHash
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `eit_investments_${address.slice(0, 8)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Investment History</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Total {transactions.length} Transactions</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Hash / Type..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-5 py-2.5 text-xs font-black text-white transition-all active:scale-95"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Tx Hash</th>
                                <th className="px-4 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                        Date <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="px-4 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
                                <th className="px-4 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                                <th className="px-4 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Value</th>
                                <th className="px-4 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredTransactions.map((tx, idx) => (
                                <motion.tr 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={tx.id} 
                                    className="hover:bg-white/[0.01] transition-colors group"
                                >
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-gray-500 font-mono font-black tracking-tighter">
                                                {tx.txHash?.slice(0, 5)}...{tx.txHash?.slice(-4)}
                                            </p>
                                            <CopyButton text={tx.txHash} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 whitespace-nowrap">
                                        <p className="text-xs text-white font-bold">{new Date(tx.date).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${tx.type.includes('Public') ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                {tx.type.includes('Public') ? <Clock size={12} /> : <ShieldAlert size={12} />}
                                            </div>
                                            <span className="text-[10px] font-black text-white/80 uppercase tracking-wide">{tx.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <p className="text-xs font-black text-white">{Number(tx.amount).toLocaleString()} EIT</p>
                                    </td>
                                    <td className="px-4 py-5">
                                        <p className="text-xs font-bold text-gray-400">${Number(tx.amountUSD || 0).toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-600 font-medium">via {tx.crypto || 'USDT'}</p>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[10px] font-black uppercase tracking-tighter">
                                            <CheckCircle2 size={10} />
                                            Success
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                        <a 
                                            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold text-[10px] uppercase tracking-widest transition-colors group"
                                        >
                                            View 
                                            <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                        </a>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionHistory;

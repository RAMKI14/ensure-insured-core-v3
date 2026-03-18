import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Megaphone } from 'lucide-react';

const Announcements: React.FC = () => {
    return (
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Platform Updates</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Official announcements</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-400">
                    <Bell size={20} />
                </div>
            </div>

            <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Megaphone size={28} className="text-blue-400" />
                    </div>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No Announcements Yet</h4>
                <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">
                    Official platform announcements and updates will appear here. Stay tuned for the latest news.
                </p>
            </div>
        </div>
    );
};

export default Announcements;

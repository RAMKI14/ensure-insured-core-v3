import React, { useState, useEffect } from 'react';
import { Hourglass, Lock } from 'lucide-react';

const UKCoolingOff = ({ firstSeenTime }) => {
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    if (!firstSeenTime) return;

    console.log("🇬🇧 UK Timer Initialized with start time:", firstSeenTime);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      // Ensure firstSeenTime is treated as a date string
      const startTime = new Date(firstSeenTime).getTime();
      
      // 24 Hours in Milliseconds = 86,400,000
      const unlockTime = startTime + 86400000; 
      
      const distance = unlockTime - now;

      // Debug log (Check your console if this prints)
      // console.log("Time remaining:", distance);

      if (distance < 0) {
        console.log("🇬🇧 Timer Expired. Unlocking.");
        setIsLocked(false);
        clearInterval(interval);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [firstSeenTime]);

  if (!isLocked) return null;

  return (
    // Z-INDEX UPDATE: z-[100] forces it above everything else in the card
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-md p-6 text-center rounded-xl border-2 border-yellow-600/50 shadow-2xl">
      
      <div className="bg-yellow-500/20 p-4 rounded-full mb-4 animate-pulse border border-yellow-500/30">
        <Hourglass size={40} className="text-yellow-500" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2 tracking-wide">FCA Cooling-Off Period</h2>
      
      <p className="text-gray-400 text-xs mb-6 max-w-[280px] leading-relaxed">
        As a new UK visitor, regulations require a 24-hour waiting period before you can transact.
      </p>

      <div className="bg-black/60 border border-gray-700 rounded-lg px-6 py-3 mb-2 w-full">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Unlocks In</p>
        <p className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
            {timeLeft}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
        <Lock size={12} />
        <span>Purchase Disabled</span>
      </div>
    </div>
  );
};

export default UKCoolingOff;
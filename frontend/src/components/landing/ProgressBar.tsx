import React from 'react';

const ProgressBar = ({ raised, target, stage }) => {
  // 1. Sanitize Inputs (Convert to Number, Default to 0 if invalid/NaN)
  const safeRaised = Number.isFinite(Number(raised)) ? Number(raised) : 0;
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : 1; // Avoid divide by zero

  // 2. Calculate Percentage safely
  let rawPercent = (safeRaised / safeTarget) * 100;
  
  // 3. Cap between 0% and 100%
  if (isNaN(rawPercent)) rawPercent = 0;
  const percentage = Math.min(Math.max(rawPercent, 0), 100).toFixed(1);

  // Hardcoded Hard Cap for display context
  const HARD_CAP = 100000000;

  return (
    <div className="w-full max-w-md mx-auto mb-6 relative z-10"> 
      
      {/* Labels */}
      <div className="flex justify-between items-baseline text-xs font-bold uppercase tracking-wider mb-2 font-mono">
        <span className="text-blue-400 whitespace-nowrap">{stage}</span>
        <span className="text-gray-400 whitespace-nowrap ml-4">
             {/* Display $0 if data isn't ready yet */}
             ${safeRaised.toLocaleString(undefined, {maximumFractionDigits: 0})} / <span className="text-white">${safeTarget.toLocaleString()}</span>
        </span>
      </div>

      {/* Bar Container */}
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative shadow-inner">
        
        {/* Fill Bar (Animated) */}
        <div 
            className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full relative transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
        >
            {/* Shimmer Effect (Only show if percentage > 0) */}
            {safeRaised > 0 && (
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
            )}
        </div>

      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center mt-1">
        {/* NEW: Hard Cap Indicator */}
        <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
            Hard Cap: ${HARD_CAP.toLocaleString()}
        </span>

        {/* Percentage */}
        <span className="text-[10px] font-mono text-green-400 font-bold">{percentage}% Filled</span>
      </div>


    </div>
  );
};

export default ProgressBar;
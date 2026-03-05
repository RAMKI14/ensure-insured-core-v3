import React from 'react';

const SectionSeparator = () => {
  return (
    <div className="w-full flex justify-center items-center relative z-10 my-0">
      {/* 
         1. w-full: Spans width 
         2. h-px: 1 pixel height
         3. my-0: No vertical margin (lets the sections controls spacing)
      */}
      
      {/* The Glowing Line */}
      <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
    </div>
  );
};

export default SectionSeparator;
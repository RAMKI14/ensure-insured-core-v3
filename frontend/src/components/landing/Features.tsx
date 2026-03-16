import React from 'react';

// --- UPDATED IMPORTS (.jpeg) ---
import feature1 from '../../assets/feature-1.png';
import feature2 from '../../assets/feature-2.jpeg';
import feature3 from '../../assets/feature-3.png';

const Features = () => {
  const features = [
    {
      id: 1,
      title: "Immutable Policy Registry",
      desc: "Every insurance policy is minted on the blockchain, creating a tamper-proof record. Eliminates fake policies and ensures 100% data integrity for insurers and owners.",
      image: feature1,
      color: "blue"
    },
    {
      id: 2,
      title: "Smart Vehicle Disks",
      desc: "Proprietary NFC & QR-enabled disks allow traffic enforcement to verify insurance status in milliseconds without manual checks, reducing congestion and bribes.",
      image: feature2,
      color: "purple"
    },
    {
      id: 3,
      title: "Automated Compliance",
      desc: "Smart contracts automatically detect coverage lapses and trigger penalties or renewals. A seamless link between Insurers, RTOs, and Police.",
      image: feature3,
      color: "orange"
    }
  ];

  return (
    <section id="features" className="py-24 bg-black relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-block px-3 py-1 mb-4 border border-blue-500/30 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
            Core Technology
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            The Infrastructure of <br />
            <span className="text-white">Trustless </span>
            <span className="text-[#A855F7]">Enforcement</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We replace manual verification with cryptographic certainty.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group relative bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 flex flex-col">

              {/* IMAGE AREA */}
              <div className="w-full h-56 overflow-hidden border-b border-gray-700/50 relative">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80`}></div>
              </div>

              {/* Text Content */}
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </div>

              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-tr from-${f.color}-500/0 to-${f.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}></div>
            </div>
          ))}
        </div>

      </div>


    </section>
  );
};

export default Features;
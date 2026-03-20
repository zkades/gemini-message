
import React from 'react';

interface Props {
  onBack: () => void;
}

const DevicePairingView: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="absolute inset-0 bg-[#0b141b] z-[60] flex flex-col animate-fade-in text-white overflow-hidden">
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between px-2 pt-10 pb-2">
        <button onClick={onBack} className="p-3 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        {/* Top-right "No Pairing" icon from screenshot */}
        <button className="p-3 text-gray-400 active:scale-90 transition-transform">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
             <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
             <path d="M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
             <path d="M10 10 L14 14 M14 10 L10 14" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
        </button>
      </div>

      {/* Large Left-Aligned Title */}
      <div className="px-6 pb-6">
        <h2 className="text-[32px] font-normal leading-tight text-[#e3e3e3]">Device pairing</h2>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 overflow-y-auto no-scrollbar">
        {/* High-fidelity Illustration exactly like the screenshot */}
        <div className="w-full max-w-[340px] aspect-square bg-[#121212] rounded-3xl flex items-center justify-center relative overflow-hidden mb-8 shadow-inner">
           <svg viewBox="0 0 200 200" className="w-full h-full p-4">
             {/* The Arch */}
             <path d="M80 160 V100 Q80 75 105 75 Q130 75 130 100 V160" stroke="#444" strokeWidth="1.5" fill="none" />
             
             {/* Character (Red hat, white top, blue pants) */}
             <g transform="translate(90, 80)">
               {/* Legs/Pants */}
               <path d="M10 40 L0 75 L-10 73 M10 40 L20 75 L30 73" stroke="#8ab4f8" strokeWidth="7" strokeLinecap="round" fill="none" />
               {/* Body/Shirt */}
               <path d="M10 15 Q15 15 20 20 L25 45 Q10 40 0 45 Z" fill="white" opacity="0.9" />
               {/* Head/Hat */}
               <circle cx="14" cy="10" r="5" fill="#f28b82" /> {/* Red Beanie */}
               <circle cx="14" cy="14" r="4" fill="#fde68a" /> {/* Face */}
               {/* Phone */}
               <rect x="0" y="25" width="4" height="7" rx="1" fill="#333" />
             </g>

             {/* Desk/Monitor Section */}
             <g transform="translate(140, 100)">
                <rect x="0" y="20" width="30" height="20" rx="2" fill="#3c4043" />
                <rect x="3" y="23" width="24" height="10" rx="1" fill="#8ab4f8" opacity="0.8" />
                <rect x="3" y="34" width="15" height="2" rx="0.5" fill="white" opacity="0.5" />
                <line x1="15" y1="40" x2="15" y2="50" stroke="#444" strokeWidth="2" />
                <line x1="10" y1="50" x2="20" y2="50" stroke="#444" strokeWidth="2" />
             </g>

             {/* Dog (Golden/Yellow) */}
             <g transform="translate(150, 145)">
                <path d="M0 15 Q0 5 5 5 L10 5 Q15 5 15 15" fill="#fdd663" />
                <circle cx="15" cy="8" r="4" fill="#fdd663" />
                <circle cx="16" cy="7" r="1" fill="#333" />
             </g>

             {/* Decoration elements */}
             <path d="M90 120 Q80 110 70 125" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
             <path d="M145 75 Q155 65 160 80" fill="#f28b82" opacity="0.6" /> {/* Pink heart-ish shape */}
             <circle cx="105" cy="165" r="4" fill="#81c995" /> {/* Green dot */}
             <line x1="40" y1="160" x2="170" y2="160" stroke="#333" strokeWidth="1" />
           </svg>
        </div>

        {/* Text exactly from screenshot */}
        <p className="text-center text-[15px] leading-relaxed text-[#c4c7c5] px-4 font-normal mb-10">
          Use your phone number to send and receive messages on devices signed into your Google account
        </p>

        {/* Buttons matching Material You style */}
        <div className="w-full space-y-10">
           <button className="w-full bg-[#1e1e1e] text-[#e3e3e3] py-[22px] px-8 rounded-full text-left flex items-center justify-center active:bg-[#2c2c2c] transition-colors border border-gray-800/30">
              <span className="text-[16px] font-medium">How to pair</span>
           </button>
           
           <div className="px-2">
              <h4 className="text-[16px] font-normal text-[#e3e3e3]">Paired devices (0)</h4>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DevicePairingView;

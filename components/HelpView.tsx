
import React from 'react';

interface Props {
  onBack: () => void;
}

const HelpView: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="absolute inset-0 bg-[#0b141b] z-[60] flex flex-col animate-fade-in text-white overflow-hidden">
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between px-2 pt-10 pb-2 bg-[#0b141b]">
        <div className="flex items-center">
          <button onClick={onBack} className="p-3 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-[20px] font-normal ml-3">Help</h2>
        </div>
        <button className="p-3 text-white active:scale-90">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Information Banner exactly as in screenshot */}
        <div className="px-6 py-4 mt-2">
           <div className="text-[14px] leading-relaxed text-[#c4c7c5]">
             RCS is now available for texting between Android and iPhones. Learn how to turn on RCS chats on your Android phone (<span className="text-[#7fcfff] underline cursor-pointer">link</span>).
           </div>
           <div className="flex justify-end mt-4">
              <button className="text-[#7fcfff] text-[14px] font-medium px-4 py-2 hover:bg-[#1f2933] rounded-md transition-colors">
                Dismiss
              </button>
           </div>
        </div>

        {/* Popular Resources List */}
        <div className="mt-4">
           <h3 className="px-6 py-4 text-[15px] font-medium text-[#c4c7c5]">Popular help resources</h3>
           
           <div className="flex flex-col">
             <HelpRow label="RCS chats with businesses" />
             <HelpRow label="Google Account & profile sharing in Google Messages" />
             <HelpRow label="Australian Online Safety Act and how to report online harm" />
             <HelpRow label="How end-to-end encryption in Google Messages provides more ..." />
             <HelpRow label="Check your messages on your computer or Android tablet" />
           </div>
        </div>

        {/* Search Bar matching screenshot styling */}
        <div className="px-6 mt-8">
           <div className="flex items-center bg-[#1f2933]/50 rounded-full px-5 py-4 border border-gray-800/40">
              <svg className="w-5 h-5 text-gray-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-[16px] text-gray-400 font-normal">Search help</span>
           </div>
        </div>

        <div className="h-[1px] bg-gray-800/50 mt-10"></div>

        {/* Send Feedback Footer Row */}
        <div className="px-6 py-6 flex items-center hover:bg-[#1f2933]/50 cursor-pointer transition-colors active:bg-[#1f2933]">
           <div className="w-10 h-10 bg-[#1f2933] rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-[#c4c7c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
           </div>
           <span className="text-[16px] font-normal text-[#e3e3e3]">Send Feedback</span>
        </div>
      </div>
    </div>
  );
};

const HelpRow = ({ label }: { label: string }) => (
  <div className="px-6 py-4 flex items-start hover:bg-[#1f2933]/50 cursor-pointer group transition-colors active:bg-[#1f2933]">
     <div className="w-6 h-6 mr-5 mt-0.5 text-gray-400 flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
           <rect x="4" y="4" width="16" height="16" rx="2" />
           <line x1="8" y1="8" x2="16" y2="8" />
           <line x1="8" y1="12" x2="16" y2="12" />
           <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
     </div>
     <span className="text-[15px] font-normal text-[#e3e3e3] leading-snug pr-4">{label}</span>
  </div>
);

export default HelpView;

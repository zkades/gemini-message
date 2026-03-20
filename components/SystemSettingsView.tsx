
import React from 'react';

interface Props {
  onBack: () => void;
  onSetDefault: (val: boolean) => void;
  isDefault: boolean;
}

const SystemSettingsView: React.FC<Props> = ({ onBack, onSetDefault, isDefault }) => {
  return (
    <div className="absolute inset-0 bg-[#121314] z-[110] flex flex-col animate-fade-in text-white overflow-hidden font-sans">
      {/* Settings Header */}
      <div className="flex items-center px-4 pt-10 pb-4">
        <button onClick={onBack} className="p-3 hover:bg-white/10 rounded-full text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-[20px] font-normal ml-3">Default SMS app</h2>
      </div>

      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <p className="text-[14px] text-gray-400 mb-8 leading-relaxed">
          The following apps are installed on your device and can be used as your default messaging app.
        </p>

        <div className="space-y-6">
          {/* Messages App Option */}
          <div 
            onClick={() => onSetDefault(true)}
            className="flex items-center justify-between group cursor-pointer active:opacity-70"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#1a73e8] rounded-full flex items-center justify-center mr-5 shadow-md">
                <img 
                   src="/icons/icon-96.png" 
                   alt="Messages" 
                   className="w-7 h-7"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-medium text-white">Messages</span>
                <span className="text-[14px] text-gray-400">Current app</span>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isDefault ? 'border-[#a8c7fa] bg-[#a8c7fa]' : 'border-gray-500'}`}>
              {isDefault && <div className="w-3 h-3 rounded-full bg-[#062e6f]"></div>}
            </div>
          </div>

          {/* System SMS Option */}
          <div 
            onClick={() => onSetDefault(false)}
            className="flex items-center justify-between group cursor-pointer active:opacity-70"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-5 shadow-sm">
                 <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                 </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-medium text-white">System SMS</span>
                <span className="text-[14px] text-gray-400">Basic messaging</span>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${!isDefault ? 'border-[#a8c7fa] bg-[#a8c7fa]' : 'border-gray-500'}`}>
              {!isDefault && <div className="w-3 h-3 rounded-full bg-[#062e6f]"></div>}
            </div>
          </div>

          {/* Mock App 1 */}
          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-5">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-medium text-white">Translate Messenger</span>
                <span className="text-[14px] text-gray-400">Not available</span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-700"></div>
          </div>

          {/* Mock App 2 */}
          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-5">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-medium text-white">Secure Chat</span>
                <span className="text-[14px] text-gray-400">Not available</span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-gray-700"></div>
          </div>
        </div>

        {/* Note at bottom */}
        <div className="mt-12 p-5 bg-[#1f2933]/50 rounded-[20px] border border-white/5">
           <h4 className="text-[14px] font-medium text-[#a8c7fa] mb-2">Note</h4>
           <p className="text-[13px] text-gray-400 leading-relaxed">
             Only one app can be your default SMS app at a time. Switching will allow the new app to handle all incoming and outgoing messages.
           </p>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsView;

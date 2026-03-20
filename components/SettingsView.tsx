
import React, { useState } from 'react';
import { checkContactPermission, requestContactPermission, getSmsDebugInfo } from '../services/deviceService';
import { registerPlugin } from '@capacitor/core';

const AppSettings = registerPlugin('AppSettings');

interface Props {
  onBack: () => void;
  onSetDefault: (val: boolean) => void;
  isDefault: boolean;
  setView: (v: any) => void;
}

const SettingsView: React.FC<Props> = ({ onBack, onSetDefault, isDefault, setView }) => {
  const [switches, setSwitches] = useState({
    sounds: true,
    zoom: true,
    animations: true,
    sync: true
  });

  const toggleSwitch = (key: keyof typeof switches) => {
    setSwitches(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [showRationale, setShowRationale] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const openAppSettings = async () => {
    try {
      if (AppSettings && typeof AppSettings.open === 'function') {
        await AppSettings.open();
        return;
      }
    } catch (err) {
      // fall through to showing instructions in modal
    }
  };

  const handleSyncToggle = async () => {
    // If currently off, attempt to request permission when turning on
    const currently = switches.sync;
    if (!currently) {
      const granted = await requestContactPermission();
      if (!granted) {
        setShowRationale(true);
        return;
      }
    }
    toggleSwitch('sync');
  };

  const showDebug = async () => {
    try {
      const info = await getSmsDebugInfo();
      setDebugInfo(JSON.stringify(info, null, 2));
      setShowRationale(true);
    } catch (err) {
      setDebugInfo(String(err));
      setShowRationale(true);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0b141b] z-[60] flex flex-col animate-fade-in text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-10 pb-4 sticky top-0 bg-[#0b141b] z-10">
        <button onClick={onBack} className="p-3 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-[22px] font-normal ml-3">Messages settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col">
          <SettingsRow label="RCS chats" />
          <SettingsRow 
            label="Default SMS app" 
            subtitle={isDefault ? "Messages" : "System SMS"} 
            onClick={() => setView('systemSettings')}
          />
          <SettingsRow label="Notifications" />
          <SettingsRow label="Bubbles" />
          
          <div className="h-[1px] bg-gray-800/50 mx-4"></div>

          <SettingsToggle 
            label="Sync device contacts" 
            active={switches.sync} 
            onToggle={handleSyncToggle} 
          />
          <SettingsToggle 
            label="Hear message sounds" 
            active={switches.sounds} 
            onToggle={() => toggleSwitch('sounds')} 
          />
          <SettingsToggle 
            label="Pinch to zoom text" 
            active={switches.zoom} 
            onToggle={() => toggleSwitch('zoom')} 
          />

          <div className="h-[1px] bg-gray-800/50 mx-4"></div>

          <SettingsRow label="Choose theme" subtitle="System default" />
          <SettingsRow label="Your current country" subtitle="Automatically detected" />
          <SettingsRow label="Gemini in Messages" />
          <SettingsRow label="Suggestions" subtitle="Smart Reply, suggested actions & more" />
          <SettingsRow label="Protection & Safety" />
          <SettingsRow label="Advanced" />
          <SettingsRow label="About, terms & privacy" />
        </div>
        <div className="h-20"></div>
      </div>
    {showRationale && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#0b141b] text-white p-6 rounded-xl max-w-md w-full">
          <h3 className="text-lg font-medium mb-2">Contacts permission required</h3>
          <p className="text-sm text-gray-300 mb-4">This app needs access to your contacts to sync device contacts. Please enable Contacts permission in System Settings for this app.</p>
          {debugInfo ? (
            <pre className="text-xs bg-black/30 p-3 rounded mb-3 overflow-auto max-h-40">{debugInfo}</pre>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => { setShowRationale(false); setDebugInfo(null); }} className="px-3 py-2 rounded bg-gray-700">Close</button>
            <button onClick={openAppSettings} className="px-3 py-2 rounded bg-blue-600">Open system settings</button>
            <button onClick={showDebug} className="px-3 py-2 rounded bg-gray-800">Show debug info</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

const SettingsRow = ({ label, subtitle, onClick }: { label: string, subtitle?: string, onClick?: () => void }) => (
  <div onClick={onClick} className="px-6 py-[18px] hover:bg-[#1f2933]/50 active:bg-[#1f2933] cursor-pointer transition-colors group">
    <div className="text-[16px] font-normal text-[#e3e3e3] group-active:text-white">{label}</div>
    {subtitle && (
      <div className="text-[14px] text-gray-400 mt-0.5 whitespace-pre-line leading-relaxed">{subtitle}</div>
    )}
  </div>
);

const SettingsToggle = ({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) => (
  <div onClick={onToggle} className="px-6 py-5 flex items-center justify-between hover:bg-[#1f2933]/50 active:bg-[#1f2933] cursor-pointer transition-colors">
    <div className="text-[16px] font-normal text-[#e3e3e3] pr-4 flex-1">{label}</div>
    <div className={`relative w-[52px] h-[32px] rounded-full transition-colors duration-200 ease-in-out ${active ? 'bg-[#7fcfff]' : 'bg-[#3c4043]'}`}>
       <div className={`absolute top-[4px] left-[4px] w-[24px] h-[24px] rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${active ? 'translate-x-[20px]' : 'translate-x-0'}`}>
         {active && (
           <svg className="w-full h-full p-1 text-[#003355]" viewBox="0 0 24 24" fill="currentColor">
             <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
           </svg>
         )}
       </div>
    </div>
  </div>
);

export default SettingsView;

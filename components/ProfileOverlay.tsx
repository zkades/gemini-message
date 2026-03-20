
import React, { useState } from 'react';
import { UserAccount } from '../types';

const GOOGLE_PALETTE = [
  '#4285F4', // Google Blue
  '#DB4437', // Google Red
  '#F4B400', // Google Yellow
  '#0F9D58', // Google Green
  '#AB47BC',
  '#00ACC1',
  '#FF7043',
  '#9E9D24',
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickPaletteColor = (key: string) => {
  const safeKey = key || 'unknown';
  const idx = hashString(safeKey) % GOOGLE_PALETTE.length;
  return GOOGLE_PALETTE[idx];
};

const getUserDisplayName = (email: string) => {
  return email ? email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : 'USER';
};

interface Props {
  activeAccount: UserAccount;
  onLogout: () => void;
  onClose: () => void;
  onNavigateToDetail: () => void;
  onNavigateToArchived: () => void;
  onNavigateToSpam: () => void;
  onNavigateToDevicePairing: () => void;
  onNavigateToSettings: () => void;
  onNavigateToHelp: () => void;
  onMarkAllAsRead: () => void;
}

const ProfileOverlay: React.FC<Props> = ({ 
  activeAccount,
  onLogout,
  onClose, 
  onNavigateToDetail, 
  onNavigateToArchived, 
  onNavigateToSpam, 
  onNavigateToDevicePairing,
  onNavigateToSettings,
  onNavigateToHelp,
  onMarkAllAsRead 
}) => {
  const [isSwitchExpanded, setIsSwitchExpanded] = useState(false);
  
  // Debug: Check all localStorage values
  console.log('ProfileOverlay - All localStorage keys:', Object.keys(localStorage));
  console.log('ProfileOverlay - localStorage auth data:', localStorage.getItem('gemini_messages_mock_auth'));
  console.log('ProfileOverlay - localStorage email backup:', localStorage.getItem('user_email_backup'));
  console.log('ProfileOverlay - activeAccount.email:', activeAccount.email);
  
  // Get email from multiple sources
  let userEmail: string | null = activeAccount.email;
  
  // Try backup first
  if (!userEmail) {
    userEmail = localStorage.getItem('user_email_backup');
    console.log('ProfileOverlay - Using backup email:', userEmail);
  }
  
  // Try main auth storage
  if (!userEmail) {
    const storedAuth = localStorage.getItem('gemini_messages_mock_auth');
    console.log('ProfileOverlay - No backup, checking main auth:', storedAuth);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        userEmail = authData.email;
        console.log('ProfileOverlay - Extracted email from main auth:', userEmail);
      } catch (e) {
        console.error('Error parsing stored auth:', e);
      }
    }
  }
  
  const emailTag = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : '';
  const userColor = activeAccount.color || pickPaletteColor(userEmail || '');
  
  console.log('ProfileOverlay - Final userEmail:', userEmail, 'emailTag:', emailTag);

  return (
    <div className="absolute inset-0 bg-[#0b141b] z-50 flex flex-col animate-fade-in overflow-y-auto no-scrollbar pb-10 font-sans">
      {/* Top Header - centered email and X */}
      <div className="flex items-center justify-between px-6 pt-10 pb-4 relative">
        <div className="flex-1 text-center">
          <span className="text-[14px] text-gray-300 font-normal">
            {userEmail}
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform absolute right-4 top-10">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Identity Section */}
      <div className="flex flex-col items-center mt-2 px-6">
        <div className="relative">
          <div 
            className="w-[96px] h-[96px] rounded-full overflow-hidden border border-gray-700 shadow-lg flex items-center justify-center"
            style={{ backgroundColor: userColor }}
          >
            <img 
              src="/2.png" 
              alt="Profile" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#1f2933] p-1.5 rounded-full border border-gray-800 shadow-md">
             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <img 
            src="/2.png" 
            alt="Account" 
            className="w-6 h-6 object-contain"
          />
          <div>
            <h2 className="text-[24px] text-white mt-4 font-normal tracking-wide">
              Hi, {emailTag}
            </h2>
            <p className="text-[14px] text-gray-300 mt-1">
              {userEmail}
            </p>
          </div>
        </div>
        <button 
          onClick={onNavigateToDetail}
          className="mt-5 px-8 py-2 border border-gray-600 rounded-full text-[14px] font-medium text-white hover:bg-[#1f2933] active:bg-gray-800 transition-colors"
        >
          Manage your Google Account
        </button>
      </div>

      {/* Switch Account Section Block */}
      <div className="mt-8 mx-4">
        <div className="bg-[#171c22] rounded-[28px] overflow-hidden border border-gray-800/30">
          <div 
            onClick={() => setIsSwitchExpanded(!isSwitchExpanded)}
            className="px-6 py-5 flex items-center justify-between cursor-pointer active:bg-white/5 transition-colors"
          >
             <span className="text-[14px] font-medium text-white">Account options</span>
             <svg 
               className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isSwitchExpanded ? 'rotate-180' : ''}`} 
               fill="none" stroke="currentColor" viewBox="0 0 24 24"
             >
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
             </svg>
          </div>

          {isSwitchExpanded && (
            <div className="pb-4 animate-fade-in">
              <div className="h-[0.5px] bg-gray-800/50 mx-4 mb-2"></div>
              
              {/* Logout */}
              <div onClick={onLogout} className="flex items-center px-6 py-4 hover:bg-white/5 cursor-pointer">
                 <div className="w-6 h-6 mr-5 text-red-400">
                   <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </div>
                 <span className="text-[15px] font-normal text-red-400">Sign out of Messages</span>
              </div>

              <div className="h-[0.5px] bg-gray-800/50 mx-4 my-2"></div>

              {/* Manage accounts */}
              <div className="flex items-center px-6 py-4 hover:bg-white/5 cursor-pointer">
                 <span className="text-[15px] font-normal text-[#e3e3e3]">{userEmail}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* More from this app block */}
      <div className="mt-8 mx-4">
        <div className="text-[14px] text-gray-400 font-medium px-4 py-3">More from this app</div>
        <div className="bg-[#171c22] rounded-[28px] overflow-hidden border border-gray-800/30">
          <MenuRow icon={<UserIcon />} label="Your profile" onClick={onNavigateToDetail} showLine={true} />
          <MenuRow icon={<ArchiveIcon />} label="Archived" onClick={onNavigateToArchived} showLine={true} />
          <MenuRow icon={<SpamIcon />} label="Spam & blocked" onClick={onNavigateToSpam} showLine={true} />
          <MenuRow icon={<ReadAllIcon />} label="Mark all as read" onClick={onMarkAllAsRead} showLine={true} />
          <MenuRow icon={<DevicePairIcon />} label="Device pairing" onClick={onNavigateToDevicePairing} showLine={true} />
          <MenuRow icon={<SettingsIcon />} label="Messages settings" onClick={onNavigateToSettings} showLine={true} />
          <MenuRow icon={<HelpIcon />} label="Help & feedback" onClick={onNavigateToHelp} showLine={false} />
        </div>
      </div>
    </div>
  );
};

const MenuRow = ({ icon, label, onClick, showLine }: { icon: React.ReactNode, label: string, onClick?: () => void, showLine?: boolean }) => (
  <div className="group">
    <div 
      onClick={onClick} 
      className="flex items-center px-6 py-[18px] hover:bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
    >
      <div className="w-6 h-6 mr-5 text-gray-300 flex items-center justify-center flex-shrink-0">{icon}</div>
      <span className="text-[16px] font-normal text-white">{label}</span>
    </div>
    {showLine && (
      <div className="h-[0.5px] bg-gray-800 mx-6 opacity-30"></div>
    )}
  </div>
);

const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ArchiveIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h4a2 2 0 002-2V7M7 7h10M10 4h4" /></svg>;
const SpamIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="1.5"/><path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round"/></svg>;
const ReadAllIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7M5 7l4 4 4-4" /></svg>;
const DevicePairIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v2a2 2 0 002 2h2a2 2 0 002-2v-2M4 9h16M4 5h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HelpIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default ProfileOverlay;

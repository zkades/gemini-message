
import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../types';

const GOOGLE_PALETTE = [
  '#303030', // Google Blue
  '#303030', // Google Red
  '#303030', // Google Yellow
  '#303030', // Google Green
  '#303030',
  '#303030',
  '#303030',
  '#303030',
];

// Google palette for header profile picture (original Google colors)
const GOOGLE_PALETTE_HEADER = [
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

const pickHeaderPaletteColor = (key: string) => {
  const safeKey = key || 'unknown';
  const idx = hashString(safeKey) % GOOGLE_PALETTE_HEADER.length;
  return GOOGLE_PALETTE_HEADER[idx];
};

const getUserDisplayName = (email: string) => {
  return email ? email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : 'USER';
};

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onOpenProfile: () => void;
  onStartNewChat: () => void;
  onOpenContacts: () => void;
  isDefaultApp: boolean;
  accountEmail: string;
  accountName: string;
  onSetDefault: () => void;
  onDelete: (ids: string[]) => void;
  onPin: (ids: string[]) => void;
  onArchive: (ids: string[]) => void;
  isSyncing: boolean;
  cbePhoneNumber: string;
  isCbeNumber: (phone?: string) => boolean;
}

const ConversationList: React.FC<Props> = ({ 
  conversations, 
  onSelect, 
  onOpenProfile, 
  onStartNewChat,
  onOpenContacts,
  isDefaultApp,
  accountEmail,
  accountName,
  onSetDefault,
  onDelete,
  onPin,
  onArchive,
  isSyncing,
  cbePhoneNumber,
  isCbeNumber
}) => {
  console.log('ConversationList - accountEmail:', accountEmail);
  
  // Get email from multiple sources like ProfileOverlay does
  let userEmail = accountEmail;
  
  // Try backup first
  if (!userEmail) {
    const backupEmail = localStorage.getItem('user_email_backup');
    if (backupEmail) {
      userEmail = backupEmail;
      console.log('ConversationList - Using backup email:', userEmail);
    }
  }
  
  // Try main auth storage
  if (!userEmail) {
    const storedAuth = localStorage.getItem('gemini_messages_mock_auth');
    console.log('ConversationList - No backup, checking main auth:', storedAuth);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        userEmail = authData.email;
        console.log('ConversationList - Extracted email from main auth:', userEmail);
      } catch (e) {
        console.error('Error parsing stored auth:', e);
      }
    }
  }
  
  console.log('ConversationList - Final userEmail:', userEmail);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pressTimer = useRef<number | null>(null);

  const isSelectionMode = selectedIds.length > 0;
  
  // Get email and extract first 5 letters
  const emailTag = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : '';
  const userColor = pickPaletteColor(userEmail || '');

  // Sorting: Pinned first, then by time - Memoized for performance
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
    });
  }, [conversations]);

  const filtered = React.useMemo(() => {
    return sortedConversations.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedConversations, searchQuery]);

  const handlePointerDown = (id: string) => {
    if (isSelectionMode) return;
    // User asked for at least 5 seconds
    pressTimer.current = window.setTimeout(() => {
      setSelectedIds([id]);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 5000); 
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleItemClick = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
    } else {
      onSelect(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1419] text-white overflow-hidden relative">
      {/* Dynamic Header - Search or Selection Action Bar */}
      <div className="px-2 pt-10 pb-4 h-[100px] flex items-end">
        {isSelectionMode ? (
          /* ACTION BAR MATCHING SCREENSHOT */
          <div className="flex-1 flex items-center justify-between px-3 animate-fade-in">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setSelectedIds([])} 
                className="p-2 hover:bg-white/10 rounded-full active:scale-90 transition-transform"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className="text-[20px] font-normal text-white">{selectedIds.length}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Pin Icon */}
              <button 
                onClick={() => { onPin(selectedIds); setSelectedIds([]); }}
                className="p-3 hover:bg-white/10 rounded-full active:scale-90 transition-transform"
              >
                <svg className="w-6 h-6 text-[#e3e3e3]" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M16 9V4l1 1V2H7v3l1-1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z" />
                </svg>
              </button>
              {/* Snooze/Alert Icon */}
              <button className="p-3 hover:bg-white/10 rounded-full active:scale-90 transition-transform">
                <svg className="w-6 h-6 text-[#e3e3e3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle cx="12" cy="13" r="8" />
                   <path d="M12 9v4l3 3" />
                   <path d="M5 3L2 6M19 3l3 3" strokeWidth="2.5" />
                   <text x="10" y="15" fontSize="6" fill="currentColor" fontWeight="bold" style={{fontFamily: 'sans-serif'}}>Z</text>
                </svg>
              </button>
              {/* Archive Icon */}
              <button 
                onClick={() => { onArchive(selectedIds); setSelectedIds([]); }}
                className="p-3 hover:bg-white/10 rounded-full active:scale-90 transition-transform"
              >
                <svg className="w-6 h-6 text-[#e3e3e3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <rect x="3" y="4" width="18" height="15" rx="2" />
                   <path d="M8 9l4 4 4-4" />
                </svg>
              </button>
              {/* Trash Icon */}
              <button 
                onClick={() => { onDelete(selectedIds); setSelectedIds([]); }}
                className="p-3 hover:bg-white/10 rounded-full active:scale-90 transition-transform"
              >
                <svg className="w-6 h-6 text-[#e3e3e3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                   <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                </svg>
              </button>
              {/* More Icon */}
              <button className="p-3 hover:bg-white/10 rounded-full active:scale-90 transition-transform">
                <svg className="w-6 h-6 text-[#e3e3e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex-1 flex items-center bg-[#1f2933] rounded-full px-4 py-1.5 animate-fade-in mx-3">
            <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="mr-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <input 
              autoFocus
              type="text" 
              placeholder="Search messages"
              className="bg-transparent border-none focus:ring-0 text-[16px] w-full outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between px-3">
            <div className="flex items-center space-x-3">
              <h1 className="text-[22px] font-normal tracking-tight font-sans">Google Messages</h1>
              {isSyncing && (
                <div className="flex items-center bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30">
                  <svg className="animate-spin h-2 w-2 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing
                </div>
              )}
            </div>
            <div className="flex items-center space-x-5">
              <button onClick={() => setIsSearching(true)} className="p-1 hover:bg-gray-800 rounded-full transition-colors">
                <svg className="w-6 h-6 text-[#e3e3e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile();
                }} 
                className="flex flex-col items-center justify-center text-center active:scale-95 transition-transform focus:outline-none"
              >
                <div 
                  className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: pickHeaderPaletteColor(userEmail || '') }}
                >
                  <span className="text-[14px] font-bold text-white">
                    {(() => {
                      console.log('Header profile - userEmail:', userEmail);
                      return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
                    })()}
                  </span>
                </div>
                {accountEmail && (
                  <span className="mt-1 text-[9px] text-gray-400 max-w-[70px] truncate">
                    {emailTag}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!isDefaultApp && !isSelectionMode && (
          <div className="mx-4 mb-4 bg-[#1f2933] rounded-[24px] p-4 flex flex-col items-center animate-fade-in border border-gray-800/50">
             <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-md" style={{ backgroundColor: pickPaletteColor('messages') }}>
                <svg 
                  className="w-6 h-6 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="8" r="3" fill="#9E9E9E"/>
                  <path d="M12 12 C8 12 5 14 5 18 L19 18 C19 14 16 12 12 12 Z" fill="#9E9E9E"/>
                </svg>
             </div>
             <p className="text-[14px] text-center text-white mb-4 px-2">
               Messages is better when it's your default SMS app
             </p>
             <button 
               onClick={onSetDefault}
               className="bg-[#a8c7fa] text-[#062e6f] font-medium px-8 py-2.5 rounded-full text-[14px] active:scale-95 transition-all shadow-md"
             >
               Set as default
             </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 opacity-40">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 00-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p>No messages found</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedIds.includes(conv.id);
            const convColor = pickPaletteColor(conv.id);
            return (
              <div 
                key={conv.id} 
                onPointerDown={() => handlePointerDown(conv.id)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClick={() => handleItemClick(conv.id)}
                className={`flex items-center px-4 py-[14px] transition-all duration-200 cursor-pointer relative ${isSelected ? 'bg-[#1b72e8]/20' : 'hover:bg-[#1f2933]/50 active:bg-[#1f2933]'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`transition-transform duration-200 ${isSelected ? 'scale-75' : 'scale-100'}`}>
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${conv.isAi ? 'border-2 border-blue-500' : 'border border-gray-700'}`}
                      style={{ backgroundColor: convColor }}
                    >
                      <svg 
                        className="w-8 h-8 flex-shrink-0" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="8" r="3" fill="#9E9E9E"/>
                        <path d="M12 12 C8 12 5 14 5 18 L19 18 C19 14 16 12 12 12 Z" fill="#9E9E9E"/>
                      </svg>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#a8c7fa] rounded-full flex items-center justify-center animate-fade-in shadow-lg">
                       <svg className="w-7 h-7 text-[#062e6f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                       </svg>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-[16px] truncate ${conv.unreadCount > 0 || isSelected ? 'font-bold' : 'font-normal'} text-[#fcfcfc]`}>
                      {(isCbeNumber?.(conv.phone || '') || conv.id === 'CBE_NOTIFICATIONS' || conv.name === 'CBE') ? 'CBE' : conv.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                       {conv.isPinned && (
                         <svg className="w-3.5 h-3.5 text-gray-400 transform rotate-45" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M16 9V4l1 1V2H7v3l1-1v5L6 12v2h5v7l1 1 1-1v-7h5v-2l-2-3z" />
                         </svg>
                       )}
                       {conv.unreadCount > 0 && (
                         <div className="absolute top-7 right-2 bg-[#9bb8f8] text-[#202124] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                           {conv.unreadCount > 999 ? '999+' : conv.unreadCount}
                         </div>
                       )}
                       <span className={`absolute top-2 right-2 text-[12px] whitespace-nowrap ${conv.unreadCount > 0 ? 'font-bold text-[#fcfcfc]' : 'text-[#9aa0a6]'}`}>
                        {conv.unreadCount > 0 ? 'Now' : new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className={`text-[14px] truncate mt-1 ${conv.unreadCount > 0 ? 'font-bold text-white' : 'text-[#9aa0a6]'}`}>
                    {conv.lastMessage || (isSelected ? "Selected" : "No messages")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div className="h-40"></div>
      </div>

      {/* FAB and Gemini Icon */}
      <div className={`absolute bottom-6 right-6 flex flex-col items-end space-y-4 transition-transform duration-300 ${isSelectionMode ? 'translate-y-40' : 'translate-y-0'}`}>
        <button 
          onClick={() => onSelect('Gemini')} 
          className="bg-[#1f2933] p-4 rounded-[24px] shadow-2xl border border-gray-800/50 cursor-pointer active:scale-90 transition-all hover:bg-[#2d3748] flex items-center justify-center group"
          aria-label="Chat with Gemini"
        >
           <svg className="w-7 h-7 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none">
             <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#gemini-sparkle-gradient-2)"/>
             <defs>
               <linearGradient id="gemini-sparkle-gradient-2" x1="2" y1="2" x2="22" y2="22">
                 <stop offset="0%" stopColor="#4e82ee" />
                 <stop offset="100%" stopColor="#a0c2ff" />
               </linearGradient>
             </defs>
           </svg>
        </button>

        <button 
          onClick={onOpenContacts}
          className="flex items-center bg-[#014689] text-white px-6 py-4 rounded-[28px] shadow-2xl active:scale-95 transition-all hover:brightness-110"
        >
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="font-medium text-[16px]">Start chat</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationList;


import React, { useState } from 'react';
import { Contact } from '../types';

interface Props {
  contacts: Contact[];
  hasPermission: boolean;
  onGrantPermission: () => Promise<boolean>;
  onBack: () => void;
  onSelectContact: (contact: Contact) => void;
}

const NewChatView: React.FC<Props> = ({ contacts, hasPermission, onGrantPermission, onBack, onSelectContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );
  const normalizedQuery = searchQuery.replace(/[^\d+]/g, '').trim();
  const showManualNumber =
    hasPermission &&
    normalizedQuery.length >= 6 &&
    !filteredContacts.some(c => c.phone.replace(/\D/g, '') === normalizedQuery.replace(/\D/g, ''));

  const sections = Array.from(new Set(filteredContacts.map(c => c.name.charAt(0).toUpperCase()))).sort();

  return (
    <div className="absolute inset-0 bg-[#0b141b] z-50 flex flex-col animate-fade-in text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-3 pt-10 pb-3">
        <button onClick={onBack} className="p-3 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-[22px] font-medium ml-3 font-sans">New chat</h2>
      </div>

      {!hasPermission ? (
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center animate-fade-in">
           <div className="w-24 h-24 bg-[#1f2933] rounded-full flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-[#a8c7fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
           </div>
           <h3 className="text-[20px] font-normal mb-4">Access your contacts</h3>
           <p className="text-[14px] text-gray-400 mb-10 leading-relaxed">
             To message your friends and family, allow Messages to access your contacts.
           </p>
          {error && <p className="mb-4 text-[13px] text-amber-400">{error}</p>}
          <button 
            onClick={async () => {
              if (isRequesting) return;
              setIsRequesting(true);
              setError(null);
              const granted = await onGrantPermission();
              if (!granted) {
                setError('Contacts permission denied. Enable it in system settings.');
              }
              setIsRequesting(false);
            }}
            className="bg-[#a8c7fa] text-[#062e6f] font-medium px-10 py-3 rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-60"
            disabled={isRequesting}
          >
            {isRequesting ? 'Requesting...' : 'Allow access'}
          </button>
        </div>
      ) : (
        <>
          <div className="px-5 mt-2">
            {/* Search Input - Matching Screenshot Style */}
            <div className="flex items-center bg-[#1f2227] rounded-[28px] px-6 py-4 focus-within:bg-[#16191d] transition-all border border-transparent focus-within:border-gray-700/50">
              <span className="text-[16px] text-[#9aa0a6] mr-4 font-medium">To:</span>
              <input 
                autoFocus
                type="text" 
                placeholder="Type name or phone number"
                className="bg-transparent border-none focus:ring-0 text-[16px] text-white w-full placeholder-[#757b82] outline-none font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Gemini and Create Group Buttons */}
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => onSelectContact({ id: 'Gemini', name: 'Gemini', phone: 'AI Assistant', color: '#4e82ee' })}
                className="flex-1 flex items-center justify-center bg-[#1f2933] hover:bg-[#2d3748] text-white font-medium py-[14px] rounded-[32px] active:scale-95 transition-all text-[15px] border border-gray-700/30"
              >
                 <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                   <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#gemini-sparkle-gradient-3)"/>
                   <defs>
                     <linearGradient id="gemini-sparkle-gradient-3" x1="2" y1="2" x2="22" y2="22">
                       <stop offset="0%" stopColor="#4e82ee" />
                       <stop offset="100%" stopColor="#a0c2ff" />
                     </linearGradient>
                   </defs>
                 </svg>
                 <span className="font-sans">Gemini</span>
              </button>
              <button className="flex-1 flex items-center justify-center bg-[#1a73e8] hover:bg-[#1b66c9] text-white font-medium py-[14px] rounded-[32px] active:scale-95 transition-all text-[15px] shadow-lg">
                 <span className="font-sans tracking-wide">Create group</span>
              </button>
            </div>
            {showManualNumber && (
              <button
                onClick={() => onSelectContact({
                  id: `manual_${normalizedQuery}`,
                  name: normalizedQuery,
                  phone: normalizedQuery,
                  color: '#4caf50',
                })}
                className="mt-3 w-full rounded-[22px] border border-gray-700 bg-[#1f2933] px-4 py-3 text-left text-sm text-white"
              >
                Send message to {normalizedQuery}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 mt-6 pb-10">
            {sections.map(section => {
              const sectionContacts = filteredContacts.filter(c => c.name.charAt(0).toUpperCase() === section);
              return (
                <div key={section} className="mb-6">
                  {/* Letter Header - Small and subtle */}
                  <div className="text-[13px] font-bold text-[#7fcfff] mb-3 ml-1">{section}</div>
                  <div className="space-y-1">
                    {sectionContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        onClick={() => onSelectContact(contact)} 
                        className="flex items-center py-3 group cursor-pointer active:scale-[0.98] transition-all rounded-2xl hover:bg-white/5 px-2 -ml-2"
                      >
                        {/* Avatar */}
                        <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-white font-medium text-[20px] mr-4 shadow-sm" style={{ backgroundColor: contact.color }}>
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Name and Phone */}
                        <div className="flex flex-col">
                          <div className="text-[17px] font-normal text-[#fcfcfc] font-sans">{contact.name}</div>
                          <div className="text-[14px] text-[#9aa0a6] font-sans tracking-tight">{contact.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredContacts.length === 0 && (
              <div className="text-center mt-20 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <p className="text-[15px]">No contacts found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NewChatView;


import React from 'react';
import { Conversation } from '../types';

interface Props {
  conversations: Conversation[];
  onBack: () => void;
  onSelect: (id: string) => void;
}

const ArchivedView: React.FC<Props> = ({ conversations, onBack, onSelect }) => {
  return (
    <div className="absolute inset-0 bg-[#0b141b] z-40 flex flex-col animate-fade-in text-white">
      <div className="flex items-center px-4 pt-10 pb-4">
        <button onClick={onBack} className="p-3 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-[20px] font-normal ml-3">Archived</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 px-10 text-center opacity-50">
             <div className="w-20 h-20 bg-[#1f2933] rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
             </div>
             <p className="text-[16px]">No archived conversations</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => onSelect(conv.id)}
              className="flex items-center px-4 py-[14px] active:bg-[#1f2933] transition-colors cursor-pointer"
            >
              <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-[16px] truncate text-[#fcfcfc]">{conv.name}</h3>
                  <span className="text-[12px] text-[#9aa0a6] ml-2">Archived</span>
                </div>
                <p className="text-[14px] truncate text-[#9aa0a6] mt-0.5">{conv.lastMessage}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArchivedView;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Conversation, Message } from '../types';
import { generateAiReply } from '../services/geminiService';

const GOOGLE_PALETTE = [
  '#3C4043',
  '#3C4044',
  '#3C4045',
  '#3C4046',
  '#3C4047',
  '#3C4048',
  '#3C4041',
  '#3C4042',
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

interface Props {
  conversation: Conversation;
  onBack: () => void;
  onSendMessage: (text?: string, image?: string, audio?: string) => void;
  onReceiveMessage: (id: string, text: string) => void;
  onNavigateToHelp?: () => void;
  cbePhoneNumber?: string;
  isCbeNumber?: (phone?: string) => boolean;
}

type OverlayType = 'none' | 'attachments' | 'emoji' | 'voice' | 'calling';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄', '💋', '🩸'
];

const MessageText: React.FC<{ text: string | undefined }> = ({ text }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <div className="break-words overflow-wrap-anywhere">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
};

const ChatView: React.FC<Props> = ({ conversation, onBack, onSendMessage, onReceiveMessage, onNavigateToHelp, cbePhoneNumber, isCbeNumber }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('none');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  useEffect(() => {
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (conversation.isAi && lastMsg && lastMsg.sender === 'me') {
      setIsTyping(true);
      const history = conversation.messages.map((m: Message) => ({ role: m.sender, content: m.text || '' }));
      generateAiReply(history)
        .then((reply: string) => {
          setIsTyping(false);
          onReceiveMessage(conversation.id, reply);
        })
        .catch((error: any) => {
          console.error('Error generating AI reply:', error);
          setIsTyping(false);
          onReceiveMessage(conversation.id, 'Sorry, I encountered an error. Please try again.');
        });
    }
  }, [conversation.messages.length, conversation.isAi, conversation.id, onReceiveMessage]);

  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        setShowScrollToTop(messagesContainerRef.current.scrollTop > 200);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSend = (text: string = inputText, image?: string, audio?: string) => {
    if (!text.trim() && !image && !audio) return;
    const cbeChat = conversation.id === 'CBE_NOTIFICATIONS' || isCbeNumber?.(conversation.phone) || conversation.name === 'CBE';
    if (cbeChat) {
      console.warn('Sending is disabled for CBE conversation');
      setInputText('');
      return;
    }
    onSendMessage(text, image, audio);
    setInputText('');
    setActiveOverlay('none');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          handleSend('', '', base64String);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleSend('', base64String);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEmojiClick = (emoji: string) => setInputText(prev => prev + emoji);

  const handleCall = () => {
    const dialable = (conversation.phone || '').replace(/[^0-9+]/g, '');
    if (dialable) {
      window.location.href = `tel:${dialable}`;
      return;
    }
    setActiveOverlay('calling');
    setTimeout(() => setActiveOverlay('none'), 3000);
  };

  const isCbeChat = conversation.id === 'CBE_NOTIFICATIONS' || isCbeNumber?.(conversation.phone) || conversation.name === 'CBE';

  const toggleOverlay = (type: OverlayType) => setActiveOverlay(activeOverlay === type ? 'none' : type);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    const sortedMessages = conversation.messages;

    sortedMessages.forEach((msg: Message) => {
      const date = new Date(msg.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let displayDate = '';
      if (date.toDateString() === today.toDateString()) displayDate = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) displayDate = 'Yesterday';
      else displayDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === displayDate) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: displayDate, messages: [msg] });
      }
    });

    return groups;
  }, [conversation.messages]);

  const isInputEmpty = inputText.trim().length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0b141b] text-white relative select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-10 pb-3 sticky top-0 bg-[#0b141b] z-20">
        <div className="flex items-center">
          <button onClick={onBack} className="p-3 active:bg-gray-800 rounded-full text-white transition-transform active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div className="flex items-center ml-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-gray-700 shadow-sm`} style={{ backgroundColor: pickPaletteColor(conversation.id) }}>
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3" fill="white"/><path d="M12 12 C8 12 5 14 5 18 L19 18 C19 14 16 12 12 12 Z" fill="white"/></svg>
            </div>
            <h3 className="text-[20px] font-normal ml-4 tracking-tight">{isCbeChat ? 'CBE' : conversation.name}</h3>
          </div>
        </div>
        <div className="flex items-center pr-2 relative">
          <button onClick={handleCall} className="p-3 text-[#e3e3e3] hover:bg-gray-800 rounded-full active:scale-90 transition-all">
            <svg className="w-[24px] h-[24px]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.43-3.9-6.63-6.66l1.97-1.57c.27-.27.35-.66.24-1.02-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19c-.54 0-1 .45-1 .99 0 9.39 7.61 17 17 17 .55 0 1-.45 1-.99v-3.89c0-.54-.45-.99-.99-.99z"/></svg>
          </button>
          <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className={`p-3 text-[#e3e3e3] rounded-full transition-colors ${isMoreMenuOpen ? 'bg-gray-800' : 'hover:bg-gray-800 active:bg-gray-800'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01"/></svg>
          </button>
          {isMoreMenuOpen && (
            <div ref={menuRef} className="absolute top-1 right-2 w-[240px] bg-[#1f2933] rounded-[12px] shadow-2xl z-50 py-3 animate-fade-in border border-gray-700/30">
              <MenuItem label="Details" onClick={() => setIsMoreMenuOpen(false)} />
              <MenuItem label="Search" onClick={() => setIsMoreMenuOpen(false)} />
              <MenuItem label="Delete conversation" onClick={() => { if (confirm('Delete this entire conversation history?')) { onBack(); } setIsMoreMenuOpen(false); }} />
              <MenuItem label="Help & feedback" onClick={() => { onNavigateToHelp?.(); setIsMoreMenuOpen(false); }} />
            </div>
          )}
        </div>
      </div>

      {/* Calling Overlay */}
      {activeOverlay === 'calling' && (
        <div className="absolute inset-0 bg-[#0b141b] z-[100] flex flex-col items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center space-y-8">
            <div className="w-32 h-32 rounded-full bg-[#fbc02d] flex items-center justify-center text-4xl font-bold text-[#0b141b] shadow-2xl animate-pulse">{conversation.name.charAt(0)}</div>
            <div className="text-center">
              <h2 className="text-3xl font-medium mb-2">{conversation.name}</h2>
              <p className="text-[#7fcfff] animate-pulse">Calling...</p>
            </div>
            <div className="flex space-x-8 pt-12">
              <button onClick={() => setActiveOverlay('none')} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List with Past History Headers */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2 no-scrollbar pb-10">
        {groupedMessages.map((group, gIdx) => (
          <React.Fragment key={group.date}>
            <div className="flex justify-center my-6">
              <span className="text-[12px] text-gray-400 font-medium tracking-wide bg-[#1f2933]/60 px-4 py-1.5 rounded-full uppercase border border-gray-800/50">{group.date}</span>
            </div>
            {group.messages.map((msg, mIdx) => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-[24px] text-[16px] font-roboto leading-[1.4] shadow-sm transition-all duration-200 ${msg.sender === 'me' ? 'bg-[#1b72e8] text-white rounded-br-[4px]' : 'bg-[#1f2933] text-[#e3e3e3] rounded-bl-[4px]'}`}>
                  {msg.image && <img src={msg.image} alt="Attachment" className="max-w-full rounded-[16px] mb-2 border border-white/10" referrerPolicy="no-referrer" />}
                  {msg.audio && <div className="mb-2"><audio controls src={msg.audio} className="w-full h-8 filter invert opacity-80" /></div>}
                  <MessageText text={msg.text} />
                  <div className={`text-[10px] mt-1 opacity-60 text-right ${msg.sender === 'me' ? 'text-white' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{msg.sender === 'me' && ' • Sent'}
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1f2933] px-5 py-3 rounded-[24px] rounded-bl-none flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-[#7fcfff] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#7fcfff] rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-[#7fcfff] rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button onClick={scrollToTop} className="absolute bottom-24 right-4 w-12 h-12 bg-[#1f2933] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-[#2d3748] z-10" aria-label="Scroll to top">
          <svg className="w-6 h-6 text-[#e3e3e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      )}

      {/* Input Bar */}
      <div className="relative bg-[#0b141b]">
        {activeOverlay === 'emoji' && (
          <div className="absolute bottom-full left-0 w-full h-[250px] bg-[#1f2933] border-t border-gray-700/50 overflow-y-auto p-4 grid grid-cols-8 gap-2 animate-slide-up z-30">
            {EMOJIS.map((emoji, index) => (
              <button key={index} onClick={() => handleEmojiClick(emoji)} className="text-2xl hover:bg-gray-700 p-2 rounded-lg transition-colors active:scale-90">{emoji}</button>
            ))}
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/*" onChange={handleFileChange} />

        <div className="px-4 pb-10 pt-2 flex flex-col space-y-2 safe-area-bottom bg-[#0b141b] w-full">
          {isCbeChat && (
            <div className="px-2 py-2 text-center text-xs text-gray-400 bg-[#1c2530] rounded-lg border border-gray-700">This CBE contact is read-only. Replies are disabled.</div>
          )}

          <div className="flex items-center space-x-3 w-full">
            <button type="button" disabled={isCbeChat} onClick={handleFileClick} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0 ${isCbeChat ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'hover:bg-[#2d3748]'} ${activeOverlay === 'attachments' ? 'bg-[#7fcfff] text-[#0b141b]' : 'bg-[#1f2933] text-[#7fcfff]'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
            </button>

            <div className="flex-1 flex items-center bg-[#1f2933] rounded-[28px] px-5 py-2.5 overflow-hidden transition-colors hover:bg-[#2d3748]">
              <input type="text" placeholder={isCbeChat ? 'CBE messages are read-only' : 'Text message'} disabled={isCbeChat} className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-white outline-none placeholder-gray-400 min-w-0 font-roboto" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} onFocus={() => setActiveOverlay('none')} />
              <div className="flex items-center space-x-4 ml-3 flex-shrink-0">
                <button onClick={() => toggleOverlay('emoji')} disabled={isCbeChat} className="active:scale-90 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </button>
              </div>
            </div>

            {isInputEmpty ? (
              <div className="flex items-center space-x-2">
                {isRecording && <span className="text-red-500 font-mono text-sm animate-pulse">{formatTime(recordingTime)}</span>}
                <button onClick={isRecording ? stopRecording : startRecording} disabled={isCbeChat} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#1f2933] text-[#7fcfff] hover:bg-[#2d3748]'}`}>
                  {isRecording ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>}
                </button>
              </div>
            ) : (
              <button onClick={() => handleSend()} disabled={isCbeChat} className="w-12 h-12 flex flex-col items-center justify-center rounded-full bg-[#a8c7fa] flex-shrink-0 active:scale-90 transition-all shadow-md">
                <div className="relative flex flex-col items-center pt-1"><span className="text-[9px] font-bold text-[#062e6f] mt-[-2px]">SMS</span></div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <div onClick={onClick} className="px-6 py-[14px] hover:bg-[#2d3748] active:bg-[#4a5568] transition-colors cursor-pointer text-[16px] text-[#e3e3e3] font-normal">
    {label}
  </div>
);

export default ChatView;

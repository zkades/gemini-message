
import React from 'react';

interface Props {
  onBack: () => void;
  email: string;
}

const ProfileDetailView: React.FC<Props> = ({ onBack, email }) => {
  // Get email from multiple sources like ProfileOverlay
  let userEmail: string | null = email;
  
  // Try backup first
  if (!userEmail) {
    userEmail = localStorage.getItem('user_email_backup');
  }
  
  // Try main auth storage
  if (!userEmail) {
    const storedAuth = localStorage.getItem('gemini_messages_mock_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        userEmail = authData.email;
      } catch (e) {
        console.error('Error parsing stored auth:', e);
      }
    }
  }
  
  const emailTag = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : 'USER';
  
  console.log('ProfileDetailView - userEmail:', userEmail, 'emailTag:', emailTag);
  return (
    <div className="absolute inset-0 bg-[#0b141b] z-[60] flex flex-col animate-fade-in text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-10 pb-4">
        <button onClick={onBack} className="p-3 hover:bg-gray-800 rounded-full text-white active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-[19px] font-normal ml-3">Your Google Account profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-10 no-scrollbar">
        <h1 className="text-[34px] font-normal leading-tight text-center px-4">
          Customize how you're seen
        </h1>

        <div className="mt-16 bg-[#1f2933]/30 rounded-[48px] p-10 flex flex-col items-center">
          {/* Large Avatar matching screenshot */}
          <div className="relative">
             <div className="w-[180px] h-[180px] rounded-full overflow-hidden bg-[#1f2933] shadow-2xl border border-gray-700 flex items-center justify-center text-[28px] font-semibold text-white">
               {emailTag}
             </div>
             {/* Camera floating action button */}
             <div className="absolute bottom-2 right-2 bg-[#1f2933] w-14 h-14 rounded-full border-[1.5px] border-gray-700 shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer">
                <svg className="w-6 h-6 text-[#7fcfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
          </div>

          {/* Editable Name */}
          <div className="mt-10 flex items-center space-x-3 cursor-pointer group active:opacity-70">
            <span className="text-[20px] font-normal break-all text-center">{userEmail || 'user@example.com'}</span>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>

          {/* Visibility Dropdown Selector */}
          <div className="mt-12 flex flex-col items-center">
             <div className="text-[13px] text-gray-400 font-medium mb-1">Show name and picture to</div>
             <div className="flex items-center space-x-2 cursor-pointer active:bg-gray-800/50 px-4 py-1 rounded-full">
                <span className="text-[17px] font-medium">People you message</span>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
             </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-auto py-12 text-center">
           <a href="#" className="text-[14px] text-gray-300 hover:text-white hover:underline transition-all">
             Learn more about profile sharing
           </a>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailView;

import React, { useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { signInWithEmail } from '../firebase';

const LoginView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [cbePhone, setCbePhone] = useState('');

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const trimmed = email.trim();
      const trimmedCbe = cbePhone.trim();

      if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
        setError('Enter a valid email address.');
        setIsLoading(false);
        return;
      }

      if (!trimmedCbe || !/^[+\d][\d\s-]{7,20}$/.test(trimmedCbe)) {
        setError('Enter a valid CBE phone number.');
        setIsLoading(false);
        return;
      }

      // Debug: Log what we're about to store
      console.log('LoginView - About to sign in with email:', trimmed, 'and CBE phone:', trimmedCbe);

      // Save email to localStorage directly as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_email_backup', trimmed);
        localStorage.setItem('cbe_phone_number', trimmedCbe);
        console.log('LoginView - Saved email and CBE phone to localStorage backup:', trimmed, trimmedCbe);
      }

      await Preferences.set({ key: 'cbe_phone_number', value: trimmedCbe });
      await Preferences.set({ key: 'user_email', value: trimmed });

      await signInWithEmail(trimmed);

      // Debug: Check what's in localStorage after sign in
      setTimeout(() => {
        const stored = localStorage.getItem('gemini_messages_mock_auth');
        const backup = localStorage.getItem('user_email_backup');
        console.log('LoginView - Stored auth data after sign in:', stored);
        console.log('LoginView - Email backup in localStorage:', backup);
      }, 500);

    } catch (err: any) {
      console.error("Sign in failed:", err);
      const errorMessage = err.message || "Sign in failed. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0b141b] text-white px-8">
      <div className="w-20 h-20 mb-8">
        <img
          src="/icons/icon-96.png"
          alt="Google Messages"
          className="w-full h-full object-contain"
        />
      </div>
      <h1 className="text-[28px] font-normal mb-2 tracking-tight">Messages</h1>
      <p className="text-[#9aa0a6] text-center mb-8 leading-relaxed">
        Enter your email address to continue.
      </p>

      {error && (
        <div className="w-full mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg animate-fade-in">
          <p className="text-red-300 text-sm text-center">{error}</p>

        </div>
      )}

      <div className="w-full max-w-sm mb-4">
        <label className="text-[12px] text-gray-400">Email address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@gmail.com"
          className="mt-2 w-full rounded-xl bg-[#1f2933] px-4 py-3 text-[15px] text-white placeholder-[#757b82] outline-none focus:ring-2 focus:ring-[#a8c7fa]"
          autoComplete="email"
        />
      </div>
      <div className="w-full max-w-sm">
        <label className="text-[12px] text-gray-400">phone number</label>
        <input
          type="tel"
          value={cbePhone}
          onChange={(e) => setCbePhone(e.target.value)}
          placeholder="+251"
          className="mt-2 w-full rounded-xl bg-[#1f2933] px-4 py-3 text-[15px] text-white placeholder-[#757b82] outline-none focus:ring-2 focus:ring-[#a8c7fa]"
        />
      </div>

      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`mt-8 flex items-center justify-center px-8 py-3 rounded-full font-medium shadow-xl transition-all ${isLoading
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
            : 'bg-[#a8c7fa] text-[#062e6f] active:scale-95 hover:brightness-110'
          }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#062e6f] mr-3"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <span>Continue</span>
        )}
      </button>

      <div className="mt-10 text-[12px] text-[#757b82] text-center">
        This is a mock sign-in screen for demo purposes.
      </div>
    </div>
  );
};

export default LoginView;

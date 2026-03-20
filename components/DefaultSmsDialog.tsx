import React from 'react';

interface DefaultSmsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSetDefault: () => void;
  onSkip: () => void;
}

export const DefaultSmsDialog: React.FC<DefaultSmsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSetDefault, 
  onSkip 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2933] rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-[#a8c7fa] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#062e6f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-2">
            Set as Default SMS App
          </h2>

          {/* Description */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            To send and receive SMS messages, this app needs to be set as your default SMS app. 
            This allows it to access your messages and send new ones.
          </p>

          {/* Instructions */}
          <div className="bg-[#0b141b] rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-white mb-2">How to set:</h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Go to Settings → Apps & notifications</li>
              <li>Find this app → App info</li>
              <li>Tap "Set as default" → Select "SMS app"</li>
              <li>Return to this app</li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Skip
            </button>
            <button
              onClick={onSetDefault}
              className="flex-1 px-4 py-3 bg-[#014689] text-white rounded-lg hover:bg-[#014689]/90 transition-colors font-medium"
            >
              I'll Set It Now
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-400 mt-4">
            Your privacy is important. This app only accesses SMS functionality with your permission.
          </p>
        </div>
      </div>
    </div>
  );
};

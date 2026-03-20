import React, { useState } from 'react';

interface ContactPermissionDialogProps {
  open: boolean;
  onAllow: () => void | Promise<void>;
  onDeny: () => void;
  onOpenChange?: (open: boolean) => void;
}

export default function ContactPermissionDialog({
  open,
  onAllow,
  onDeny,
  onOpenChange,
}: ContactPermissionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      await onAllow();
    } finally {
      setIsLoading(false);
      onOpenChange?.(false);
    }
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange?.(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-900">Access Your Contacts</h2>
        <p className="mt-3 text-sm text-gray-700">
          Gemini Messages needs contact access to start chats with saved contacts.
        </p>

        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
          Contacts are used on-device for this app experience.
        </div>

        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Show contact names in conversations</li>
          <li>Start chats faster with saved contacts</li>
          <li>Display contact numbers</li>
        </ul>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleDeny}
            disabled={isLoading}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleAllow}
            disabled={isLoading}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoading ? 'Requesting...' : 'Allow access'}
          </button>
        </div>
      </div>
    </div>
  );
}
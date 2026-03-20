import React, { useEffect, useState } from 'react';
import { DeviceSMS, fetchOldMessages, getSmsDebugInfo, SmsDebugInfo } from '../services/deviceService';

interface OldMessagesViewProps {
  onMessagesLoaded?: (messages: DeviceSMS[]) => void;
}

export default function OldMessagesView({ onMessagesLoaded }: OldMessagesViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<DeviceSMS[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<SmsDebugInfo | null>(null);

  useEffect(() => {
    void (async () => {
      setDebug(await getSmsDebugInfo());
    })();
  }, []);

  const handleRetrieveMessages = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchOldMessages();
      setMessages(data);
      onMessagesLoaded?.(data);
      if (data.length === 0) {
        setError('No old messages found on this device.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve messages');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-gray-900">Retrieve Old Messages</h3>
      <p className="mt-1 text-sm text-gray-600">Import existing SMS messages from your device.</p>
      {debug && (
        <div className="mt-2 space-y-1 text-xs text-gray-500">
          <p>native:{String(debug.nativePlatform)} smsPlugin:{String(debug.smsPluginAvailable)} smsReader:{String(debug.legacySmsReaderAvailable)} contacts:{String(debug.contactsPluginAvailable)}</p>
          <p>smsPermission:{debug.smsPermission || 'unknown'} defaultSms:{String(debug.isDefaultSmsApp)} rows:{String(debug.smsCount ?? 'n/a')}</p>
          {(debug.appPackage || debug.defaultSmsPackage) && (
            <p>app:{debug.appPackage || '-'} default:{debug.defaultSmsPackage || '-'}</p>
          )}
          {debug.statusError && <p className="text-red-600">statusError: {debug.statusError}</p>}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
      {messages.length > 0 && (
        <p className="mt-3 text-sm text-green-700">Retrieved {messages.length} messages.</p>
      )}

      <button
        type="button"
        onClick={handleRetrieveMessages}
        disabled={isLoading}
        className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isLoading ? 'Retrieving...' : 'Retrieve Old Messages'}
      </button>

      {messages.length > 0 && (
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {messages.slice(0, 10).map((msg) => (
            <div key={msg.id} className="rounded-lg border border-gray-200 p-2">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-900">{msg.phone}</span>
                <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700">{msg.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

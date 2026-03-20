import React, { useEffect, useState } from 'react';
import ContactPermissionDialog from './ContactPermissionDialog';
import OldMessagesView from './OldMessagesView';
import {
  DeviceContact,
  DeviceSMS,
  checkContactPermission,
  fetchDeviceContacts,
  requestContactPermission,
} from '../services/deviceService';

interface EnhancedSettingsViewProps {
  onClose?: () => void;
  onImportMessages?: (messages: DeviceSMS[]) => void | Promise<void>;
}

export default function EnhancedSettingsView({ onClose, onImportMessages }: EnhancedSettingsViewProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const status = await checkContactPermission();
      setPermission(status);
      if (status === 'granted') {
        await loadContacts();
      }
    };
    void init();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDeviceContacts();
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllow = async () => {
    const granted = await requestContactPermission();
    if (granted) {
      setPermission('granted');
      await loadContacts();
      return;
    }
    setPermission('denied');
  };

  const handleDeny = () => {
    setPermission('denied');
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Settings & Permissions</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700"
          >
            Close
          </button>
        )}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Access</h3>
        <p className="mt-1 text-sm text-gray-600">Status: {permission}</p>

        {permission !== 'granted' && (
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Request Contact Access
          </button>
        )}

        {permission === 'granted' && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Contacts ({contacts.length})</p>
              <button
                type="button"
                onClick={loadContacts}
                disabled={isLoading}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 disabled:opacity-60"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {error && <p className="mb-2 text-sm text-red-700">{error}</p>}

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border border-gray-200 p-2">
                  <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                  <p className="text-xs text-gray-600">{contact.phone}</p>
                </div>
              ))}
              {contacts.length === 0 && !isLoading && (
                <p className="text-sm text-gray-500">No contacts found.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <OldMessagesView
          onMessagesLoaded={(messages: DeviceSMS[]) => {
            void onImportMessages?.(messages);
          }}
        />
      </section>

      <ContactPermissionDialog
        open={showDialog}
        onAllow={handleAllow}
        onDeny={handleDeny}
        onOpenChange={setShowDialog}
      />
    </div>
  );
}

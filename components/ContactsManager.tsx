import React, { useState, useEffect } from 'react';
import { Contacts } from '@capacitor-community/contacts';

interface Contact {
  contactId: string;
  name?: {
    display?: string;
    given?: string;
    family?: string;
  };
  phones?: {
    number: string;
    type?: string;
  }[];
  emails?: {
    address: string;
    type?: string;
  }[];
  photo?: {
    uri: string;
  };
}

interface Props {
  onSelectContact: (contact: Contact) => void;
  onBack: () => void;
}

const ContactsManager: React.FC<Props> = ({ onSelectContact, onBack }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permission = await Contacts.checkPermissions();
      console.log('Contacts permission status:', permission);
      
      // Handle Android permission states
      switch (permission.contacts) {
        case 'granted':
          setHasPermission(true);
          await loadContacts();
          break;
        case 'denied':
          setHasPermission(false);
          setError('Contacts permission was denied');
          break;
        case 'prompt':
          setHasPermission(false);
          // User hasn't been asked yet, will request on first use
          break;
        default:
          setHasPermission(false);
          console.warn('Unknown permission state:', permission.contacts);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError('Failed to check permissions');
      setHasPermission(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Requesting contacts permission...');
      const permission = await Contacts.requestPermissions();
      console.log('Permission request result:', permission);
      
      if (permission.contacts === 'granted') {
        setHasPermission(true);
        await loadContacts();
      } else if (permission.contacts === 'denied') {
        setHasPermission(false);
        setError('Contacts permission denied. Please enable in Settings.');
      } else {
        setHasPermission(false);
        setError('Permission request failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error requesting permissions:', err);
      if (err.message?.includes('denied')) {
        setError('Contacts permission was denied. Please enable in Settings.');
      } else {
        setError('Failed to request permissions: ' + err.message);
      }
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to load contacts...');
      
      // Check if plugin is available
      if (!Contacts) {
        throw new Error('Contacts plugin not available');
      }
      
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
          image: true,
        },
      });

      console.log('Raw contacts result:', result);
      console.log('Number of contacts loaded:', result.contacts?.length || 0);
      
      if (!result.contacts || result.contacts.length === 0) {
        console.warn('No contacts found - this might indicate plugin not working');
        setError('No contacts found. Please check app permissions and try again.');
        return;
      }
      
      // Log first few contacts for debugging
      result.contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`Contact ${index}:`, {
          id: contact.contactId,
          name: contact.name?.display,
          phone: contact.phones?.[0]?.number,
          email: contact.emails?.[0]?.address
        });
      });
      
      const contactList = result.contacts as Contact[];
      
      // Sort contacts alphabetically by name (A-Z)
      const sortedContacts = contactList.sort((a, b) => {
        const nameA = a.name?.display?.toLowerCase() || '';
        const nameB = b.name?.display?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
      
      setContacts(sortedContacts);
      setAllContacts(sortedContacts);
      
      console.log('Successfully loaded and sorted', sortedContacts.length, 'contacts');
    } catch (err: any) {
      console.error('Error loading contacts:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      
      if (err.message?.includes('Permission')) {
        setError('Permission denied. Please enable contacts access in Settings.');
      } else if (err.message?.includes('not available')) {
        setError('Contacts plugin not available. Please restart the app.');
      } else {
        setError('Failed to load contacts: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = (query: string) => {
    if (!query.trim()) {
      setContacts(allContacts);
      return;
    }

    const filtered = allContacts.filter(contact => 
      contact.name?.display?.toLowerCase().includes(query.toLowerCase()) ||
      contact.phones?.some(phone => phone.number.includes(query)) ||
      contact.emails?.some(email => email.address.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Maintain alphabetical order even when filtering
    const sortedFiltered = filtered.sort((a, b) => {
      const nameA = a.name?.display?.toLowerCase() || '';
      const nameB = b.name?.display?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
    
    setContacts(sortedFiltered);
  };

  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0b141b] text-white p-8">
        <div className="text-center">
          <h2 className="text-xl mb-4">Checking contacts permissions...</h2>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0b141b] text-white p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl mb-4">Contacts Access Required</h2>
          <p className="text-gray-300 mb-6">
            This app needs access to your contacts to help you start conversations with people you know.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={requestPermissions}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Requesting...' : 'Grant Permission'}
            </button>
            <button
              onClick={() => onBack()}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
          </div>
          <div className="mt-6 text-xs text-gray-400">
            <p>• Contacts are accessed only to start conversations</p>
            <p>• Your contact data stays on your device</p>
            <p>• No contact data is uploaded to servers</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0b141b] text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full active:scale-90 transition-transform mr-3"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Contacts</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full px-4 py-3 pl-12 bg-[#1f2933] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => filterContacts(e.target.value)}
          />
          <svg
            className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-400 text-center px-4">{error}</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400">No contacts found</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {contacts.map((contact) => (
              <div 
                key={contact.contactId} 
                className="p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#1f2933] flex items-center justify-center">
                      {contact.photo?.uri ? (
                        <img
                          src={contact.photo.uri}
                          alt={contact.name?.display}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-white">
                          {contact.name?.display?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-white">
                        {contact.name?.display || 'Unknown'}
                      </h3>
                      {contact.phones && contact.phones.length > 0 && (
                        <p className="text-sm text-gray-400">
                          {contact.phones[0].number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Three-dot Menu */}
                  <button
                    className="p-2 hover:bg-gray-700 rounded-full active:scale-90 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Menu for contact:', contact);
                    }}
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsManager;

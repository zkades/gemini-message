import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  auth, 
  db, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs,
  getDoc,
  onAuthStateChanged,
  OperationType,
  logout,
  handleFirestoreError,
  User
} from './firebase';
import { Conversation, Message, View, Contact, UserAccount } from './types';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import ConversationList from './components/ConversationList';
import ChatView from './components/ChatView';
import NewChatView from './components/NewChatView';
import ProfileOverlay from './components/ProfileOverlay';
import ProfileDetailView from './components/ProfileDetailView';
import ArchivedView from './components/ArchivedView';
import SpamView from './components/SpamView';
import DevicePairingView from './components/DevicePairingView';
import EnhancedSettingsView from './components/EnhancedSettingsView';
import HelpView from './components/HelpView';
import SystemSettingsView from './components/SystemSettingsView';
import LoginView from './components/LoginView';
import ContactsManager from './components/ContactsManager';
import { DefaultSmsDialog } from './components/DefaultSmsDialog';
import {
  DeviceSMS,
  fetchOldMessages,
  sendDeviceSms,
  checkDefaultSmsApp,
  promptSetDefaultSmsApp,
  fetchDeviceContacts,
  checkContactPermission as checkDeviceContactPermission,
  requestContactPermission as requestDeviceContactPermission,
} from './services/deviceService';

const PERMS_KEY = 'gemini_messages_perms';
const DEFAULT_APP_KEY = 'gemini_messages_is_default';
const AUTO_IMPORT_KEY = 'gemini_messages_auto_import_done';
const AUTH_TIMEOUT = 10000; // 10 second timeout for auth
const MAX_IMPORT_PER_CONVERSATION = 300;
const IMPORT_CHUNK_SIZE = 50;
const SMS_POLL_INTERVAL_MS = 45000;

const GOOGLE_PALETTE = [
  '#3C4043', // Google Blue
  '#3C4044', // Google Red
  '#3C4045', // Google Yellow
  '#3C4046', // Google Green
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

const generateUserAvatar = (email: string, uid: string) => {
  const color = pickPaletteColor(email || uid);
  return {
    url: `/2.png`,
    color: color
  };
};

const getUserDisplayName = (email: string) => {
  return email ? email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() : 'USER';
};

const toDicebearColor = (color: string) => color.replace('#', '');
const createLocalId = () => Math.random().toString(36).slice(2, 10);
const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const isCbePhoneNumber = (phone: string | undefined, cbePhone: string) => {
  if (!phone || !cbePhone) return false;
  const normalized = normalizePhone(phone);
  const normalizedCbe = normalizePhone(cbePhone);
  if (!normalized || !normalizedCbe) return false;
  return normalized === normalizedCbe;
};

const SYSTEM_CONTACTS: Contact[] = [
  { id: 'sc1', name: 'Abenezer T.', phone: '093 447 9943', color: '#e91e63', isSystemContact: true },
  { id: 'sc2', name: 'Eyosi G.', phone: '091 305 0069', color: '#fbc02d', isSystemContact: true },
  { id: 'sc3', name: 'Biniyam S.', phone: '092 112 3344', color: '#4caf50', isSystemContact: true },
  { id: 'sc4', name: 'Dagmawi K.', phone: '094 556 7788', color: '#2196f3', isSystemContact: true },
  { id: 'sc5', name: 'Hanna M.', phone: '091 001 2233', color: '#9c27b0', isSystemContact: true },
];

// Global back button handler for Android
declare global {
  interface Window {
    handleBackButton: () => boolean;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasContactPermission, setHasContactPermission] = useState<boolean>(false);
  const [realContacts, setRealContacts] = useState<Contact[]>([]);
  const [showDefaultSmsDialog, setShowDefaultSmsDialog] = useState<boolean>(false);
  const [cbePhoneNumber, setCbePhoneNumber] = useState<string>('');
  const [cbeSetupDone, setCbeSetupDone] = useState<boolean>(false);
  const [isDefaultApp, setIsDefaultApp] = useState<boolean>(() => {
    return localStorage.getItem(DEFAULT_APP_KEY) === 'true';
  });
  const [view, setView] = useState<View>('list');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showDefaultPrompt, setShowDefaultPrompt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isImportingRef = useRef(false);
  const conversationsRef = useRef<Conversation[]>([]);
  const contactsRef = useRef<Contact[]>([]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    contactsRef.current = realContacts;
  }, [realContacts]);

  // Request notification permission once (Android 13+)
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.warn('Notification permission request failed:', e);
      }
    };
    void requestNotificationPermission();
  }, []);

  // Global back button handler for Android
  useEffect(() => {
    window.handleBackButton = () => {
      if (view !== 'list') {
        setView('list');
        return true; // Handled, don't close app
      }
      return false; // Not handled, allow app to close
    };

    return () => {
      delete (window as any).handleBackButton;
    };
  }, [view]);

  // Auth Listener with timeout
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not available");
      setIsAuthReady(true);
      return;
    }

    let authTimeout: NodeJS.Timeout;
    let unsubscribe: (() => void) | null = null;

    // Set timeout to force auth ready state
    authTimeout = setTimeout(() => {
      console.warn("Auth initialization timeout - proceeding without authentication");
      setIsAuthReady(true);
    }, AUTH_TIMEOUT);

    try {
      unsubscribe = onAuthStateChanged(auth, (u: User | null) => {
        clearTimeout(authTimeout);
        setUser(u);
        setIsAuthReady(true);
        setAuthError(null);
        
        if (u && db) {
          // Create/Update user profile in Firestore
          const userRef = doc(db, 'users', u.uid);
          const userAvatar = generateUserAvatar(u.email || '', u.uid);
          setDoc(userRef, {
            uid: u.uid,
            name: getUserDisplayName(u.email || ''),
            email: u.email || '',
            avatar: userAvatar.url,
            color: userAvatar.color,
            createdAt: serverTimestamp()
          }, { merge: true }).catch((e: any) => {
            console.warn("Error updating user profile:", e);
            handleFirestoreError(e, OperationType.WRITE, `users/${u.uid}`);
          });
        } else {
          setConversations([]);
          setView('list');
        }
      });
    } catch (error) {
      clearTimeout(authTimeout);
      console.error("Auth listener setup error:", error);
      setAuthError(error instanceof Error ? error.message : 'Unknown error');
      setIsAuthReady(true);
    }

    return () => {
      clearTimeout(authTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Firestore Real-time Sync
  useEffect(() => {
    if (!user || !db) return;

    const convsRef = collection(db, 'users', user.uid, 'conversations');
    const q = query(convsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      setConversations(prev => {
        const newConvs: Conversation[] = [];
        snapshot.forEach((docSnap: any) => {
          const data = docSnap.data();
          const existing = prev.find(c => c.id === docSnap.id);
          newConvs.push({
            ...data,
            id: docSnap.id,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            messages: existing ? existing.messages : []
          } as any as Conversation);
        });
        return newConvs;
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!user || !activeConversationId || !db) return;

    const msgsRef = collection(db, 'users', user.uid, 'conversations', activeConversationId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        msgs.push({
          ...data,
          id: docSnap.id,
          timestamp: data.timestamp?.toDate() || new Date()
        } as Message);
      });

      setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? { ...c, messages: msgs } : c
      ));
    });

    return () => unsubscribe();
  }, [user, activeConversationId]);

  useEffect(() => {
    localStorage.setItem(DEFAULT_APP_KEY, isDefaultApp.toString());
  }, [isDefaultApp]);

  useEffect(() => {
    const checkLocalPermission = async () => {
      try {
        const permission = await checkDeviceContactPermission();
        if (permission === 'granted') {
          setHasContactPermission(true);
          await fetchContacts();
        } else {
          const stored = localStorage.getItem(PERMS_KEY) === 'true';
          if (stored) {
            await requestDeviceContactPermission();
          }
        }
      } catch (e) {
        console.warn("Error checking contact permissions:", e);
      }
    };
    checkLocalPermission();
  }, []);

  useEffect(() => {
    const loadCbeConfig = async () => {
      try {
        const cbeValue = (await Preferences.get({ key: 'cbe_phone_number' })).value;
        if (cbeValue) {
          setCbePhoneNumber(cbeValue);
          setCbeSetupDone(true);
        } else {
          setCbeSetupDone(false);
        }
      } catch (e) {
        console.warn('Error loading CBE number from preferences', e);
        setCbeSetupDone(false);
      }
    };
    loadCbeConfig();
  }, []);

  const requestContactPermission = async (): Promise<boolean> => {
    try {
      const granted = await requestDeviceContactPermission();
      if (granted) {
        setHasContactPermission(true);
        localStorage.setItem(PERMS_KEY, 'true');
        await fetchContacts();
        return true;
      } else {
        setHasContactPermission(false);
        return false;
      }
    } catch (e) {
      console.error("Error requesting contact permissions:", e);
      return false;
    }
  };

  const fetchContacts = async () => {
    try {
      const deviceContacts = await fetchDeviceContacts();
      const mappedContacts: Contact[] = deviceContacts
        .map((c, index) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          color: pickPaletteColor(normalizePhone(c.phone) || c.name),
          isSystemContact: false
        }));
      
      setRealContacts(mappedContacts);
      if (mappedContacts.length > 0) {
        setHasContactPermission(true);
      }
    } catch (e) {
      console.error("Error fetching contacts:", e);
      setRealContacts([]);
    }
  };

  const openNewChat = async () => {
    setView('newChat');
  };

  const handleImportOldMessages = useCallback(async (messages: DeviceSMS[]) => {
    if (!user || !db || messages.length === 0 || isImportingRef.current) return;
    isImportingRef.current = true;

    try {
      const grouped = messages.reduce<Record<string, DeviceSMS[]>>((acc, msg) => {
        const key = normalizePhone(msg.phone || '');
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(msg);
        return acc;
      }, {});

      for (const phoneKey of Object.keys(grouped)) {
        const smsList = grouped[phoneKey]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-MAX_IMPORT_PER_CONVERSATION);

        const representative = smsList[smsList.length - 1];
        const existing = conversationsRef.current.find(
          (c) => normalizePhone(c.phone || '') === phoneKey
        );

        const convId = existing?.id || `sms_${phoneKey}`;
        const contactMatch = contactsRef.current.find(
          (c) => normalizePhone(c.phone) === phoneKey
        );
        const isCbeSms = isCbePhoneNumber(representative.phone, cbePhoneNumber);
        const convRef = doc(db, 'users', user.uid, 'conversations', convId);
        const lastMessage = representative?.text || '';
        const lastDate = new Date(representative?.timestamp || Date.now()).toISOString();
        const avatarSeed = isCbeSms ? 'CBE' : contactMatch?.name || representative.phone;
        const avatarColor = isCbeSms ? '#FF6B35' : contactMatch?.color || pickPaletteColor(avatarSeed);

        // Phase 2: Smart Initial Import - only count NEW messages since app install
        const conversationExists = existing && existing.id;
        const lastImportTime = existing?.lastImportTime || 0;
        
        // Get app install time to determine which messages are actually new
        const appInstallTime = await Preferences.get({ key: 'app_install_time' });
        let installTime: number;
        
        // Save app install time if not set (only ONCE)
        if (!appInstallTime.value) {
          installTime = Date.now();
          await Preferences.set({ 
            key: 'app_install_time', 
            value: installTime.toString() 
          });
        } else {
          installTime = parseInt(appInstallTime.value);
        }
        
        // Only count messages received after app install as unread
        const newMessagesCount = smsList.filter(sms => 
          sms.type === 'received' && 
          new Date(sms.timestamp).getTime() > installTime
        ).length;
        
        // Smart unread counting with 5-minute window to prevent infinite incrementing
        let unreadCount: number;
        if (conversationExists) {
          // Check 5-minute window for existing conversations
          const lastReadTime = existing?.lastReadTime || 0;
          const timeSinceLastRead = Date.now() - lastReadTime;
          const shouldIncrement = timeSinceLastRead > 300000; // 5 minutes
          
          if (shouldIncrement) {
            unreadCount = (existing?.unreadCount || 0) + newMessagesCount;
          } else {
            // User read recently, don't increment
            unreadCount = existing?.unreadCount || 0;
          }
        } else {
          // New conversation - count all received messages
          unreadCount = newMessagesCount;
        }

        await setDoc(convRef, {
          id: convId,
          name: isCbeSms ? 'CBE' : contactMatch?.name || existing?.name || representative.phone,
          phone: representative.phone,
          avatar:
            existing?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              avatarSeed
            )}&backgroundColor=${encodeURIComponent(toDicebearColor(avatarColor))}`,
          lastMessage,
          lastMessageTime: lastDate,
          unreadCount: unreadCount,
          lastImportTime: Date.now(),
          isArchived: false,
          isSpam: false,
          isPinned: existing?.isPinned || false,
          isBank: isCbeSms,
          participants: [user.uid, phoneKey],
        }, { merge: true });

        const msgsRef = collection(db, 'users', user.uid, 'conversations', convId, 'messages');
        for (let i = 0; i < smsList.length; i += IMPORT_CHUNK_SIZE) {
          const chunk = smsList.slice(i, i + IMPORT_CHUNK_SIZE);
          await Promise.all(
            chunk.map((sms) => {
              const smsId = sms.id ? String(sms.id) : createLocalId();
              return setDoc(doc(msgsRef, smsId), {
                id: smsId,
                text: sms.text || '',
                sender: sms.type === 'sent' ? 'me' : 'them',
                senderId: sms.type === 'sent' ? user.uid : phoneKey,
                timestamp: new Date(sms.timestamp || Date.now()).toISOString(),
                status: sms.type === 'sent' ? 'read' : 'delivered',
              }, { merge: true });
            })
          );
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      isImportingRef.current = false;
    }
  }, [user, db]);

  useEffect(() => {
    if (!user || !db) return;
    const importKey = `${AUTO_IMPORT_KEY}_${user.uid}`;
    if (localStorage.getItem(importKey) === 'true') return;

    const runAutoImport = async () => {
      try {
        localStorage.setItem(importKey, 'true');
        // Trigger contact permission early so the app can map phone numbers to names.
        await requestContactPermission();
      } catch {}

      try {
        const oldMessages = await fetchOldMessages();
        if (oldMessages.length > 0) {
          await handleImportOldMessages(oldMessages);
        }
      } catch (e) {
        console.warn('Auto SMS import failed:', e);
        localStorage.removeItem(importKey);
      }
    };

    void runAutoImport();
  }, [user, db, handleImportOldMessages]);

  // Poll SMS provider periodically so newly received messages appear in conversations.
  useEffect(() => {
    if (!user || !db) return;

    const poll = async () => {
      try {
        console.log('SMS polling: Checking for new messages...');
        const oldMessages = await fetchOldMessages();
        console.log('SMS polling: Found', oldMessages.length, 'messages');
        
        // Get last poll time to filter only truly new messages
        const lastPollTime = await Preferences.get({ key: 'last_sms_poll_time' });
        const pollTime = parseInt(lastPollTime.value || '0');
        
        // Filter only messages newer than last poll time
        const trulyNewMessages = oldMessages.filter(sms => 
          new Date(sms.timestamp).getTime() > pollTime
        );
        
        console.log('SMS polling: Truly new messages:', trulyNewMessages.length);
        
        if (trulyNewMessages.length > 0) {
          console.log('SMS polling: Importing', trulyNewMessages.length, 'new messages');
          await handleImportOldMessages(trulyNewMessages);
          console.log('SMS polling: Successfully imported new messages');
        } else {
          console.log('SMS polling: No new messages found');
        }
        
        // Update last poll time
        await Preferences.set({ 
          key: 'last_sms_poll_time', 
          value: Date.now().toString() 
        });
      } catch (e) {
        console.error('SMS polling failed:', e);
      }
    };

    const id = setInterval(() => {
      void poll();
    }, SMS_POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [user, db, handleImportOldMessages]);

  // CBE Message Handler - Check for broadcast notifications
  useEffect(() => {
    const checkCbeMessages = async () => {
      try {
        // Check for pending notifications
        const { value: pendingNotification } = await Preferences.get({ key: 'pending_notification' });
        const { value: notificationTime } = await Preferences.get({ key: 'notification_time' });
        
        if (pendingNotification && notificationTime) {
          const timeDiff = Date.now() - parseInt(notificationTime);
          
          // Only show if notification is recent (within 5 seconds)
          if (timeDiff < 5000) {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: Date.now(),
                  title: 'CBE',
                  body: pendingNotification,
                  schedule: { at: new Date() },
                  sound: 'default'
                }
              ]
            });
            
            console.log('CBE notification displayed:', pendingNotification);
            
            // Clear pending notification
            await Preferences.remove({ key: 'pending_notification' });
            await Preferences.remove({ key: 'notification_time' });
          }
        }
        
        // Check for unprocessed CBE messages
        const { value: cbeMessages } = await Preferences.get({ key: 'messages' });
        
        if (cbeMessages && cbeMessages !== '[]') {
          const messages = JSON.parse(cbeMessages);
          const unprocessedMessages = messages.filter((msg: any) => !msg.processed);
          
          for (const message of unprocessedMessages) {
            // Check if this transaction already exists in Firestore
            const existingTransaction = await checkDuplicateTransaction(message.refNo || message.id);
            
            if (!existingTransaction) {
              await handleCbeMessage(message);
              
              // Mark as processed
              message.processed = true;
            } else {
              console.log('Duplicate CBE transaction detected, skipping:', message.refNo);
              message.processed = true; // Mark as processed to avoid rechecking
            }
          }
          
          // Update processed messages
          await Preferences.set({
            key: 'messages',
            value: JSON.stringify(messages)
          });
        }
      } catch (error) {
        console.error('Error checking CBE messages:', error);
      }
    };

    // Check immediately on app start
    checkCbeMessages();
    
    // Set up periodic checking
    const interval = setInterval(checkCbeMessages, 2000);
    
    return () => clearInterval(interval);
  }, [user, db]);

  const checkDuplicateTransaction = async (refNo: string) => {
    if (!user || !db || !refNo) return false;
    
    try {
      // For mock Firebase, check localStorage directly
      const existingData = localStorage.getItem(`users_${user.uid}_conversations_CBE_NOTIFICATIONS_messages`);
      if (existingData) {
        const messages = JSON.parse(existingData);
        return messages.some((msg: any) => 
          msg.transactionData && msg.transactionData.refNo === refNo
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicate transaction:', error);
      return false;
    }
  };

  const handleCbeMessage = async (cbeMessage: any) => {
    if (!user || !db) return;
    
    const cbeConversationId = 'CBE_NOTIFICATIONS';
    const convRef = doc(db, 'users', user.uid, 'conversations', cbeConversationId);
    const msgsRef = collection(db, 'users', user.uid, 'conversations', cbeConversationId, 'messages');
    
    // Create CBE conversation if it doesn't exist
    const cbeConv = {
      id: cbeConversationId,
      name: 'CBE',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cbe&backgroundColor=FF6B35',
      lastMessage: `ETB ${cbeMessage.amount}`,
      lastMessageTime: new Date(cbeMessage.timestamp),
      unreadCount: 1,
      isArchived: false,
      isSpam: false,
      isPinned: true,
      isBank: true,
      participants: [user.uid, 'cbe']
    };
    
    await setDoc(convRef, cbeConv, { merge: true });
    
    // Add CBE message
    const msgId = createLocalId();
    const message = {
      id: msgId,
      text: cbeMessage.text,
      sender: 'them',
      senderId: 'cbe',
      timestamp: new Date(cbeMessage.timestamp),
      status: 'delivered',
      isTransaction: true,
      transactionData: cbeMessage
    };
    
    await setDoc(doc(msgsRef, msgId), message);
    
    // Phase 4: Smart New Message Handling with 5-minute window
    const convDoc = await getDoc(convRef);
    const convData = convDoc.exists() ? convDoc.data() as any : {};
    const currentUnreadCount = convData?.unreadCount || 0;
    const lastReadTime = convData?.lastReadTime || 0;
    
    // Only increment if user hasn't opened conversation recently (5-minute window)
    const timeSinceLastRead = Date.now() - lastReadTime;
    const shouldIncrement = timeSinceLastRead > 300000; // 5 minutes
    
    const newUnreadCount = shouldIncrement ? currentUnreadCount + 1 : currentUnreadCount;
    
    console.log('CBE message - Time since last read:', timeSinceLastRead, 'Should increment:', shouldIncrement);
    console.log('Updating CBE unread count from', currentUnreadCount, 'to', newUnreadCount);
    
    await updateDoc(convRef, {
      unreadCount: newUnreadCount,
      lastMessage: `ETB ${cbeMessage.amount}`,
      lastMessageTime: new Date(cbeMessage.timestamp)
    });
    
    console.log('CBE message saved to conversation:', cbeMessage.text);
  };

  const handleSelectConversation = async (id: string, contactName?: string) => {
    if (!user) {
      console.warn("No user logged in, cannot select conversation");
      return;
    }

    console.log("Selecting conversation:", id, contactName);

    if (id === 'Gemini' && db) {
      const existing = conversations.find(c => c.id === 'Gemini');
      if (!existing) {
        console.log("Gemini conversation not found, creating...");
        const convRef = doc(db, 'users', user.uid, 'conversations', 'Gemini');
        const geminiConv = {
          id: 'Gemini',
          name: 'Gemini',
          avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v2_dark_400.png',
          lastMessage: 'Hi! I\'m Gemini. How can I help you today?',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0,
          isArchived: false,
          isSpam: false,
          isPinned: false,
          isAi: true,
          participants: [user.uid, 'gemini']
        };
        
        try {
          await setDoc(convRef, geminiConv);
          
          // Add initial message
          const msgsRef = collection(db, 'users', user.uid, 'conversations', 'Gemini', 'messages');
          const msgId = createLocalId();
          await setDoc(doc(msgsRef, msgId), {
            id: msgId,
            text: 'Hi! I\'m Gemini. How can I help you today?',
            sender: 'them',
            senderId: 'gemini',
            timestamp: serverTimestamp(),
            status: 'delivered'
          });
          console.log("Gemini conversation created successfully");
        } catch (e: any) {
          console.error("Error creating Gemini conversation:", e);
          handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/conversations/Gemini`);
        }
      }
    } else if (db && !conversations.find(c => c.id === id)) {
      // Create new conversation for contact
      console.log("Creating new conversation for contact:", id, contactName);
      const convRef = doc(db, 'users', user.uid, 'conversations', id);
      const newConv = {
        id: id,
        name: contactName || id,
        avatar: '/2.png',
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        isArchived: false,
        isSpam: false,
        isPinned: false,
        isAi: false,
        phone: id,
        participants: [user.uid, id]
      };
      
      try {
        await setDoc(convRef, newConv);
        console.log("Contact conversation created successfully");
      } catch (e: any) {
        console.error("Error creating contact conversation:", e);
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/conversations/${id}`);
      }
    }

    setActiveConversationId(id);
    setView('chat');
    
    if (db) {
      // Phase 3: Proper Read Tracking - mark all messages as read
      const convRef = doc(db, 'users', user.uid, 'conversations', id);
      const msgsRef = collection(db, 'users', user.uid, 'conversations', id, 'messages');
      
      try {
        // Get all messages in this conversation
        const messagesSnapshot = await getDocs(msgsRef);
        
        // Mark all delivered messages as read
        for (const docSnap of messagesSnapshot.docs) {
          const messageData = docSnap.data() as any;
          if (messageData.status === 'delivered') {
            const messageRef = doc(db, 'users', user.uid, 'conversations', id, 'messages', docSnap.id);
            await updateDoc(messageRef, { status: 'read' });
          }
        }
        
        // Reset conversation state
        await updateDoc(convRef, { 
          unreadCount: 0,
          lastReadTime: Date.now(),
          lastImportTime: Date.now()
        });
      } catch (e: any) {
        console.warn("Error updating read status:", e);
        // Fallback: just reset unread count
        updateDoc(convRef, { 
          unreadCount: 0,
          lastReadTime: Date.now()
        }).catch((err: any) => {
          console.warn("Error updating unread count:", err);
        });
      }
    }
  };

  const handleDeleteConversations = async (ids: string[]) => {
    if (!user || !db) return;
    if (confirm(`Delete ${ids.length} conversation(s)? This cannot be undone.`)) {
      for (const id of ids) {
        const convRef = doc(db, 'users', user.uid, 'conversations', id);
        await deleteDoc(convRef).catch((e: any) => handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/conversations/${id}`));
      }
    }
  };

  const handlePinConversations = (ids: string[]) => {
    if (!user || !db) return;
    ids.forEach(id => {
      const conv = conversations.find(c => c.id === id);
      if (conv) {
        const convRef = doc(db, 'users', user.uid, 'conversations', id);
        updateDoc(convRef, { isPinned: !conv.isPinned }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/conversations/${id}`));
      }
    });
  };

  const handleArchiveConversations = (ids: string[]) => {
    if (!user || !db) return;
    ids.forEach(id => {
      const convRef = doc(db, 'users', user.uid, 'conversations', id);
      updateDoc(convRef, { isArchived: true }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/conversations/${id}`));
    });
  };

  const handleSendMessage = async (text?: string, img?: string, audio?: string) => {
    if (!user || !activeConversationId || !db) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    const isCbeConv = currentConv?.id === 'CBE_NOTIFICATIONS' || isCbePhoneNumber(currentConv?.phone, cbePhoneNumber) || currentConv?.name === 'CBE';
    if (isCbeConv) {
      console.log('Attempt to send message blocked for CBE conversation');
      return;
    }

    console.log('handleSendMessage called:', { text, hasImage: !!img, hasAudio: !!audio });

    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const convRef = doc(db, 'users', user.uid, 'conversations', activeConversationId);
    const msgsRef = collection(db, 'users', user.uid, 'conversations', activeConversationId, 'messages');

    const msgId = createLocalId();
    const newMessage = {
      id: msgId,
      text: text || '',
      image: img || '',
      audio: audio || '',
      sender: 'me',
      senderId: user.uid,
      timestamp: serverTimestamp(),
      status: 'sent'
    };

    try {
      setIsSyncing(true);
      
      // Check if we need to send SMS for non-AI conversations with phone numbers
      if (text && activeConv?.phone && !activeConv.isAi) {
        // Check if app is default SMS app
        const isDefault = await checkDefaultSmsApp();
        
        if (!isDefault) {
          console.log('App is not default SMS app, showing dialog');
          setShowDefaultSmsDialog(true);
          setIsSyncing(false);
          return;
        }
        
        console.log('Attempting to send SMS to:', activeConv.phone, 'Message:', text);
        try {
          await sendDeviceSms(activeConv.phone, text);
          console.log('SMS sent successfully to:', activeConv.phone);
        } catch (smsError: any) {
          console.error('Failed to send SMS:', smsError);
          // Continue with saving to Firebase even if SMS fails
        }
      }
      
      await setDoc(doc(msgsRef, msgId), newMessage);
      await updateDoc(convRef, {
        lastMessage: text || (img ? 'Sent image' : (audio ? 'Voice message' : '')),
        lastMessageTime: serverTimestamp(),
        unreadCount: 0
      });
      
      console.log('Message saved to Firebase successfully');
    } catch (e: any) {
      console.error('Error in handleSendMessage:', e);
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/conversations/${activeConversationId}/messages`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReceiveMessage = async (id: string, text: string) => {
    if (!user || !db) return;
    
    // Prevent duplicate responses
    const recentResponsesKey = `recent_gemini_response_${id}`;
    const lastResponse = localStorage.getItem(recentResponsesKey);
    const now = Date.now();
    
    if (lastResponse && (now - parseInt(lastResponse)) < 10000) {
      console.log('Preventing duplicate Gemini response');
      return;
    }
    
    localStorage.setItem(recentResponsesKey, now.toString());
    
    // Add 4-second delay for testing unread feature
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const convRef = doc(db, 'users', user.uid, 'conversations', id);
    const msgsRef = collection(db, 'users', user.uid, 'conversations', id, 'messages');

    const msgId = createLocalId();
    const newMessage = {
      id: msgId,
      text,
      sender: 'them',
      senderId: id,
      timestamp: serverTimestamp(),
      status: 'read'
    };

    try {
      await setDoc(doc(msgsRef, msgId), newMessage);
      
      // Get current conversation to increment unread count properly
      const convDoc = await getDoc(convRef);
      const currentUnreadCount = convDoc.exists() ? convDoc.data()?.unreadCount || 0 : 0;
      const newUnreadCount = currentUnreadCount + 1;
      
      console.log('Updating unread count from', currentUnreadCount, 'to', newUnreadCount, 'for conversation:', id);
      await updateDoc(convRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadCount: newUnreadCount
      });
      console.log('Unread count updated successfully');
    } catch (e: any) {
      console.error('Error updating unread count:', e);
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/conversations/${id}/messages`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b141b]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a8c7fa]"></div>
          <p className="text-[#9aa0a6] text-sm">Loading Messages...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b141b]">
        <div className="flex flex-col items-center space-y-4 px-6 text-center">
          <svg className="w-12 h-12 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#e3e3e3] text-sm">Connection Error</p>
          <p className="text-[#9aa0a6] text-xs">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#a8c7fa] text-[#062e6f] font-medium rounded-full text-sm active:scale-95 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-black overflow-hidden">
        <div className="relative w-full h-full max-w-[480px] bg-[#0b141b] overflow-hidden lg:h-[95vh] lg:rounded-[32px] lg:border lg:border-gray-800 shadow-2xl transition-all">
          <LoginView />
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const userAvatar = generateUserAvatar(user.email || '', user.uid);
  const activeAccount: UserAccount = {
    id: user.uid,
    name: getUserDisplayName(user.email || ''),
    email: user.email || '',
    avatar: userAvatar.url,
    color: userAvatar.color
  };

  return (
    <div className="flex justify-center items-center h-screen w-full bg-black overflow-hidden">
      <div className="relative w-full h-full max-w-[480px] bg-[#0b141b] overflow-hidden lg:h-[95vh] lg:rounded-[32px] lg:border lg:border-gray-800 shadow-2xl transition-all">
        {view === 'list' && (
          <ConversationList 
            conversations={conversations.filter(c => !c.isArchived && !c.isSpam)} 
            onSelect={handleSelectConversation}
            onOpenProfile={() => setView('profile')}
            onStartNewChat={() => { void openNewChat(); }}
            onOpenContacts={() => setView('contacts')}
            isDefaultApp={isDefaultApp}
            accountEmail={activeAccount.email}
            accountName={activeAccount.name}
            onSetDefault={() => setShowDefaultPrompt(true)}
            onDelete={handleDeleteConversations}
            onPin={handlePinConversations}
            onArchive={handleArchiveConversations}
            isSyncing={isSyncing}
            cbePhoneNumber={cbePhoneNumber}
            isCbeNumber={(phone?: string) => isCbePhoneNumber(phone, cbePhoneNumber)}
          />
        )}
        {view === 'chat' && (
          activeConversation ? (
            <ChatView 
              conversation={activeConversation} 
              onBack={() => setView('list')}
              onSendMessage={handleSendMessage}
              onReceiveMessage={handleReceiveMessage}
              cbePhoneNumber={cbePhoneNumber}
              isCbeNumber={(phone?: string) => isCbePhoneNumber(phone, cbePhoneNumber)}
            />
          ) : (
            <div className="flex-1 bg-[#0b141b] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a8c7fa]"></div>
            </div>
          )
        )}
        {view === 'newChat' && (
          <NewChatView 
            contacts={hasContactPermission ? realContacts : []}
            hasPermission={hasContactPermission}
            onGrantPermission={requestContactPermission}
            onBack={() => setView('list')}
            onSelectContact={async (c) => {
               const existing = conversations.find(conv => conv.id === c.id || conv.phone === c.phone);
               if (existing) {
                 handleSelectConversation(existing.id);
               } else if (db) {
                 const newId = c.id;
                 const convRef = doc(db, 'users', user.uid, 'conversations', newId);
                 const newConvData = {
                   id: newId,
                   name: c.name,
                   phone: c.phone,
                   avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}&backgroundColor=${c.color.replace('#','')}`,
                   lastMessage: '',
                   lastMessageTime: serverTimestamp(),
                   unreadCount: 0,
                   isArchived: false,
                   isSpam: false,
                   isPinned: false,
                   participants: [user.uid, newId]
                 };
                 await setDoc(convRef, newConvData).catch((e: any) => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/conversations/${newId}`));
                 handleSelectConversation(newId);
               }
            }}
          />
        )}
        {view === 'profile' && (
          <ProfileOverlay 
            activeAccount={activeAccount}
            onLogout={logout}
            onClose={() => setView('list')} 
            onNavigateToDetail={() => setView('profileDetail')} 
            onNavigateToArchived={() => setView('archived')} 
            onNavigateToSpam={() => setView('spam')} 
            onNavigateToDevicePairing={() => setView('devicePairing')} 
            onNavigateToSettings={() => setView('settings')} 
            onNavigateToHelp={() => setView('help')} 
            onMarkAllAsRead={() => { 
              conversations.forEach(c => {
                if (db) {
                  const convRef = doc(db, 'users', user.uid, 'conversations', c.id);
                  updateDoc(convRef, { unreadCount: 0 }).catch((e: any) => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/conversations/${c.id}`));
                }
              });
              setView('list'); 
            }} 
          />
        )}
        {view === 'profileDetail' && <ProfileDetailView onBack={() => setView('profile')} email={activeAccount.email} />}
        {view === 'archived' && <ArchivedView conversations={conversations.filter(c => c.isArchived)} onBack={() => setView('list')} onSelect={handleSelectConversation} />}
        {view === 'spam' && <SpamView conversations={conversations.filter(c => c.isSpam)} onBack={() => setView('list')} onSelect={handleSelectConversation} />}
        {view === 'devicePairing' && <DevicePairingView onBack={() => setView('profile')} />}
        {view === 'settings' && (
          <EnhancedSettingsView
            onClose={() => setView('profile')}
            onImportMessages={handleImportOldMessages}
          />
        )}
        {view === 'help' && <HelpView onBack={() => setView('profile')} />}
        {view === 'systemSettings' && <SystemSettingsView onBack={() => setView('list')} onSetDefault={(val) => { setIsDefaultApp(val); setShowDefaultPrompt(false); setView('list'); }} isDefault={isDefaultApp} />}
        {view === 'contacts' && (
          <ContactsManager 
            onSelectContact={(contact) => {
              // Find or create conversation for this contact
              const phoneNumber = contact.phones?.[0]?.number;
              const contactName = contact.name?.display;
              if (phoneNumber) {
                handleSelectConversation(phoneNumber, contactName);
              }
            }}
            onBack={() => setView('list')}
          />
        )}

        {/* Default SMS Dialog */}
        <DefaultSmsDialog
          isOpen={showDefaultSmsDialog}
          onClose={() => setShowDefaultSmsDialog(false)}
          onSetDefault={() => {
            setShowDefaultSmsDialog(false);
            promptSetDefaultSmsApp();
          }}
          onSkip={() => setShowDefaultSmsDialog(false)}
        />

        {showDefaultPrompt && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 px-8 animate-fade-in">
             <div className="bg-[#1f2933] rounded-[28px] p-6 w-full shadow-2xl animate-slide-up border border-gray-700/50">
                <h3 className="text-[22px] font-normal text-white mb-4">Change SMS app?</h3>
                <p className="text-[14px] text-gray-300 leading-relaxed mb-8">Use Messages as your default SMS app?</p>
                <div className="flex justify-end space-x-2">
                   <button onClick={() => setShowDefaultPrompt(false)} className="px-5 py-2.5 text-[#a8c7fa] font-medium rounded-full active:bg-white/5">Cancel</button>
                   <button onClick={() => { setIsDefaultApp(true); setShowDefaultPrompt(false); }} className="px-6 py-2.5 bg-[#a8c7fa] text-[#062e6f] font-medium rounded-full shadow-lg active:scale-95 transition-all">Set as default</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

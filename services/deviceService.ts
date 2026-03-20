import { Contacts } from '@capacitor-community/contacts';
import { Capacitor, registerPlugin } from '@capacitor/core'

export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

export interface DeviceSMS {
  id: string;
  phone: string;
  text: string;
  timestamp: string;
  type: 'sent' | 'received';
}

interface SMSPluginType {
  getMessages: (options?: { limit?: number }) => Promise<{
    count?: number;
    messages?: Array<{
      id?: string | number;
      phone?: string;
      text?: string;
      timestamp?: string | number;
      type?: string;
    }>;
  }>;
  getStatus: () => Promise<{
    permission?: string;
    contactsPermission?: string;
    sendPermission?: string;
    appPackage?: string;
    defaultSmsPackage?: string;
    isDefaultSmsApp?: boolean;
    smsCount?: number;
  }>;
  getContacts: () => Promise<{
    contacts?: Array<{
      name?: string;
      phone?: string;
    }>;
    count?: number;
  }>;
  sendSms: (options: { phone: string; text: string }) => Promise<{ ok?: boolean }>;
}

const SMSPlugin = registerPlugin<SMSPluginType>('SMSPlugin');
interface SmsReaderPluginType {
  read: (options: { skip: number; take: number }) => Promise<{
    items?: Array<{
      id?: string | number;
      address?: string;
      body?: string;
      date?: string | number;
      type?: number;
    }>;
  }>;
}
const LegacySmsReader = registerPlugin<SmsReaderPluginType>('SmsReader');

type ContactPermissionStatus = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';
export interface SmsDebugInfo {
  nativePlatform: boolean;
  smsPluginAvailable: boolean;
  legacySmsReaderAvailable: boolean;
  contactsPluginAvailable: boolean;
  smsPermission?: string;
  isDefaultSmsApp?: boolean;
  appPackage?: string;
  defaultSmsPackage?: string;
  smsCount?: number;
  statusError?: string;
}

export const getSmsDebugInfo = async (): Promise<SmsDebugInfo> => {
  const base: SmsDebugInfo = {
    nativePlatform: Capacitor.isNativePlatform(),
    smsPluginAvailable: Capacitor.isPluginAvailable('SMSPlugin'),
    legacySmsReaderAvailable: Capacitor.isPluginAvailable('SmsReader'),
    contactsPluginAvailable: Capacitor.isPluginAvailable('Contacts'),
  };

  try {
    if (base.smsPluginAvailable) {
      const status = await SMSPlugin.getStatus();
      return {
        ...base,
        smsPermission: status.permission,
        isDefaultSmsApp: !!status.isDefaultSmsApp,
        appPackage: status.appPackage || '',
        defaultSmsPackage: status.defaultSmsPackage || '',
        smsCount: status.smsCount,
      };
    }
  } catch (err) {
    return {
      ...base,
      statusError: err instanceof Error ? err.message : String(err),
    };
  }
  return base;
};

export const checkContactPermission = async (): Promise<ContactPermissionStatus> => {
  // Prefer native status because contacts can be granted via SMSPlugin permission flow.
  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('SMSPlugin')) {
      const status = await SMSPlugin.getStatus();
      const nativeState = String(status.contactsPermission || '').toLowerCase();
      if (nativeState === 'granted') return 'granted';
      if (nativeState === 'denied') return 'denied';
    }
  } catch {}

  try {
    const result = await Contacts.checkPermissions();
    return (result.contacts as ContactPermissionStatus) || 'prompt';
  } catch {
    return 'prompt';
  }
};

export const requestContactPermission = async (): Promise<boolean> => {
  // Request through native plugin first, then fallback to community contacts plugin.
  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('SMSPlugin')) {
      await SMSPlugin.getContacts();
      const status = await SMSPlugin.getStatus();
      if (String(status.contactsPermission || '').toLowerCase() === 'granted') {
        return true;
      }
    }
  } catch {}

  try {
    const result = await Contacts.requestPermissions();
    return result.contacts === 'granted';
  } catch {
    return false;
  }
};

export const fetchDeviceContacts = async (): Promise<DeviceContact[]> => {
  let raw: any[] = [];

  // 1) Try native plugin first. It can trigger its own permission request path.
  try {
    const nativeResult = await SMSPlugin.getContacts();
    raw = (nativeResult.contacts || []).map((c: any, i: number) => ({
      contactId: `native_${i}`,
      name: { display: c.name || '' },
      phones: [{ number: c.phone || '' }],
    }));
  } catch {}

  // 2) Fallback to contacts plugin if native path returned nothing.
  if (raw.length === 0) {
    let permission = await checkContactPermission();
    if (permission !== 'granted') {
      const granted = await requestContactPermission();
      permission = granted ? 'granted' : 'denied';
    }
    if (permission !== 'granted') {
      throw new Error('Contacts permission denied. Enable Contacts permission in App Settings.');
    }

    const contactsResult = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
      },
    });
    raw = contactsResult.contacts || [];
  }
  const seen = new Set<string>();
  const mapped: DeviceContact[] = [];

  for (const c of raw) {
    const phone = c?.phones?.[0]?.number;
    if (!phone) continue;

    const normalized = String(phone).replace(/\D/g, '');
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);

    const displayName =
      c?.name?.display ||
      [c?.name?.given, c?.name?.family].filter(Boolean).join(' ').trim() ||
      String(phone);

    mapped.push({
      id: c.contactId || Math.random().toString(36).slice(2, 10),
      name: displayName,
      phone: String(phone),
    });
  }

  if (mapped.length === 0) {
    throw new Error('No phone contacts were returned by the device.');
  }

  return mapped;
};

export const checkDefaultSmsApp = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const status = await SMSPlugin.getStatus();
    return !!status.isDefaultSmsApp;
  } catch (err) {
    console.warn('Failed to check default SMS app status:', err);
    return false;
  }
};

export const promptSetDefaultSmsApp = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Simple approach: open app settings for user to manually set as default
    console.log('Please set this app as default SMS app in Settings');
  } catch (err) {
    console.warn('Failed to prompt for default SMS app:', err);
  }
};

export const sendDeviceSms = async (phone: string, text: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('SMS sending works only on Android devices.');
  }
  await SMSPlugin.sendSms({ phone, text });
};



export const fetchOldMessages = async (): Promise<DeviceSMS[]> => {

  if (!Capacitor.isNativePlatform()) {
    throw new Error('SMS access only works on Android devices.')
  }

  const failures: string[] = [];

  try {
    console.log('SMS Plugin: Attempting to fetch messages...');
    const result = await SMSPlugin.getMessages({ limit: 3000 });
    console.log('SMS Plugin: Raw result:', result);
    console.log('SMS Plugin: Messages count:', result.messages?.length || 0);
    
    const messages: DeviceSMS[] = (result.messages || []).map((m, index) => {
      console.log(`SMS Plugin: Message ${index}:`, {
        id: m.id,
        phone: m.phone,
        text: m.text?.substring(0, 50) + '...',
        type: m.type,
        timestamp: m.timestamp,
        timestampType: typeof m.timestamp
      });
      
      let timestamp: string;
      if (typeof m.timestamp === 'number') {
        // Handle milliseconds vs seconds
        if (m.timestamp < 10000000000) {
          // Likely seconds, convert to milliseconds
          timestamp = new Date(m.timestamp * 1000).toISOString();
        } else {
          // Likely milliseconds
          timestamp = new Date(m.timestamp).toISOString();
        }
      } else if (typeof m.timestamp === 'string') {
        timestamp = new Date(m.timestamp).toISOString();
      } else {
        timestamp = new Date().toISOString();
      }
      
      return {
        id: String(m.id ?? index),
        phone: m.phone || 'Unknown',
        text: m.text || '',
        timestamp: timestamp,
        type: m.type === 'sent' ? 'sent' : 'received'
      };
    });
    
    const sentMessages = messages.filter(m => m.type === 'sent');
    const receivedMessages = messages.filter(m => m.type === 'received');
    
    console.log('SMS Plugin: Processed messages:', {
      total: messages.length,
      sent: sentMessages.length,
      received: receivedMessages.length
    });
    
    if (messages.length > 0) return messages;
    failures.push('SMSPlugin returned 0 messages');
  } catch (err) {
    failures.push(`SMSPlugin failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    console.log('Legacy SMS Reader: Attempting to fetch messages...');
    const legacy = await LegacySmsReader.read({ skip: 0, take: 3000 });
    console.log('Legacy SMS Reader: Raw result:', legacy);
    console.log('Legacy SMS Reader: Items count:', legacy.items?.length || 0);
    
    const mapped: DeviceSMS[] = (legacy.items || []).map((m, index) => {
      console.log(`Legacy SMS Reader: Message ${index}:`, {
        id: m.id,
        address: m.address,
        body: m.body?.substring(0, 50) + '...',
        type: m.type,
        date: m.date,
        dateType: typeof m.date
      });
      
      let timestamp: string;
      if (typeof m.date === 'number') {
        // Handle milliseconds vs seconds
        if (m.date < 10000000000) {
          // Likely seconds, convert to milliseconds
          timestamp = new Date(m.date * 1000).toISOString();
        } else {
          // Likely milliseconds
          timestamp = new Date(m.date).toISOString();
        }
      } else if (typeof m.date === 'string') {
        timestamp = new Date(m.date).toISOString();
      } else {
        timestamp = new Date().toISOString();
      }
      
      return {
        id: String(m.id ?? index),
        phone: m.address || 'Unknown',
        text: m.body || '',
        timestamp: timestamp,
        type: Number(m.type) === 2 ? 'sent' : 'received',
      };
    });
    
    const sentMessages = mapped.filter(m => m.type === 'sent');
    const receivedMessages = mapped.filter(m => m.type === 'received');
    
    console.log('Legacy SMS Reader: Processed messages:', {
      total: mapped.length,
      sent: sentMessages.length,
      received: receivedMessages.length
    });
    
    if (mapped.length > 0) return mapped;
    failures.push('SmsReader returned 0 messages');
  } catch (err) {
    failures.push(`SmsReader failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new Error(`Failed to read SMS messages. ${failures.join(' | ')}`);
}

export interface SimInfo {
  phoneNumber?: string;
  carrierName?: string;
  countryIso?: string;
  simState?: string;
}

export const getSimInfo = async (): Promise<SimInfo> => {
  if (!Capacitor.isNativePlatform()) {
    return {};
  }

  try {
    // Use Capacitor's built-in device plugin if available
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    return {
      phoneNumber: undefined, // Device.getInfo() doesn't provide phone number
      carrierName: undefined,
      countryIso: undefined,
      simState: 'unknown',
    };
  } catch (err) {
    console.warn('Device plugin not available, SIM info not accessible:', err);
    return {};
  }
};

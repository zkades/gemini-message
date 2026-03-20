
export interface Message {
  id: string;
  text?: string;
  image?: string;
  audio?: string;
  sender: 'me' | 'them';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'sending';
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
  isAi?: boolean;
  phone?: string;
  isArchived?: boolean;
  isSpam?: boolean;
  isPinned?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  color: string;
  isSystemContact?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color?: string;
}

export type View = 'list' | 'chat' | 'newChat' | 'profile' | 'profileDetail' | 'archived' | 'spam' | 'devicePairing' | 'settings' | 'help' | 'systemSettings' | 'contacts';

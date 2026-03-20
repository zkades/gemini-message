
// Mock Firebase implementation using localStorage
// This replaces the actual Firebase SDK to allow the app to work offline/standalone

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: any;
  providerData: any[];
  refreshToken: string;
  tenantId: string | null;
  delete: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<any>;
  reload: () => Promise<void>;
  toJSON: () => object;
  phoneNumber: string | null;
  providerId: string;
}

// --- Types ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

// --- Mock State ---
const STORAGE_KEY = 'gemini_messages_mock_db';
const AUTH_KEY = 'gemini_messages_mock_auth';

// Helper to get/set data from localStorage
const getLocalDB = () => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const setLocalDB = (data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Mock Auth ---
const hashEmail = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const buildUserFromEmail = (email: string): User => {
  const clean = email.trim().toLowerCase();
  const uid = `local-${hashEmail(clean)}`;
  return {
    uid,
    displayName: clean,
    email: clean,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'mock-email'
  } as any;
};

const mockUser: User = buildUserFromEmail('user@example.com');

export const auth = {
  get currentUser() {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  }
};

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  // Get current user immediately
  const currentUser = auth.currentUser;
  
  // Call callback with current user (if any)
  setTimeout(() => {
    callback(currentUser);
  }, 100);
  
  return () => {}; // Unsubscribe
};

export const signInWithGoogle = async () => {
  console.log("Mocking Google Sign-In...");
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser));
      resolve({ user: mockUser });
      window.location.reload(); // Reload to trigger auth state change
    }, 1000);
  });
};

export const signInWithEmail = async (email: string) => {
  console.log("Mocking Email Sign-In with:", email);
  const user = buildUserFromEmail(email);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Save to main auth storage
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      console.log('Firebase - Saved user to auth storage:', user);
      
      // Also save backup
      localStorage.setItem('user_email_backup', email);
      console.log('Firebase - Saved email backup:', email);
      
      resolve({ user });
      
      // Reload to trigger auth state change
      window.location.reload();
    }, 300);
  });
};

export const logout = async () => {
  localStorage.removeItem(AUTH_KEY);
  window.location.reload();
};

// --- Mock Firestore ---
export const db = { type: 'mock-db' };

export const collection = (db: any, ...pathSegments: string[]) => {
  return { path: pathSegments.join('/') };
};

export const doc = (dbOrCollection: any, ...pathSegments: string[]) => {
  const path = dbOrCollection.path 
    ? `${dbOrCollection.path}/${pathSegments.join('/')}` 
    : pathSegments.join('/');
  return { path };
};

export const query = (collectionRef: any, ...constraints: any[]) => {
  return { ...collectionRef, constraints };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const serverTimestamp = () => new Date().toISOString();

// Helper to get data at a path
const getDataAtPath = (db: any, path: string) => {
  const parts = path.split('/');
  let current = db;
  for (const part of parts) {
    if (!current || !current[part]) return null;
    current = current[part];
  }
  return current;
};

// Helper to set data at a path
const setDataAtPath = (db: any, path: string, data: any, merge: boolean = false) => {
  const parts = path.split('/');
  let current = db;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) current[part] = {};
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  
  // Handle serverTimestamp
  const processData = (d: any): any => {
    if (d === serverTimestamp()) return new Date().toISOString();
    if (Array.isArray(d)) return d.map(processData);
    if (typeof d === 'object' && d !== null) {
      const result: any = {};
      for (const key in d) result[key] = processData(d[key]);
      return result;
    }
    return d;
  };

  const processedData = processData(data);

  if (merge && typeof processedData === 'object' && processedData !== null) {
    current[lastPart] = { ...current[lastPart], ...processedData };
  } else {
    current[lastPart] = processedData;
  }
};

// Event-based notification for reactivity
const DB_CHANGE_EVENT = 'mock-db-changed';

const notifyListeners = (path: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, { detail: { path } }));
  }
};

export const onSnapshot = (queryOrDocRef: any, callback: (snapshot: any) => void) => {
  const path = queryOrDocRef.path;
  
  const trigger = () => {
    const dbData = getLocalDB();
    const data = getDataAtPath(dbData, path);
    
    // We need to return an object that matches the Firestore snapshot interface
    const snapshot: any = {
      exists: () => !!data,
      data: () => {
        if (!data) return null;
        // Mock the toDate() method for timestamps
        const process = (d: any): any => {
          if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(d)) {
            return { toDate: () => new Date(d) };
          }
          if (Array.isArray(d)) return d.map(process);
          if (typeof d === 'object' && d !== null) {
            const res: any = {};
            for (const k in d) res[k] = process(d[k]);
            return res;
          }
          return d;
        };
        return process(data);
      },
      forEach: (cb: any) => {
        if (!data) return;
        Object.entries(data).forEach(([id, val]: [string, any]) => {
          const docSnap = {
            id,
            data: () => {
              const process = (d: any): any => {
                if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(d)) {
                  return { toDate: () => new Date(d) };
                }
                if (Array.isArray(d)) return d.map(process);
                if (typeof d === 'object' && d !== null) {
                  const res: any = {};
                  for (const k in d) res[k] = process(d[k]);
                  return res;
                }
                return d;
              };
              return process(val);
            }
          };
          cb(docSnap);
        });
      }
    };
    callback(snapshot);
  };

  const listener = (event: any) => {
    const changedPath = event.detail.path;
    // Trigger if the changed path is related to our path
    if (changedPath.startsWith(path) || path.startsWith(changedPath)) {
      trigger();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(DB_CHANGE_EVENT, listener);
  }
  
  // Initial call
  trigger();

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(DB_CHANGE_EVENT, listener);
    }
  };
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const dbData = getLocalDB();
  setDataAtPath(dbData, docRef.path, data, options?.merge);
  setLocalDB(dbData);
  if (!options?.silent) {
    notifyListeners(docRef.path);
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  const dbData = getLocalDB();
  setDataAtPath(dbData, docRef.path, data, true);
  setLocalDB(dbData);
  notifyListeners(docRef.path);
};

export const deleteDoc = async (docRef: any) => {
  const dbData = getLocalDB();
  const parts = docRef.path.split('/');
  const lastPart = parts.pop();
  const parentPath = parts.join('/');
  const parent = getDataAtPath(dbData, parentPath);
  if (parent && lastPart) {
    delete parent[lastPart];
    setLocalDB(dbData);
    notifyListeners(docRef.path);
  }
};

export const addDoc = async (collectionRef: any, data: any) => {
  const id = Math.random().toString(36).substring(7);
  const docRef = doc(collectionRef, id);
  await setDoc(docRef, { ...data, id });
  return docRef;
};

export const getDoc = async (docRef: any) => {
  const dbData = getLocalDB();
  const data = getDataAtPath(dbData, docRef.path);
  return {
    exists: () => !!data,
    data: () => data
  };
};

export const getDocs = async (queryRef: any) => {
  const dbData = getLocalDB();
  const data = getDataAtPath(dbData, queryRef.path) || {};
  const docs = Object.entries(data).map(([id, val]) => ({
    id,
    data: () => val
  }));
  return {
    forEach: (cb: any) => docs.forEach(cb),
    docs
  };
};

export const getDocFromServer = getDoc;

export const handleFirestoreError = (error: any, operation: OperationType, path: string | null) => {
  console.error(`Mock Firestore Error [${operation}] at ${path}:`, error);
};

export const googleProvider = {};

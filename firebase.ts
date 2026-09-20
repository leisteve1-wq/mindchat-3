// ============================================
// Firebase Configuration - MindChat
// ============================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Firebase configuration
// NOTE: In production, these should be environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mindchat-steveai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mindchat-steveai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mindchat-steveai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Browser does not support persistence');
    }
  });
}

// ============================================
// Authentication Functions
// ============================================

export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Create user document in Firestore
    await createUserDocument(userCredential.user, { displayName });
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('[Auth] Sign up error:', error);
    return { success: false, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await updateUserLastLogin(userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('[Auth] Sign in error:', error);
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await createUserDocument(userCredential.user);
    } else {
      await updateUserLastLogin(userCredential.user.uid);
    }
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('[Auth] Google sign in error:', error);
    return { success: false, error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Reset password error:', error);
    return { success: false, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================
// Firestore User Functions
// ============================================

const createUserDocument = async (user: FirebaseUser, additionalData: any = {}) => {
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || null,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    isAnonymous: user.isAnonymous,
    settings: {
      theme: 'dark',
      notifications: true,
      soundEnabled: true,
      voiceEnabled: false,
      saveConversations: true,
      language: 'en',
      fontSize: 'medium'
    },
    stats: {
      totalChats: 0,
      totalMoodEntries: 0,
      totalJournalEntries: 0,
      streakDays: 0,
      lastActiveDate: serverTimestamp(),
      favoriteFeatures: []
    }
  };
  
  await setDoc(userRef, userData);
  console.log('[Firestore] User document created:', user.uid);
};

const updateUserLastLogin = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
    'stats.lastActiveDate': serverTimestamp()
  });
};

export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error: any) {
    console.error('[Firestore] Get user data error:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { settings });
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Update settings error:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserStats = async (userId: string, stats: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { stats });
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Update stats error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Chat Functions
// ============================================

export const saveChatMessage = async (userId: string, sessionId: string, message: any) => {
  try {
    const messageRef = doc(collection(db, 'users', userId, 'chats', sessionId, 'messages'));
    await setDoc(messageRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    return { success: true, id: messageRef.id };
  } catch (error: any) {
    console.error('[Firestore] Save message error:', error);
    return { success: false, error: error.message };
  }
};

export const getChatMessages = async (userId: string, sessionId: string, limit_count: number = 50) => {
  try {
    const messagesQuery = query(
      collection(db, 'users', userId, 'chats', sessionId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(limit_count)
    );
    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse();
    return { success: true, data: messages };
  } catch (error: any) {
    console.error('[Firestore] Get messages error:', error);
    return { success: false, error: error.message };
  }
};

export const createChatSession = async (userId: string, title: string = 'New Chat') => {
  try {
    const sessionRef = doc(collection(db, 'users', userId, 'chats'));
    await setDoc(sessionRef, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false
    });
    return { success: true, id: sessionRef.id };
  } catch (error: any) {
    console.error('[Firestore] Create session error:', error);
    return { success: false, error: error.message };
  }
};

export const getChatSessions = async (userId: string) => {
  try {
    const sessionsQuery = query(
      collection(db, 'users', userId, 'chats'),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(sessionsQuery);
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: sessions };
  } catch (error: any) {
    console.error('[Firestore] Get sessions error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Mood Tracker Functions
// ============================================

export const saveMoodEntry = async (userId: string, entry: any) => {
  try {
    const entryRef = doc(collection(db, 'users', userId, 'moods'));
    await setDoc(entryRef, {
      ...entry,
      timestamp: serverTimestamp()
    });
    return { success: true, id: entryRef.id };
  } catch (error: any) {
    console.error('[Firestore] Save mood error:', error);
    return { success: false, error: error.message };
  }
};

export const getMoodEntries = async (userId: string, days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const moodsQuery = query(
      collection(db, 'users', userId, 'moods'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(moodsQuery);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: entries };
  } catch (error: any) {
    console.error('[Firestore] Get moods error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteMoodEntry = async (userId: string, entryId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'moods', entryId));
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Delete mood error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Journal Functions
// ============================================

export const saveJournalEntry = async (userId: string, entry: any) => {
  try {
    const entryRef = entry.id 
      ? doc(db, 'users', userId, 'journal', entry.id)
      : doc(collection(db, 'users', userId, 'journal'));
    
    await setDoc(entryRef, {
      ...entry,
      updatedAt: serverTimestamp(),
      timestamp: entry.timestamp || serverTimestamp()
    });
    return { success: true, id: entryRef.id };
  } catch (error: any) {
    console.error('[Firestore] Save journal error:', error);
    return { success: false, error: error.message };
  }
};

export const getJournalEntries = async (userId: string, limit_count: number = 50) => {
  try {
    const entriesQuery = query(
      collection(db, 'users', userId, 'journal'),
      orderBy('timestamp', 'desc'),
      limit(limit_count)
    );
    const snapshot = await getDocs(entriesQuery);
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: entries };
  } catch (error: any) {
    console.error('[Firestore] Get journal error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteJournalEntry = async (userId: string, entryId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'journal', entryId));
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Delete journal error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Community Functions
// ============================================

export const createVentPost = async (userId: string, content: string, isAnonymous: boolean) => {
  try {
    const postRef = doc(collection(db, 'community', 'vents', 'posts'));
    await setDoc(postRef, {
      userId,
      content,
      isAnonymous,
      timestamp: serverTimestamp(),
      reactions: [],
      replies: [],
      isReported: false
    });
    return { success: true, id: postRef.id };
  } catch (error: any) {
    console.error('[Firestore] Create vent error:', error);
    return { success: false, error: error.message };
  }
};

export const getVentPosts = async (limit_count: number = 20) => {
  try {
    const postsQuery = query(
      collection(db, 'community', 'vents', 'posts'),
      orderBy('timestamp', 'desc'),
      limit(limit_count)
    );
    const snapshot = await getDocs(postsQuery);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: posts };
  } catch (error: any) {
    console.error('[Firestore] Get vents error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Notification Functions
// ============================================

export const saveNotification = async (userId: string, notification: any) => {
  try {
    const notifRef = doc(collection(db, 'users', userId, 'notifications'));
    await setDoc(notifRef, {
      ...notification,
      createdAt: serverTimestamp()
    });
    return { success: true, id: notifRef.id };
  } catch (error: any) {
    console.error('[Firestore] Save notification error:', error);
    return { success: false, error: error.message };
  }
};

export const getNotifications = async (userId: string, limit_count: number = 20) => {
  try {
    const notifsQuery = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    );
    const snapshot = await getDocs(notifsQuery);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: notifications };
  } catch (error: any) {
    console.error('[Firestore] Get notifications error:', error);
    return { success: false, error: error.message };
  }
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifRef, { isRead: true });
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Mark notification read error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Analytics Functions
// ============================================

export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

export const saveAnalyticsEvent = async (userId: string, eventType: string, eventData: any) => {
  try {
    const eventRef = doc(collection(db, 'analytics', 'events', 'logs'));
    await setDoc(eventRef, {
      userId,
      eventType,
      eventData,
      timestamp: serverTimestamp(),
      sessionId: getSessionId()
    });
    return { success: true };
  } catch (error: any) {
    console.error('[Firestore] Save analytics error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// Push Notification Functions
// ============================================

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      return { success: false, error: 'Messaging not supported' };
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return { success: true, token };
    }
    return { success: false, error: 'Permission denied' };
  } catch (error: any) {
    console.error('[Messaging] Permission error:', error);
    return { success: false, error: error.message };
  }
};

export const onMessageReceived = (callback: (payload: any) => void) => {
  if (messaging) {
    return onMessage(messaging, callback);
  }
  return null;
};

// ============================================
// Helper Functions
// ============================================

let sessionId: string | null = null;

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
};

// Admin check
export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch (error) {
    return false;
  }
};

// Export Firebase instances
export { app, auth, db, storage, messaging, analytics };
export default app;

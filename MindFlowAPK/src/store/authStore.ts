// src/store/authStore.ts

import { create } from 'zustand';
import ServiceManager from '../services/serviceManager';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  actions: {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    initializeAuth: () => void;
  };
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  actions: {
    signIn: async (email: string, password: string) => {
      set({ loading: true });
      try {
        const userCredential = await ServiceManager.signInWithEmail(email, password);
        const user: User = {
          id: userCredential.uid,
          email: userCredential.email!,
          displayName: userCredential.displayName || '',
          photoURL: userCredential.photoURL || undefined,
        };
        set({ user, loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    signUp: async (email: string, password: string, displayName: string) => {
      set({ loading: true });
      try {
        const userCredential = await ServiceManager.signUpWithEmail(email, password, displayName);
        const user: User = {
          id: userCredential.uid,
          email: userCredential.email!,
          displayName: userCredential.displayName || '',
          photoURL: userCredential.photoURL || undefined,
        };
        set({ user, loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        await ServiceManager.signOut();
        set({ user: null, loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    initializeAuth: () => {
      const unsubscribe = ServiceManager.onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
          };
          set({ user, initialized: true });
        } else {
          set({ user: null, initialized: true });
        }
      });

      return unsubscribe;
    },
  },
}));

export default useAuthStore;
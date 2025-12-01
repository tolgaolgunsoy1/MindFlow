// src/store/offlineStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MindMap, Node, Connection } from '../types';

interface OfflineState {
  isOnline: boolean;
  pendingChanges: {
    mindMaps: { [id: string]: MindMap };
    operations: Array<{
      id: string;
      type: 'create' | 'update' | 'delete';
      collection: 'mindmaps' | 'nodes' | 'connections';
      data: any;
      timestamp: number;
    }>;
  };
  actions: {
    setOnlineStatus: (online: boolean) => void;
    addPendingChange: (operation: any) => void;
    syncPendingChanges: () => Promise<void>;
    loadOfflineData: () => Promise<void>;
    saveOfflineData: (mindMap: MindMap) => Promise<void>;
  };
}

const OFFLINE_DATA_KEY = 'mindflow_offline_data';
const PENDING_CHANGES_KEY = 'mindflow_pending_changes';

const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  pendingChanges: {
    mindMaps: {},
    operations: [],
  },

  actions: {
    setOnlineStatus: (online: boolean) => {
      set({ isOnline: online });
      if (online) {
        // Auto-sync when coming back online
        get().actions.syncPendingChanges();
      }
    },

    addPendingChange: (operation: any) => {
      set((state) => ({
        pendingChanges: {
          ...state.pendingChanges,
          operations: [...state.pendingChanges.operations, {
            ...operation,
            id: Date.now().toString(),
            timestamp: Date.now(),
          }],
        },
      }));

      // Save to AsyncStorage
      const state = get();
      AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(state.pendingChanges.operations));
    },

    syncPendingChanges: async () => {
      const { pendingChanges } = get();
      if (pendingChanges.operations.length === 0) return;

      try {
        // Here you would implement the sync logic with Firebase
        // For now, we'll just clear the pending changes
        console.log('Syncing pending changes:', pendingChanges.operations.length);

        set((state) => ({
          pendingChanges: {
            ...state.pendingChanges,
            operations: [],
          },
        }));

        await AsyncStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify([]));
      } catch (error) {
        console.error('Sync error:', error);
      }
    },

    loadOfflineData: async () => {
      try {
        const offlineData = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
        const pendingChanges = await AsyncStorage.getItem(PENDING_CHANGES_KEY);

        if (offlineData) {
          const parsedData = JSON.parse(offlineData);
          set((state) => ({
            pendingChanges: {
              ...state.pendingChanges,
              mindMaps: parsedData,
            },
          }));
        }

        if (pendingChanges) {
          const parsedChanges = JSON.parse(pendingChanges);
          set((state) => ({
            pendingChanges: {
              ...state.pendingChanges,
              operations: parsedChanges,
            },
          }));
        }
      } catch (error) {
        console.error('Load offline data error:', error);
      }
    },

    saveOfflineData: async (mindMap: MindMap) => {
      try {
        const { pendingChanges } = get();
        const updatedMindMaps = {
          ...pendingChanges.mindMaps,
          [mindMap.id]: mindMap,
        };

        set((state) => ({
          pendingChanges: {
            ...state.pendingChanges,
            mindMaps: updatedMindMaps,
          },
        }));

        await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(updatedMindMaps));
      } catch (error) {
        console.error('Save offline data error:', error);
      }
    },
  },
}));

export default useOfflineStore;
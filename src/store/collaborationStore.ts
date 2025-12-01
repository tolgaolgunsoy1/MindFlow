// src/store/collaborationStore.ts

import { create } from 'zustand';
import { UserPresence, CollaborationSession } from '../types';
import FirebaseService from '../services/firebase';

interface CollaborationState {
  activeUsers: UserPresence[];
  currentUserPresence: UserPresence | null;
  isConnected: boolean;
  actions: {
    joinSession: (mapId: string, userId: string, displayName: string) => void;
    leaveSession: () => void;
    updateCursor: (x: number, y: number) => void;
    selectNode: (nodeId: string | null) => void;
    updatePresence: (presence: Partial<UserPresence>) => void;
  };
}

const useCollaborationStore = create<CollaborationState>((set, get) => ({
  activeUsers: [],
  currentUserPresence: null,
  isConnected: false,

  actions: {
    joinSession: (mapId: string, userId: string, displayName: string) => {
      const presence: UserPresence = {
        userId,
        displayName,
        mapId,
        lastSeen: Date.now(),
        isOnline: true,
      };

      // Join collaboration session
      FirebaseService.joinCollaborationSession(mapId, userId, displayName);

      // Listen to other users
      const unsubscribe = FirebaseService.onUsersPresenceChange(mapId, (users) => {
        const filteredUsers = users.filter((user: UserPresence) => user.userId !== userId);
        set({ activeUsers: filteredUsers, isConnected: true });
      });

      // Update presence periodically
      const interval = setInterval(() => {
        FirebaseService.updateUserPresence(mapId, userId, { lastSeen: Date.now() });
      }, 30000); // Every 30 seconds

      set({ currentUserPresence: presence });

      // Cleanup function
      return () => {
        clearInterval(interval);
        unsubscribe();
        FirebaseService.leaveCollaborationSession(mapId, userId);
      };
    },

    leaveSession: () => {
      const { currentUserPresence } = get();
      if (currentUserPresence) {
        FirebaseService.leaveCollaborationSession(
          currentUserPresence.mapId,
          currentUserPresence.userId
        );
      }
      set({ activeUsers: [], currentUserPresence: null, isConnected: false });
    },

    updateCursor: (x: number, y: number) => {
      const { currentUserPresence } = get();
      if (currentUserPresence) {
        FirebaseService.updateUserPresence(
          currentUserPresence.mapId,
          currentUserPresence.userId,
          { cursor: { x, y } }
        );
      }
    },

    selectNode: (nodeId: string | null) => {
      const { currentUserPresence } = get();
      if (currentUserPresence) {
        FirebaseService.updateUserPresence(
          currentUserPresence.mapId,
          currentUserPresence.userId,
          { selectedNodeId: nodeId }
        );
      }
    },

    updatePresence: (updates: Partial<UserPresence>) => {
      const { currentUserPresence } = get();
      if (currentUserPresence) {
        FirebaseService.updateUserPresence(
          currentUserPresence.mapId,
          currentUserPresence.userId,
          updates
        );
      }
    },
  },
}));

export default useCollaborationStore;
// src/store/collaborationStore.ts

import { create } from 'zustand';
import { UserPresence, CollaborationSession } from '../types';
import ServiceManager from '../services/serviceManager';

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
      // Check if Firebase is available for collaboration
      if (!ServiceManager.isUsingFirebase()) {
        console.log('Collaboration requires Firebase, staying in local mode');
        set({ currentUserPresence: null, isConnected: false });
        return () => {};
      }

      const presence: UserPresence = {
        userId,
        displayName,
        mapId,
        lastSeen: Date.now(),
        isOnline: true,
      };

      // Join collaboration session
      ServiceManager.joinCollaborationSession(mapId, userId, displayName);

      // Listen to other users
      const unsubscribe = ServiceManager.onUsersPresenceChange(mapId, (users) => {
        const filteredUsers = users.filter((user: UserPresence) => user.userId !== userId);
        set({ activeUsers: filteredUsers, isConnected: true });
      });

      // Update presence periodically
      const interval = setInterval(() => {
        ServiceManager.updateUserPresence(mapId, userId, { lastSeen: Date.now() });
      }, 30000); // Every 30 seconds

      set({ currentUserPresence: presence });

      // Cleanup function
      return () => {
        clearInterval(interval);
        unsubscribe();
        ServiceManager.leaveCollaborationSession(mapId, userId);
      };
    },

    leaveSession: () => {
      const { currentUserPresence } = get();
      if (currentUserPresence && ServiceManager.isUsingFirebase()) {
        ServiceManager.leaveCollaborationSession(
          currentUserPresence.mapId,
          currentUserPresence.userId
        );
      }
      set({ activeUsers: [], currentUserPresence: null, isConnected: false });
    },

    updateCursor: (x: number, y: number) => {
      const { currentUserPresence } = get();
      if (currentUserPresence && ServiceManager.isUsingFirebase()) {
        ServiceManager.updateUserPresence(
          currentUserPresence.mapId,
          currentUserPresence.userId,
          { cursor: { x, y } }
        );
      }
    },

    selectNode: (nodeId: string | null) => {
      const { currentUserPresence } = get();
      if (currentUserPresence && ServiceManager.isUsingFirebase()) {
        ServiceManager.updateUserPresence(
          currentUserPresence.mapId,
          currentUserPresence.userId,
          { selectedNodeId: nodeId }
        );
      }
    },

    updatePresence: (updates: Partial<UserPresence>) => {
      const { currentUserPresence } = get();
      if (currentUserPresence && ServiceManager.isUsingFirebase()) {
        ServiceManager.updateUserPresence(
          currentUserPresence.mapId,
          currentUserPresence.userId,
          updates
        );
      }
    },
  },
}));

export default useCollaborationStore;
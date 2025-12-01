// src/services/localStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MindMap, Node, Connection, Comment } from '../types';
import { v4 as uuidv4 } from 'uuid';

class LocalStorageService {
  private readonly STORAGE_KEYS = {
    USER: 'mindflow_user',
    MINDMAPS: 'mindflow_mindmaps',
    CURRENT_USER: 'mindflow_current_user',
  };

  // ==================== Authentication ====================

  async signInWithEmail(email: string, password: string) {
    try {
      // Mock authentication - just create a user object
      const user = {
        uid: uuidv4(),
        email,
        displayName: email.split('@')[0],
        photoURL: null,
      };

      await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Local sign in error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    try {
      const user = {
        uid: uuidv4(),
        email,
        displayName,
        photoURL: null,
      };

      await AsyncStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Local sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Local sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    // For local storage, just call callback immediately with current user
    const user = this.getCurrentUser();
    callback(user);

    // Return a dummy unsubscribe function
    return () => {};
  }

  // ==================== MindMap CRUD ====================

  async createMindMap(mindMap: Omit<MindMap, 'id'>) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const mapId = uuidv4();
      const newMap: MindMap = {
        ...mindMap,
        id: mapId,
        ownerId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Get existing mindmaps
      const existingMaps = await this.getStoredMindMaps();
      existingMaps[mapId] = newMap;

      // Save to storage
      await AsyncStorage.setItem(this.STORAGE_KEYS.MINDMAPS, JSON.stringify(existingMaps));

      return newMap;
    } catch (error) {
      console.error('Create mindmap error:', error);
      throw error;
    }
  }

  async getMindMap(mapId: string): Promise<MindMap | null> {
    try {
      const maps = await this.getStoredMindMaps();
      return maps[mapId] || null;
    } catch (error) {
      console.error('Get mindmap error:', error);
      throw error;
    }
  }

  async updateMindMap(mapId: string, updates: Partial<MindMap>) {
    try {
      const maps = await this.getStoredMindMaps();
      if (maps[mapId]) {
        maps[mapId] = {
          ...maps[mapId],
          ...updates,
          updatedAt: Date.now(),
        };
        await AsyncStorage.setItem(this.STORAGE_KEYS.MINDMAPS, JSON.stringify(maps));
      }
    } catch (error) {
      console.error('Update mindmap error:', error);
      throw error;
    }
  }

  async deleteMindMap(mapId: string) {
    try {
      const maps = await this.getStoredMindMaps();
      delete maps[mapId];
      await AsyncStorage.setItem(this.STORAGE_KEYS.MINDMAPS, JSON.stringify(maps));
    } catch (error) {
      console.error('Delete mindmap error:', error);
      throw error;
    }
  }

  async getUserMindMaps(userId: string): Promise<MindMap[]> {
    try {
      const maps = await this.getStoredMindMaps();
      return Object.values(maps).filter(map => map.ownerId === userId);
    } catch (error) {
      console.error('Get user mindmaps error:', error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  private async getStoredMindMaps(): Promise<Record<string, MindMap>> {
    try {
      const mapsJson = await AsyncStorage.getItem(this.STORAGE_KEYS.MINDMAPS);
      return mapsJson ? JSON.parse(mapsJson) : {};
    } catch (error) {
      console.error('Get stored mindmaps error:', error);
      return {};
    }
  }

  // ==================== Mock Real-time Methods ====================

  onMindMapChange(mapId: string, callback: (map: MindMap) => void) {
    // For local storage, just return current map
    this.getMindMap(mapId).then(map => {
      if (map) callback(map);
    });

    // Return dummy unsubscribe
    return () => {};
  }

  onNodeAdded(mapId: string, callback: (node: Node) => void) {
    // Not implemented for local storage
    return () => {};
  }

  onNodeChanged(mapId: string, callback: (node: Node) => void) {
    // Not implemented for local storage
    return () => {};
  }

  onNodeRemoved(mapId: string, callback: (nodeId: string) => void) {
    // Not implemented for local storage
    return () => {};
  }

  // ==================== Comments (Local) ====================

  async addComment(comment: Omit<Comment, 'id' | 'timestamp'>) {
    try {
      const commentId = uuidv4();
      const newComment: Comment = {
        ...comment,
        id: commentId,
        timestamp: Date.now(),
      };

      // In a real app, you'd store comments separately
      // For now, just return the comment
      return newComment;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  async getCommentsByNodeId(nodeId: string): Promise<Comment[]> {
    // Mock - return empty array
    return [];
  }

  async deleteComment(commentId: string) {
    // Mock - do nothing
  }

  // ==================== Mock Methods ====================

  async shareMapWithUser(mapId: string, userId: string, role: 'editor' | 'viewer') {
    // Mock - do nothing
  }

  async removeCollaborator(mapId: string, userId: string) {
    // Mock - do nothing
  }

  async searchMaps(query: string, userId: string): Promise<MindMap[]> {
    try {
      const allMaps = await this.getUserMindMaps(userId);
      const lowerQuery = query.toLowerCase();

      return allMaps.filter((map) =>
        map.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Search maps error:', error);
      throw error;
    }
  }

  joinCollaborationSession(mapId: string, userId: string, displayName: string, photoURL?: string) {
    // Mock - return dummy ref
    return {
      set: () => {},
      onDisconnect: () => ({ remove: () => {} }),
    };
  }

  leaveCollaborationSession(mapId: string, userId: string) {
    // Mock - do nothing
  }

  updateUserPresence(mapId: string, userId: string, updates: any) {
    // Mock - do nothing
  }

  onUsersPresenceChange(mapId: string, callback: (users: any[]) => void) {
    // Mock - return empty array
    callback([]);
    return () => {};
  }

  onMindMapCollaborativeUpdate(mapId: string, callback: (updates: any) => void) {
    // Mock - do nothing
    return () => {};
  }
}

export default new LocalStorageService();
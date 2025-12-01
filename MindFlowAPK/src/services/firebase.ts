// src/services/firebase.ts

import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { MindMap, Node, Connection, Comment } from '../types';
import { v4 as uuidv4 } from 'uuid';

class FirebaseService {
  private db = database();
  private auth = auth();

  // ==================== Authentication ====================

  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName });
      return userCredential.user;
    } catch (error) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      return this.auth.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return this.auth.onAuthStateChanged(callback);
  }

  // ==================== MindMap CRUD ====================

  async createMindMap(mindMap: Omit<MindMap, 'id'>) {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const mapId = uuidv4();
      const newMap: MindMap = {
        ...mindMap,
        id: mapId,
        ownerId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.db.ref(`mindmaps/${mapId}`).set(newMap);
      return newMap;
    } catch (error) {
      console.error('Create mindmap error:', error);
      throw error;
    }
  }

  async getMindMap(mapId: string): Promise<MindMap | null> {
    try {
      const snapshot = await this.db.ref(`mindmaps/${mapId}`).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Get mindmap error:', error);
      throw error;
    }
  }

  async updateMindMap(mapId: string, updates: Partial<MindMap>) {
    try {
      await this.db.ref(`mindmaps/${mapId}`).update({
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Update mindmap error:', error);
      throw error;
    }
  }

  async deleteMindMap(mapId: string) {
    try {
      await this.db.ref(`mindmaps/${mapId}`).remove();
    } catch (error) {
      console.error('Delete mindmap error:', error);
      throw error;
    }
  }

  async getUserMindMaps(userId: string): Promise<MindMap[]> {
    try {
      const snapshot = await this.db.ref('mindmaps').orderByChild('ownerId').equalTo(userId).once('value');
      const maps = snapshot.val();
      return maps ? Object.values(maps) : [];
    } catch (error) {
      console.error('Get user mindmaps error:', error);
      throw error;
    }
  }

  // ==================== Real-time Methods ====================

  onMindMapChange(mapId: string, callback: (map: MindMap) => void) {
    const ref = this.db.ref(`mindmaps/${mapId}`);
    ref.on('value', (snapshot) => {
      const map = snapshot.val();
      if (map) callback(map);
    });
    return () => ref.off('value');
  }

  onNodeAdded(mapId: string, callback: (node: Node) => void) {
    const ref = this.db.ref(`mindmaps/${mapId}/nodes`);
    ref.on('child_added', (snapshot) => {
      const node = snapshot.val();
      if (node) callback(node);
    });
    return () => ref.off('child_added');
  }

  onNodeChanged(mapId: string, callback: (node: Node) => void) {
    const ref = this.db.ref(`mindmaps/${mapId}/nodes`);
    ref.on('child_changed', (snapshot) => {
      const node = snapshot.val();
      if (node) callback(node);
    });
    return () => ref.off('child_changed');
  }

  onNodeRemoved(mapId: string, callback: (nodeId: string) => void) {
    const ref = this.db.ref(`mindmaps/${mapId}/nodes`);
    ref.on('child_removed', (snapshot) => {
      callback(snapshot.key!);
    });
    return () => ref.off('child_removed');
  }

  // ==================== Comments ====================

  async addComment(comment: Omit<Comment, 'id' | 'timestamp'>) {
    try {
      const commentId = uuidv4();
      const newComment: Comment = {
        ...comment,
        id: commentId,
        timestamp: Date.now(),
      };

      await this.db.ref(`comments/${commentId}`).set(newComment);
      return newComment;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  async getCommentsByNodeId(nodeId: string): Promise<Comment[]> {
    try {
      const snapshot = await this.db.ref('comments').orderByChild('nodeId').equalTo(nodeId).once('value');
      const comments = snapshot.val();
      return comments ? Object.values(comments) : [];
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  async deleteComment(commentId: string) {
    try {
      await this.db.ref(`comments/${commentId}`).remove();
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }

  // ==================== Collaboration ====================

  async shareMapWithUser(mapId: string, userId: string, role: 'editor' | 'viewer') {
    try {
      await this.db.ref(`mindmaps/${mapId}/collaborators/${userId}`).set({ role });
    } catch (error) {
      console.error('Share map error:', error);
      throw error;
    }
  }

  async removeCollaborator(mapId: string, userId: string) {
    try {
      await this.db.ref(`mindmaps/${mapId}/collaborators/${userId}`).remove();
    } catch (error) {
      console.error('Remove collaborator error:', error);
      throw error;
    }
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
    const presenceRef = this.db.ref(`mindmaps/${mapId}/presence/${userId}`);
    const connectedRef = this.db.ref('.info/connected');

    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        presenceRef.set({
          displayName,
          photoURL: photoURL || null,
          lastSeen: Date.now(),
        });
        presenceRef.onDisconnect().remove();
      }
    });

    return presenceRef;
  }

  leaveCollaborationSession(mapId: string, userId: string) {
    this.db.ref(`mindmaps/${mapId}/presence/${userId}`).remove();
  }

  updateUserPresence(mapId: string, userId: string, updates: any) {
    this.db.ref(`mindmaps/${mapId}/presence/${userId}`).update({
      ...updates,
      lastSeen: Date.now(),
    });
  }

  onUsersPresenceChange(mapId: string, callback: (users: any[]) => void) {
    const ref = this.db.ref(`mindmaps/${mapId}/presence`);
    ref.on('value', (snapshot) => {
      const presence = snapshot.val();
      const users = presence ? Object.values(presence) : [];
      callback(users);
    });
    return () => ref.off('value');
  }

  onMindMapCollaborativeUpdate(mapId: string, callback: (updates: any) => void) {
    const ref = this.db.ref(`mindmaps/${mapId}`);
    ref.on('value', (snapshot) => {
      const map = snapshot.val();
      if (map) callback(map);
    });
    return () => ref.off('value');
  }
}

export default new FirebaseService();
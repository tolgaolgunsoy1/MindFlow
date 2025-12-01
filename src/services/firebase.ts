// MindFlow - Firebase Servisleri

import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import { MindMap, Node, Connection, Comment, User, Activity } from '../types';

class FirebaseService {
  private db = database();
  private auth = auth();

  // ==================== Authentication ====================
  
  async signInWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName });
      
      // Create user profile in database
      await this.db.ref(`users/${userCredential.user.uid}`).set({
        id: userCredential.user.uid,
        email,
        displayName,
        createdAt: new Date().toISOString(),
      });
      
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await this.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return this.auth.onAuthStateChanged(callback);
  }

  // ==================== MindMap CRUD ====================

  async createMindMap(mindMap: Omit<MindMap, 'id'>) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const newMapRef = this.db.ref('mindmaps').push();
      const mapId = newMapRef.key!;

      const newMap: MindMap = {
        ...mindMap,
        id: mapId,
        ownerId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await newMapRef.set(newMap);
      
      // Add to user's maps
      await this.db.ref(`users/${user.uid}/maps/${mapId}`).set(true);
      
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
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Update mindmap error:', error);
      throw error;
    }
  }

  async deleteMindMap(mapId: string) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      await this.db.ref(`mindmaps/${mapId}`).remove();
      await this.db.ref(`users/${user.uid}/maps/${mapId}`).remove();
    } catch (error) {
      console.error('Delete mindmap error:', error);
      throw error;
    }
  }

  async getUserMindMaps(userId: string): Promise<MindMap[]> {
    try {
      const mapsSnapshot = await this.db.ref(`users/${userId}/maps`).once('value');
      const mapIds = Object.keys(mapsSnapshot.val() || {});
      
      const maps: MindMap[] = [];
      for (const mapId of mapIds) {
        const map = await this.getMindMap(mapId);
        if (map) maps.push(map);
      }
      
      return maps;
    } catch (error) {
      console.error('Get user mindmaps error:', error);
      throw error;
    }
  }

  // ==================== Real-time Listeners ====================

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

  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
    try {
      const newCommentRef = this.db.ref('comments').push();
      const commentId = newCommentRef.key!;

      const newComment: Comment = {
        ...comment,
        id: commentId,
        timestamp: Date.now(),
      };

      await newCommentRef.set(newComment);
      return newComment;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  async getCommentsByNodeId(nodeId: string): Promise<Comment[]> {
    try {
      const snapshot = await this.db
        .ref('comments')
        .orderByChild('nodeId')
        .equalTo(nodeId)
        .once('value');
      
      const comments: Comment[] = [];
      snapshot.forEach((child) => {
        comments.push(child.val());
        return undefined; // Continue iteration
      });
      
      return comments;
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

  // ==================== Activities ====================

  async logActivity(activity: Omit<Activity, 'id' | 'timestamp'>) {
    try {
      const newActivityRef = this.db.ref('activities').push();
      const activityId = newActivityRef.key!;

      const newActivity: Activity = {
        ...activity,
        id: activityId,
        timestamp: new Date().toISOString(),
      };

      await newActivityRef.set(newActivity);
      return newActivity;
    } catch (error) {
      console.error('Log activity error:', error);
      throw error;
    }
  }

  async getActivitiesByMapId(mapId: string, limit: number = 50): Promise<Activity[]> {
    try {
      const snapshot = await this.db
        .ref('activities')
        .orderByChild('targetId')
        .equalTo(mapId)
        .limitToLast(limit)
        .once('value');
      
      const activities: Activity[] = [];
      snapshot.forEach((child) => {
        activities.push(child.val());
        return undefined;
      });
      
      return activities.reverse();
    } catch (error) {
      console.error('Get activities error:', error);
      throw error;
    }
  }

  // ==================== Collaboration ====================

  async shareMapWithUser(mapId: string, userId: string, role: 'editor' | 'viewer') {
    try {
      await this.db.ref(`mindmaps/${mapId}/collaborators/${userId}`).set({ role });
      await this.db.ref(`users/${userId}/sharedMaps/${mapId}`).set(true);
    } catch (error) {
      console.error('Share map error:', error);
      throw error;
    }
  }

  async removeCollaborator(mapId: string, userId: string) {
    try {
      await this.db.ref(`mindmaps/${mapId}/collaborators/${userId}`).remove();
      await this.db.ref(`users/${userId}/sharedMaps/${mapId}`).remove();
    } catch (error) {
      console.error('Remove collaborator error:', error);
      throw error;
    }
  }

  // ==================== Search ====================

  async searchMaps(query: string, userId: string): Promise<MindMap[]> {
    try {
      const allMaps = await this.getUserMindMaps(userId);
      const lowerQuery = query.toLowerCase();

      return allMaps.filter((map) =>
        map.name.toLowerCase().includes(lowerQuery) ||
        (map.description && map.description.toLowerCase().includes(lowerQuery)) ||
        (map.tags && map.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
      );
    } catch (error) {
      console.error('Search maps error:', error);
      throw error;
    }
  }

  // ==================== Collaboration ====================

  joinCollaborationSession(mapId: string, userId: string, displayName: string, photoURL?: string) {
    const presenceRef = this.db.ref(`presence/${mapId}/${userId}`);
    const presence = {
      userId,
      displayName,
      photoURL,
      mapId,
      lastSeen: Date.now(),
      isOnline: true,
    };

    presenceRef.set(presence);
    presenceRef.onDisconnect().remove();

    return presenceRef;
  }

  leaveCollaborationSession(mapId: string, userId: string) {
    const presenceRef = this.db.ref(`presence/${mapId}/${userId}`);
    presenceRef.remove();
  }

  updateUserPresence(mapId: string, userId: string, updates: any) {
    const presenceRef = this.db.ref(`presence/${mapId}/${userId}`);
    presenceRef.update({
      ...updates,
      lastSeen: Date.now(),
    });
  }

  onUsersPresenceChange(mapId: string, callback: (users: any[]) => void) {
    const usersRef = this.db.ref(`presence/${mapId}`);
    usersRef.on('value', (snapshot) => {
      const users: any[] = [];
      snapshot.forEach((child) => {
        users.push(child.val());
        return undefined;
      });
      callback(users);
    });

    return () => usersRef.off('value');
  }

  onMindMapCollaborativeUpdate(mapId: string, callback: (updates: any) => void) {
    const mapRef = this.db.ref(`mindmaps/${mapId}`);
    mapRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) callback(data);
    });

    return () => mapRef.off('value');
  }
}

export default new FirebaseService();

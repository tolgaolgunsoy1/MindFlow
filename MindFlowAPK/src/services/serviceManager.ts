// src/services/serviceManager.ts

import LocalStorageService from './localStorage';

// Try to import Firebase - this will be undefined if Firebase is not configured
let FirebaseService: any = null;
try {
  FirebaseService = require('./firebase').default;
} catch (error) {
  console.warn('Firebase service not available:', error);
}

class ServiceManager {
  private static instance: ServiceManager;
  private currentService: any;
  private usingFirebase: boolean = false;

  private constructor() {
    // Start with local storage as default
    this.currentService = LocalStorageService;
    this.usingFirebase = false;

    // Try to initialize Firebase asynchronously without blocking
    this.tryInitializeFirebase();
  }

  private async tryInitializeFirebase() {
    if (!FirebaseService) {
      console.log('Firebase service not available, using local storage');
      return;
    }

    try {
      // Test Firebase connection - if this succeeds, switch to Firebase
      await FirebaseService.getCurrentUser();

      this.currentService = FirebaseService;
      this.usingFirebase = true;
      console.log('Switched to Firebase service for data storage');
    } catch (error) {
      console.warn('Firebase initialization failed, continuing with local storage:', error);
      // Keep using local storage
    }
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  getService() {
    return this.currentService;
  }

  isUsingFirebase(): boolean {
    return this.usingFirebase;
  }

  // Delegate all methods to the current service
  async signInWithEmail(email: string, password: string) {
    return this.currentService.signInWithEmail(email, password);
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    return this.currentService.signUpWithEmail(email, password, displayName);
  }

  async signOut() {
    return this.currentService.signOut();
  }

  getCurrentUser() {
    return this.currentService.getCurrentUser();
  }

  onAuthStateChanged(callback: (user: any) => void) {
    return this.currentService.onAuthStateChanged(callback);
  }

  async createMindMap(mindMap: any) {
    return this.currentService.createMindMap(mindMap);
  }

  async getMindMap(mapId: string) {
    return this.currentService.getMindMap(mapId);
  }

  async updateMindMap(mapId: string, updates: any) {
    return this.currentService.updateMindMap(mapId, updates);
  }

  async deleteMindMap(mapId: string) {
    return this.currentService.deleteMindMap(mapId);
  }

  async getUserMindMaps(userId: string) {
    return this.currentService.getUserMindMaps(userId);
  }

  onMindMapChange(mapId: string, callback: (map: any) => void) {
    return this.currentService.onMindMapChange(mapId, callback);
  }

  onNodeAdded(mapId: string, callback: (node: any) => void) {
    return this.currentService.onNodeAdded(mapId, callback);
  }

  onNodeChanged(mapId: string, callback: (node: any) => void) {
    return this.currentService.onNodeChanged(mapId, callback);
  }

  onNodeRemoved(mapId: string, callback: (nodeId: string) => void) {
    return this.currentService.onNodeRemoved(mapId, callback);
  }

  async addComment(comment: any) {
    return this.currentService.addComment(comment);
  }

  async getCommentsByNodeId(nodeId: string) {
    return this.currentService.getCommentsByNodeId(nodeId);
  }

  async deleteComment(commentId: string) {
    return this.currentService.deleteComment(commentId);
  }

  async shareMapWithUser(mapId: string, userId: string, role: string) {
    return this.currentService.shareMapWithUser(mapId, userId, role);
  }

  async removeCollaborator(mapId: string, userId: string) {
    return this.currentService.removeCollaborator(mapId, userId);
  }

  async searchMaps(query: string, userId: string) {
    return this.currentService.searchMaps(query, userId);
  }

  joinCollaborationSession(mapId: string, userId: string, displayName: string, photoURL?: string) {
    return this.currentService.joinCollaborationSession(mapId, userId, displayName, photoURL);
  }

  leaveCollaborationSession(mapId: string, userId: string) {
    return this.currentService.leaveCollaborationSession(mapId, userId);
  }

  updateUserPresence(mapId: string, userId: string, updates: any) {
    return this.currentService.updateUserPresence(mapId, userId, updates);
  }

  onUsersPresenceChange(mapId: string, callback: (users: any[]) => void) {
    return this.currentService.onUsersPresenceChange(mapId, callback);
  }

  onMindMapCollaborativeUpdate(mapId: string, callback: (updates: any) => void) {
    return this.currentService.onMindMapCollaborativeUpdate(mapId, callback);
  }
}

export default ServiceManager.getInstance();
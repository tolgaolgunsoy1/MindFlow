// src/services/notificationService.ts

import useNotificationStore from '../store/notificationStore';
import { Node, MindMap } from '../types';

export class NotificationService {
  private static notificationStore = useNotificationStore.getState();

  // Check for due dates and create reminders
  static checkDueDates(nodes: Node[]): void {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    nodes.forEach(node => {
      if (node.dueDate) {
        const dueDate = new Date(node.dueDate);

        // Due today
        if (dueDate.toDateString() === now.toDateString() && node.status !== 'done') {
          this.notificationStore.actions.addNotification({
            type: 'due_date',
            title: 'Görev Bugün Bitiyor',
            message: `"${node.title}" görevi bugün tamamlanması gerekiyor.`,
            relatedNodeId: node.id,
          });
        }

        // Due tomorrow
        if (dueDate.toDateString() === tomorrow.toDateString() && node.status !== 'done') {
          this.notificationStore.actions.addNotification({
            type: 'due_date',
            title: 'Görev Yarın Bitiyor',
            message: `"${node.title}" görevi yarın tamamlanması gerekiyor.`,
            relatedNodeId: node.id,
          });
        }

        // Due within a week
        if (dueDate <= weekFromNow && dueDate > tomorrow && node.status !== 'done') {
          this.notificationStore.actions.addNotification({
            type: 'due_date',
            title: 'Yaklaşan Görev',
            message: `"${node.title}" görevi ${Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} gün içinde tamamlanması gerekiyor.`,
            relatedNodeId: node.id,
          });
        }

        // Overdue
        if (dueDate < now && node.status !== 'done') {
          this.notificationStore.actions.addNotification({
            type: 'due_date',
            title: 'Geciken Görev',
            message: `"${node.title}" görevi süresi geçmiş.`,
            relatedNodeId: node.id,
          });
        }
      }
    });
  }

  // Notify about new comments
  static notifyNewComment(node: Node, commentText: string, commenterName: string): void {
    this.notificationStore.actions.addNotification({
      type: 'comment',
      title: 'Yeni Yorum',
      message: `${commenterName} "${node.title}" düğümüne yorum yaptı: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
      relatedNodeId: node.id,
    });
  }

  // Notify about collaboration changes
  static notifyCollaborationChange(mindMap: MindMap, action: string, userName: string): void {
    this.notificationStore.actions.addNotification({
      type: 'collaboration',
      title: 'İşbirliği Güncellemesi',
      message: `${userName} "${mindMap.name}" mind map'inde ${action}.`,
      relatedMapId: mindMap.id,
    });
  }

  // Notify about task assignments
  static notifyTaskAssignment(node: Node, assigneeName: string): void {
    this.notificationStore.actions.addNotification({
      type: 'assignment',
      title: 'Yeni Görev Ataması',
      message: `"${node.title}" görevi size atandı.`,
      relatedNodeId: node.id,
    });
  }

  // System notifications
  static notifySystemUpdate(message: string, actionUrl?: string): void {
    this.notificationStore.actions.addNotification({
      type: 'system',
      title: 'Sistem Bildirimi',
      message,
      actionUrl,
    });
  }

  // Schedule periodic checks
  static startPeriodicChecks(mindMaps: MindMap[]): void {
    // Check due dates every hour
    setInterval(() => {
      const allNodes: Node[] = [];
      mindMaps.forEach(map => {
        allNodes.push(...Object.values(map.nodes));
      });
      this.checkDueDates(allNodes);
    }, 60 * 60 * 1000); // Every hour

    // Initial check
    const allNodes: Node[] = [];
    mindMaps.forEach(map => {
      allNodes.push(...Object.values(map.nodes));
    });
    this.checkDueDates(allNodes);
  }

  // Get notification icon based on type
  static getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      due_date: 'calendar-clock',
      collaboration: 'account-group',
      comment: 'comment',
      assignment: 'account-plus',
      system: 'information',
    };
    return icons[type] || 'bell';
  }

  // Get notification color based on type
  static getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      due_date: '#FF9800',
      collaboration: '#2196F3',
      comment: '#4CAF50',
      assignment: '#9C27B0',
      system: '#607D8B',
    };
    return colors[type] || '#666';
  }
}
// src/services/slackService.ts

import { MindMap, Node, Activity } from '../types';

export interface SlackConfig {
  botToken: string;
  signingSecret: string;
  defaultChannel?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
}

export interface SlackMessage {
  id: string;
  text: string;
  user: string;
  timestamp: number;
  channel: string;
  threadTs?: string;
  reactions?: SlackReaction[];
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  avatar?: string;
}

export class SlackService {
  private static instance: SlackService;
  private config: SlackConfig | null = null;

  static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  /**
   * Slack API yapılandırmasını ayarla
   */
  configure(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Slack bağlantısını test et
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true; // Mock success
  }

  /**
   * Kullanıcının Slack kanallarını getir
   */
  async getChannels(): Promise<SlackChannel[]> {
    if (!this.config) throw new Error('Slack not configured');

    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock data
    return [
      {
        id: 'C1234567890',
        name: 'general',
        isPrivate: false,
        memberCount: 25
      },
      {
        id: 'C0987654321',
        name: 'mindflow-updates',
        isPrivate: false,
        memberCount: 12
      },
      {
        id: 'C1122334455',
        name: 'project-alpha',
        isPrivate: true,
        memberCount: 8
      }
    ];
  }

  /**
   * Slack kullanıcılarını getir
   */
  async getUsers(): Promise<SlackUser[]> {
    if (!this.config) throw new Error('Slack not configured');

    await new Promise(resolve => setTimeout(resolve, 600));

    return [
      {
        id: 'U1234567890',
        name: 'john.doe',
        realName: 'John Doe',
        avatar: 'https://via.placeholder.com/32'
      },
      {
        id: 'U0987654321',
        name: 'jane.smith',
        realName: 'Jane Smith',
        avatar: 'https://via.placeholder.com/32'
      },
      {
        id: 'U1122334455',
        name: 'bob.wilson',
        realName: 'Bob Wilson',
        avatar: 'https://via.placeholder.com/32'
      }
    ];
  }

  /**
   * MindFlow etkinliğini Slack'e bildir
   */
  async sendActivityNotification(
    activity: Activity,
    channelId?: string
  ): Promise<void> {
    if (!this.config) throw new Error('Slack not configured');

    await new Promise(resolve => setTimeout(resolve, 500));

    const channel = channelId || this.config.defaultChannel;
    if (!channel) throw new Error('No channel specified');

    // Create notification message based on activity type
    const message = this.formatActivityMessage(activity);

    console.log(`Sending Slack notification to ${channel}:`, message);

    // In a real implementation, this would call Slack API
  }

  /**
   * Proje güncellemelerini Slack'e bildir
   */
  async sendProjectUpdate(
    mindMap: MindMap,
    updateType: 'created' | 'updated' | 'completed' | 'deadline_approaching',
    channelId?: string
  ): Promise<void> {
    if (!this.config) throw new Error('Slack not configured');

    await new Promise(resolve => setTimeout(resolve, 500));

    const channel = channelId || this.config.defaultChannel;
    if (!channel) throw new Error('No channel specified');

    const message = this.formatProjectUpdateMessage(mindMap, updateType);

    console.log(`Sending project update to Slack ${channel}:`, message);

    // In a real implementation, this would call Slack API
  }

  /**
   * Slack kanalından mesajları içe aktar
   */
  async importMessagesFromChannel(
    channelId: string,
    since?: number
  ): Promise<Node[]> {
    if (!this.config) throw new Error('Slack not configured');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock messages that could be converted to tasks
    const mockMessages: SlackMessage[] = [
      {
        id: 'msg1',
        text: 'Need to implement user authentication system',
        user: 'U1234567890',
        timestamp: Date.now() - 86400000, // 1 day ago
        channel: channelId,
        reactions: [{ name: 'thumbsup', count: 3, users: ['U1', 'U2', 'U3'] }]
      },
      {
        id: 'msg2',
        text: 'Database schema design completed, ready for review',
        user: 'U0987654321',
        timestamp: Date.now() - 43200000, // 12 hours ago
        channel: channelId,
        threadTs: 'msg1'
      },
      {
        id: 'msg3',
        text: 'UI mockups are ready for feedback',
        user: 'U1122334455',
        timestamp: Date.now() - 3600000, // 1 hour ago
        channel: channelId
      }
    ];

    // Convert messages to MindFlow nodes
    return mockMessages.map((message, index) => ({
      id: `slack_msg_${message.id}`,
      type: this.inferNodeTypeFromMessage(message.text),
      title: this.extractTitleFromMessage(message.text),
      description: message.text,
      position: { x: 100 + index * 200, y: 200 + index * 100 },
      status: 'todo',
      priority: this.inferPriorityFromMessage(message),
      tags: ['slack', 'import', 'message'],
      createdAt: new Date(message.timestamp).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  /**
   * Slack'ten gelen webhook'u işle
   */
  async handleWebhook(payload: any): Promise<void> {
    console.log('Slack webhook received:', payload);

    // Handle different Slack events
    if (payload.type === 'message') {
      await this.handleMessageEvent(payload);
    } else if (payload.type === 'reaction_added') {
      await this.handleReactionEvent(payload);
    }

    // In a real implementation, this would update mind maps based on Slack activity
  }

  /**
   * Özel Slack komutlarını işle
   */
  async handleSlashCommand(command: string, text: string, userId: string): Promise<string> {
    console.log(`Slack slash command: ${command} ${text} from ${userId}`);

    switch (command) {
      case '/mindflow-status':
        return 'MindFlow is running smoothly! 🚀';

      case '/mindflow-tasks':
        return 'Here are your current tasks:\n• Design user interface\n• Implement authentication\n• Setup database';

      case '/mindflow-create':
        // Create a task from Slack
        return `Task "${text}" has been created in MindFlow! ✅`;

      default:
        return `Unknown command: ${command}`;
    }
  }

  /**
   * Activity mesajını formatla
   */
  private formatActivityMessage(activity: Activity): string {
    const userName = activity.username;
    const targetName = activity.targetId;

    switch (activity.action) {
      case 'create':
        return `🆕 ${userName} yeni bir ${activity.targetType} oluşturdu: "${activity.description}"`;

      case 'update':
        return `✏️ ${userName} bir ${activity.targetType} güncelledi: "${activity.description}"`;

      case 'delete':
        return `🗑️ ${userName} bir ${activity.targetType} sildi: "${activity.description}"`;

      case 'comment':
        return `💬 ${userName} yorum yaptı: "${activity.description}"`;

      default:
        return `📝 ${userName}: ${activity.description}`;
    }
  }

  /**
   * Proje güncelleme mesajını formatla
   */
  private formatProjectUpdateMessage(
    mindMap: MindMap,
    updateType: string
  ): string {
    const projectName = mindMap.name;
    const nodeCount = Object.keys(mindMap.nodes).length;

    switch (updateType) {
      case 'created':
        return `🎯 Yeni proje oluşturuldu: "${projectName}" (${nodeCount} düğüm)`;

      case 'updated':
        return `🔄 Proje güncellendi: "${projectName}" (${nodeCount} düğüm)`;

      case 'completed':
        return `✅ Proje tamamlandı: "${projectName}" 🎉`;

      case 'deadline_approaching':
        return `⏰ Proje deadline'ı yaklaşıyor: "${projectName}"`;

      default:
        return `📊 Proje güncellemesi: "${projectName}"`;
    }
  }

  /**
   * Mesajdan düğüm türünü çıkar
   */
  private inferNodeTypeFromMessage(text: string): 'idea' | 'task' | 'feature' | 'scope' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('idea') || lowerText.includes('fikir')) {
      return 'idea';
    }
    if (lowerText.includes('feature') || lowerText.includes('özellik')) {
      return 'feature';
    }
    if (lowerText.includes('design') || lowerText.includes('tasarım') ||
        lowerText.includes('ui') || lowerText.includes('ux')) {
      return 'feature';
    }

    return 'task';
  }

  /**
   * Mesajdan başlık çıkar
   */
  private extractTitleFromMessage(text: string): string {
    // Take first sentence or first 50 characters
    const sentences = text.split(/[.!?]+/);
    const title = sentences[0].trim();

    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  /**
   * Mesajdan öncelik çıkar
   */
  private inferPriorityFromMessage(message: SlackMessage): 'low' | 'medium' | 'high' {
    const text = message.text.toLowerCase();

    // Check for urgent keywords
    if (text.includes('urgent') || text.includes('asap') || text.includes('critical') ||
        text.includes('acil') || text.includes('önemli')) {
      return 'high';
    }

    // Check reactions (more reactions = higher priority)
    const totalReactions = message.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;
    if (totalReactions >= 5) {
      return 'high';
    }
    if (totalReactions >= 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Mesaj olayını işle
   */
  private async handleMessageEvent(payload: any): Promise<void> {
    // Process new messages and potentially create tasks
    console.log('Processing Slack message:', payload.text);
  }

  /**
   * Tepki olayını işle
   */
  private async handleReactionEvent(payload: any): Promise<void> {
    // Process reactions (could indicate priority or approval)
    console.log('Processing Slack reaction:', payload.reaction);
  }
}

export default SlackService.getInstance();
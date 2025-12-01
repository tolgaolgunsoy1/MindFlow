// src/services/integrationService.ts

import TrelloService, { TrelloConfig } from './trelloService';
import SlackService, { SlackConfig } from './slackService';
import { MindMap, Activity } from '../types';

export interface IntegrationConfig {
  trello?: TrelloConfig;
  slack?: SlackConfig;
}

export interface IntegrationStatus {
  trello: {
    configured: boolean;
    connected: boolean;
    lastSync?: number;
  };
  slack: {
    configured: boolean;
    connected: boolean;
    lastSync?: number;
  };
}

export class IntegrationService {
  private static instance: IntegrationService;
  private config: IntegrationConfig = {};
  private status: IntegrationStatus = {
    trello: { configured: false, connected: false },
    slack: { configured: false, connected: false }
  };

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  /**
   * Tüm entegrasyonları yapılandır
   */
  configure(config: IntegrationConfig) {
    this.config = config;

    if (config.trello) {
      TrelloService.configure(config.trello);
      this.status.trello.configured = true;
    }

    if (config.slack) {
      SlackService.configure(config.slack);
      this.status.slack.configured = true;
    }
  }

  /**
   * Entegrasyon durumunu getir
   */
  getStatus(): IntegrationStatus {
    return { ...this.status };
  }

  /**
   * Tüm entegrasyonları test et
   */
  async testAllConnections(): Promise<IntegrationStatus> {
    const results = { ...this.status };

    if (results.trello.configured) {
      try {
        results.trello.connected = await TrelloService.testConnection();
      } catch (error) {
        results.trello.connected = false;
      }
    }

    if (results.slack.configured) {
      try {
        results.slack.connected = await SlackService.testConnection();
      } catch (error) {
        results.slack.connected = false;
      }
    }

    this.status = results;
    return results;
  }

  /**
   * Mind map'i dış servislere aktar
   */
  async exportMindMap(mindMap: MindMap, services: ('trello' | 'slack')[] = ['trello', 'slack']): Promise<void> {
    const exportPromises: Promise<void>[] = [];

    if (services.includes('trello') && this.status.trello.configured && this.config.trello?.boardId) {
      exportPromises.push(
        TrelloService.exportToTrello(mindMap, this.config.trello.boardId)
          .then(() => {
            this.status.trello.lastSync = Date.now();
          })
      );
    }

    if (services.includes('slack') && this.status.slack.configured) {
      exportPromises.push(
        SlackService.sendProjectUpdate(mindMap, 'updated')
          .then(() => {
            this.status.slack.lastSync = Date.now();
          })
      );
    }

    await Promise.all(exportPromises);
  }

  /**
   * Dış servisten mind map içe aktar
   */
  async importFromService(service: 'trello' | 'slack', sourceId: string): Promise<MindMap> {
    if (service === 'trello' && this.status.trello.configured) {
      const mindMap = await TrelloService.importFromTrello(sourceId);
      this.status.trello.lastSync = Date.now();
      return mindMap;
    }

    throw new Error(`${service} integration not configured or not supported for import`);
  }

  /**
   * Aktivite bildirimlerini gönder
   */
  async sendActivityNotification(activity: Activity, services: ('slack')[] = ['slack']): Promise<void> {
    const notificationPromises: Promise<void>[] = [];

    if (services.includes('slack') && this.status.slack.configured) {
      notificationPromises.push(SlackService.sendActivityNotification(activity));
    }

    await Promise.all(notificationPromises);
  }

  /**
   * Slack kanalından mesajları içe aktar
   */
  async importSlackMessages(channelId: string): Promise<any[]> {
    if (!this.status.slack.configured) {
      throw new Error('Slack integration not configured');
    }

    const nodes = await SlackService.importMessagesFromChannel(channelId);
    this.status.slack.lastSync = Date.now();
    return nodes;
  }

  /**
   * Webhook olaylarını işle
   */
  async handleWebhook(service: 'trello' | 'slack', payload: any): Promise<void> {
    if (service === 'trello') {
      await TrelloService.handleWebhook(payload);
    } else if (service === 'slack') {
      await SlackService.handleWebhook(payload);
    }
  }

  /**
   * Slack slash komutlarını işle
   */
  async handleSlackCommand(command: string, text: string, userId: string): Promise<string> {
    if (!this.status.slack.configured) {
      throw new Error('Slack integration not configured');
    }

    return await SlackService.handleSlashCommand(command, text, userId);
  }

  /**
   * Entegrasyon ayarlarını kaydet/yükle
   */
  saveSettings(): void {
    // In a real app, this would save to AsyncStorage or secure storage
    console.log('Integration settings saved');
  }

  loadSettings(): IntegrationConfig {
    // In a real app, this would load from storage
    return this.config;
  }

  /**
   * Entegrasyon bağlantılarını kes
   */
  disconnect(service: 'trello' | 'slack'): void {
    if (service === 'trello') {
      this.status.trello = { configured: false, connected: false };
      this.config.trello = undefined;
    } else if (service === 'slack') {
      this.status.slack = { configured: false, connected: false };
      this.config.slack = undefined;
    }
  }

  /**
   * Desteklenen entegrasyonları listele
   */
  getSupportedServices(): Array<{
    id: 'trello' | 'slack';
    name: string;
    description: string;
    features: string[];
  }> {
    return [
      {
        id: 'trello',
        name: 'Trello',
        description: 'Kanban board yönetimi ve görev takibi',
        features: [
          'Board import/export',
          'Card to task conversion',
          'Real-time sync',
          'Label mapping'
        ]
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Takım iletişimi ve bildirimler',
        features: [
          'Activity notifications',
          'Message import',
          'Slash commands',
          'Channel integration'
        ]
      }
    ];
  }
}

export default IntegrationService.getInstance();
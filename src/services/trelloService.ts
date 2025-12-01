// src/services/trelloService.ts

import { MindMap, Node, NodeType, NodeStatus } from '../types';

export interface TrelloBoard {
  id: string;
  name: string;
  description?: string;
  url: string;
  lists: TrelloList[];
}

export interface TrelloList {
  id: string;
  name: string;
  cards: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  name: string;
  description?: string;
  url: string;
  due?: string;
  labels: TrelloLabel[];
  members: string[];
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloConfig {
  apiKey: string;
  token: string;
  boardId?: string;
}

export class TrelloService {
  private static instance: TrelloService;
  private config: TrelloConfig | null = null;

  static getInstance(): TrelloService {
    if (!TrelloService.instance) {
      TrelloService.instance = new TrelloService();
    }
    return TrelloService.instance;
  }

  /**
   * Trello API yapılandırmasını ayarla
   */
  configure(config: TrelloConfig) {
    this.config = config;
  }

  /**
   * Trello bağlantısını test et
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true; // Mock success
  }

  /**
   * Kullanıcının Trello panolarını getir
   */
  async getBoards(): Promise<TrelloBoard[]> {
    if (!this.config) throw new Error('Trello not configured');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock data
    return [
      {
        id: 'board1',
        name: 'MindFlow Project',
        description: 'Main project board',
        url: 'https://trello.com/b/example1',
        lists: []
      },
      {
        id: 'board2',
        name: 'Development Tasks',
        description: 'Technical development board',
        url: 'https://trello.com/b/example2',
        lists: []
      }
    ];
  }

  /**
   * Belirli bir panonun detaylarını getir
   */
  async getBoard(boardId: string): Promise<TrelloBoard> {
    if (!this.config) throw new Error('Trello not configured');

    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock detailed board data
    return {
      id: boardId,
      name: 'MindFlow Project',
      description: 'Main project board with all tasks',
      url: 'https://trello.com/b/example1',
      lists: [
        {
          id: 'list1',
          name: 'To Do',
          cards: [
            {
              id: 'card1',
              name: 'Design user interface',
              description: 'Create wireframes and mockups for the main screens',
              url: 'https://trello.com/c/card1',
              due: '2024-02-15',
              labels: [
                { id: 'label1', name: 'Design', color: 'blue' },
                { id: 'label2', name: 'High Priority', color: 'red' }
              ],
              members: ['user1', 'user2']
            },
            {
              id: 'card2',
              name: 'Implement authentication',
              description: 'Add login and signup functionality',
              url: 'https://trello.com/c/card2',
              labels: [
                { id: 'label3', name: 'Development', color: 'green' }
              ],
              members: ['user3']
            }
          ]
        },
        {
          id: 'list2',
          name: 'In Progress',
          cards: [
            {
              id: 'card3',
              name: 'Setup project structure',
              description: 'Initialize React Native project with TypeScript',
              url: 'https://trello.com/c/card3',
              labels: [
                { id: 'label3', name: 'Development', color: 'green' }
              ],
              members: ['user1']
            }
          ]
        },
        {
          id: 'list3',
          name: 'Done',
          cards: [
            {
              id: 'card4',
              name: 'Project planning',
              description: 'Complete project requirements and timeline',
              url: 'https://trello.com/c/card4',
              labels: [
                { id: 'label4', name: 'Planning', color: 'yellow' }
              ],
              members: ['user1']
            }
          ]
        }
      ]
    };
  }

  /**
   * Trello kartlarını MindFlow düğümlerine dönüştür
   */
  async importFromTrello(boardId: string): Promise<MindMap> {
    const board = await this.getBoard(boardId);

    const nodes: { [key: string]: Node } = {};
    const connections: any[] = [];
    let nodeCounter = 1;

    // Convert lists to main nodes and cards to sub-nodes
    board.lists.forEach((list, listIndex) => {
      // Create list node
      const listNodeId = `trello_list_${list.id}`;
      nodes[listNodeId] = {
        id: listNodeId,
        type: 'scope',
        title: list.name,
        description: `${list.name} listesi - ${list.cards.length} kart`,
        position: { x: listIndex * 300 + 100, y: 100 },
        status: 'todo',
        priority: 'medium',
        tags: ['trello', 'import'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert cards to task nodes
      list.cards.forEach((card, cardIndex) => {
        const cardNodeId = `trello_card_${card.id}`;
        const status = this.mapTrelloListToStatus(list.name);

        nodes[cardNodeId] = {
          id: cardNodeId,
          type: 'task',
          title: card.name,
          description: card.description || '',
          position: {
            x: listIndex * 300 + 100,
            y: 200 + cardIndex * 120
          },
          status,
          priority: this.mapTrelloLabelsToPriority(card.labels),
          tags: ['trello', 'import', ...card.labels.map(l => l.name.toLowerCase())],
          dueDate: card.due,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Connect card to list
        connections.push({
          id: `conn_${listNodeId}_${cardNodeId}`,
          from: listNodeId,
          to: cardNodeId,
          type: 'related'
        });
      });
    });

    return {
      id: `trello_import_${boardId}_${Date.now()}`,
      name: `Trello Import: ${board.name}`,
      description: `Imported from Trello board: ${board.description}`,
      nodes,
      connections,
      ownerId: 'current_user', // Would be actual user ID
      collaborators: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['trello', 'import']
    };
  }

  /**
   * MindFlow mind map'ini Trello panosuna aktar
   */
  async exportToTrello(mindMap: MindMap, boardId: string): Promise<void> {
    if (!this.config) throw new Error('Trello not configured');

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate export process
    const nodes = Object.values(mindMap.nodes);

    // Group nodes by type for different lists
    const tasks = nodes.filter(n => n.type === 'task');
    const features = nodes.filter(n => n.type === 'feature');
    const ideas = nodes.filter(n => n.type === 'idea');

    console.log(`Exporting ${nodes.length} nodes to Trello board ${boardId}`);
    console.log(`Tasks: ${tasks.length}, Features: ${features.length}, Ideas: ${ideas.length}`);

    // In a real implementation, this would create lists and cards via Trello API
  }

  /**
   * Trello listesini MindFlow durumuna dönüştür
   */
  private mapTrelloListToStatus(listName: string): NodeStatus {
    const name = listName.toLowerCase();
    if (name.includes('done') || name.includes('completed') || name.includes('tamamlandı')) {
      return 'done';
    }
    if (name.includes('progress') || name.includes('doing') || name.includes('devam')) {
      return 'in-progress';
    }
    if (name.includes('blocked') || name.includes('blocked')) {
      return 'blocked';
    }
    return 'todo';
  }

  /**
   * Trello etiketlerini MindFlow önceliğine dönüştür
   */
  private mapTrelloLabelsToPriority(labels: TrelloLabel[]): 'low' | 'medium' | 'high' | 'critical' {
    const hasHighPriority = labels.some(l =>
      l.name.toLowerCase().includes('high') ||
      l.name.toLowerCase().includes('urgent') ||
      l.name.toLowerCase().includes('critical') ||
      l.color === 'red'
    );

    const hasMediumPriority = labels.some(l =>
      l.name.toLowerCase().includes('medium') ||
      l.color === 'orange'
    );

    if (hasHighPriority) return 'high';
    if (hasMediumPriority) return 'medium';
    return 'low';
  }

  /**
   * Trello webhook'u için bildirim al
   */
  async handleWebhook(payload: any): Promise<void> {
    // Handle Trello webhook events
    console.log('Trello webhook received:', payload);

    // In a real implementation, this would update the mind map based on Trello changes
  }
}

export default TrelloService.getInstance();
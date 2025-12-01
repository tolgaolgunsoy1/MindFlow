// src/services/aiService.ts

import { Node, NodeType, MindMap, Connection } from '../types';

export interface AISuggestion {
  id: string;
  type: 'node' | 'connection' | 'improvement' | 'naming';
  title: string;
  description: string;
  confidence: number; // 0-1
  data?: any;
}

export interface SubTaskSuggestion {
  title: string;
  description: string;
  type: NodeType;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: string;
}

export interface MindMapAnalysis {
  completeness: number; // 0-1
  suggestions: AISuggestion[];
  insights: string[];
  optimizationScore: number; // 0-1
}

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Ana görev için alt görev önerileri üret
   */
  async generateSubTasks(mainTask: string, context?: string): Promise<SubTaskSuggestion[]> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const suggestions: SubTaskSuggestion[] = [];

    // Pattern-based suggestions based on common task types
    if (mainTask.toLowerCase().includes('uygulama') || mainTask.toLowerCase().includes('app')) {
      suggestions.push(
        {
          title: 'Kullanıcı arayüzü tasarımı',
          description: 'Wireframe ve mockup oluşturma',
          type: 'feature',
          priority: 'high',
          estimatedTime: '2-3 gün'
        },
        {
          title: 'Backend API geliştirme',
          description: 'RESTful API endpoints oluşturma',
          type: 'technology',
          priority: 'high',
          estimatedTime: '3-4 gün'
        },
        {
          title: 'Veritabanı tasarımı',
          description: 'Schema ve migration oluşturma',
          type: 'technology',
          priority: 'medium',
          estimatedTime: '1-2 gün'
        },
        {
          title: 'Test yazma',
          description: 'Unit ve integration testleri',
          type: 'task',
          priority: 'medium',
          estimatedTime: '2-3 gün'
        }
      );
    } else if (mainTask.toLowerCase().includes('web sitesi') || mainTask.toLowerCase().includes('website')) {
      suggestions.push(
        {
          title: 'Responsive tasarım',
          description: 'Mobil uyumlu tasarım oluşturma',
          type: 'feature',
          priority: 'high',
          estimatedTime: '2-3 gün'
        },
        {
          title: 'SEO optimizasyonu',
          description: 'Meta tags ve performans iyileştirmesi',
          type: 'task',
          priority: 'medium',
          estimatedTime: '1 gün'
        },
        {
          title: 'İçerik yönetimi',
          description: 'CMS sistemi entegrasyonu',
          type: 'technology',
          priority: 'medium',
          estimatedTime: '2-3 gün'
        }
      );
    } else {
      // Generic suggestions based on task analysis
      const words = mainTask.toLowerCase().split(' ');
      if (words.includes('plan') || words.includes('planlama')) {
        suggestions.push({
          title: 'Detaylı plan oluşturma',
          description: 'Adım adım planlama ve timeline oluşturma',
          type: 'task',
          priority: 'high',
          estimatedTime: '1 gün'
        });
      }
      if (words.includes('araştırma') || words.includes('research')) {
        suggestions.push({
          title: 'Kaynak araştırması',
          description: 'İlgili kaynakları ve referansları toplama',
          type: 'task',
          priority: 'medium',
          estimatedTime: '2-3 gün'
        });
      }
      if (words.includes('test') || words.includes('testing')) {
        suggestions.push({
          title: 'Test senaryoları hazırlama',
          description: 'Kapsamlı test planı oluşturma',
          type: 'task',
          priority: 'medium',
          estimatedTime: '1-2 gün'
        });
      }
    }

    // Add some generic suggestions if we don't have enough
    if (suggestions.length < 3) {
      suggestions.push(
        {
          title: 'Dokümantasyon',
          description: 'Kullanım kılavuzu ve teknik dokümantasyon',
          type: 'task',
          priority: 'low',
          estimatedTime: '1-2 gün'
        },
        {
          title: 'İnceleme ve test',
          description: 'Kalite kontrol ve kullanıcı testi',
          type: 'task',
          priority: 'medium',
          estimatedTime: '1 gün'
        }
      );
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Mevcut mind map için iyileştirme önerileri
   */
  async analyzeMindMap(mindMap: MindMap): Promise<MindMapAnalysis> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const suggestions: AISuggestion[] = [];
    const insights: string[] = [];
    let completeness = 0.5;
    let optimizationScore = 0.6;

    const nodes = Object.values(mindMap.nodes);
    const connections = mindMap.connections;

    // Analyze node types distribution
    const nodeTypes = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);

    // Check for missing node types
    const hasIdea = nodeTypes.idea > 0;
    const hasTask = nodeTypes.task > 0;
    const hasFeature = nodeTypes.feature > 0;
    const hasTechnology = nodeTypes.technology > 0;

    if (!hasTask && (hasIdea || hasFeature)) {
      suggestions.push({
        id: 'add_tasks',
        type: 'improvement',
        title: 'Görev düğümleri ekleyin',
        description: 'Fikirlerinizi gerçekleştirilebilir görevlere dönüştürün',
        confidence: 0.8,
      });
    }

    if (!hasTechnology && (hasFeature || hasTask)) {
      suggestions.push({
        id: 'add_technology',
        type: 'improvement',
        title: 'Teknoloji düğümleri ekleyin',
        description: 'Hangi teknolojilerin kullanılacağını belirtin',
        confidence: 0.7,
      });
    }

    // Check connection density
    const connectionDensity = connections.length / Math.max(nodes.length - 1, 1);
    if (connectionDensity < 0.3) {
      suggestions.push({
        id: 'add_connections',
        type: 'improvement',
        title: 'Daha fazla bağlantı ekleyin',
        description: 'Düğümler arasındaki ilişkileri belirginleştirin',
        confidence: 0.6,
      });
    }

    // Check for isolated nodes
    const connectedNodeIds = new Set<string>();
    connections.forEach(conn => {
      connectedNodeIds.add(conn.from);
      connectedNodeIds.add(conn.to);
    });

    const isolatedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    if (isolatedNodes.length > 0) {
      suggestions.push({
        id: 'connect_isolated',
        type: 'connection',
        title: 'Yalıtılmış düğümleri bağlayın',
        description: `${isolatedNodes.length} düğüm diğer düğümlerle bağlantılı değil`,
        confidence: 0.9,
        data: { isolatedNodes }
      });
    }

    // Check for missing priorities
    const nodesWithoutPriority = nodes.filter(node => node.priority === 'medium'); // Default priority
    if (nodesWithoutPriority.length > nodes.length * 0.5) {
      suggestions.push({
        id: 'set_priorities',
        type: 'improvement',
        title: 'Öncelikler belirleyin',
        description: 'Görevlerin önem sırasını ayarlayın',
        confidence: 0.7,
      });
    }

    // Generate insights
    if (nodes.length > 10) {
      insights.push('Haritanız oldukça kapsamlı görünüyor');
    }

    if (connectionDensity > 0.8) {
      insights.push('Düğümler arası bağlantı yoğunluğu yüksek');
    }

    if (hasIdea && hasTask && hasFeature) {
      insights.push('Harita fikirden uygulamaya kadar tam kapsamlı');
      completeness = 0.9;
    }

    // Calculate optimization score
    optimizationScore = Math.min(
      1.0,
      (connectionDensity * 0.3) +
      ((nodes.length > 5 ? 1 : nodes.length / 5) * 0.3) +
      ((hasIdea && hasTask && hasFeature ? 1 : 0) * 0.4)
    );

    return {
      completeness,
      suggestions,
      insights,
      optimizationScore,
    };
  }

  /**
   * Düğüm için akıllı isim önerileri
   */
  async suggestNodeNames(partialName: string, context?: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const suggestions: string[] = [];

    // Pattern-based suggestions
    if (partialName.toLowerCase().includes('api')) {
      suggestions.push(
        'REST API Geliştirme',
        'API Dokümantasyonu',
        'API Test ve Validasyon',
        'API Güvenlik ve Kimlik Doğrulama'
      );
    } else if (partialName.toLowerCase().includes('ui') || partialName.toLowerCase().includes('interface')) {
      suggestions.push(
        'Kullanıcı Arayüzü Tasarımı',
        'UI/UX İyileştirmesi',
        'Responsive Tasarım',
        'Erişilebilirlik İyileştirmesi'
      );
    } else if (partialName.toLowerCase().includes('database') || partialName.toLowerCase().includes('db')) {
      suggestions.push(
        'Veritabanı Tasarımı',
        'Veritabanı Optimizasyonu',
        'Veri Geçişi ve Migration',
        'Backup ve Recovery'
      );
    } else if (partialName.toLowerCase().includes('test')) {
      suggestions.push(
        'Unit Test Yazma',
        'Integration Test',
        'Performance Test',
        'User Acceptance Test'
      );
    } else {
      // Generic suggestions based on common patterns
      const commonSuffixes = [
        'Geliştirme', 'Tasarım', 'İyileştirme', 'Optimizasyon',
        'Dokümantasyon', 'Test', 'Dağıtım', 'Bakım'
      ];

      commonSuffixes.forEach(suffix => {
        if (partialName.length > 2) {
          suggestions.push(`${partialName} ${suffix}`);
        }
      });
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Bağlantı önerileri
   */
  async suggestConnections(mindMap: MindMap, selectedNodeId: string): Promise<AISuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const suggestions: AISuggestion[] = [];
    const selectedNode = mindMap.nodes[selectedNodeId];
    if (!selectedNode) return suggestions;

    const nodes = Object.values(mindMap.nodes);
    const existingConnections = mindMap.connections;

    // Find nodes that could be logically connected
    nodes.forEach(node => {
      if (node.id === selectedNodeId) return;

      // Check if connection already exists
      const existingConnection = existingConnections.find(
        conn => (conn.from === selectedNodeId && conn.to === node.id) ||
                (conn.from === node.id && conn.to === selectedNodeId)
      );

      if (existingConnection) return;

      // Suggest connections based on node types and content
      let shouldSuggest = false;
      let reason = '';

      if (selectedNode.type === 'idea' && node.type === 'task') {
        shouldSuggest = true;
        reason = 'Fikri göreve dönüştürme';
      } else if (selectedNode.type === 'feature' && node.type === 'technology') {
        shouldSuggest = true;
        reason = 'Özelliği teknolojiyle uygulama';
      } else if (selectedNode.type === 'task' && node.type === 'user') {
        shouldSuggest = true;
        reason = 'Görevi kullanıcıya atama';
      } else if (selectedNode.tags.some(tag => node.tags.includes(tag))) {
        shouldSuggest = true;
        reason = 'Ortak etiket bağlantısı';
      }

      if (shouldSuggest) {
        suggestions.push({
          id: `connect_${selectedNodeId}_${node.id}`,
          type: 'connection',
          title: `"${node.title}" ile bağlantı`,
          description: reason,
          confidence: 0.7,
          data: { from: selectedNodeId, to: node.id, type: 'related' }
        });
      }
    });

    return suggestions.slice(0, 3); // Limit suggestions
  }

  /**
   * Zaman tahmini
   */
  async estimateTaskTime(taskDescription: string, complexity: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const baseEstimates = {
      low: { min: 1, max: 4 },
      medium: { min: 2, max: 8 },
      high: { min: 4, max: 16 }
    };

    const estimate = baseEstimates[complexity];

    // Adjust based on task content
    if (taskDescription.toLowerCase().includes('research') || taskDescription.toLowerCase().includes('araştırma')) {
      estimate.min = Math.max(1, estimate.min - 1);
      estimate.max += 2;
    }

    if (taskDescription.toLowerCase().includes('design') || taskDescription.toLowerCase().includes('tasarım')) {
      estimate.min += 1;
      estimate.max += 3;
    }

    if (taskDescription.toLowerCase().includes('test') || taskDescription.toLowerCase().includes('testing')) {
      estimate.min = Math.max(1, estimate.min - 1);
      estimate.max = Math.max(estimate.max - 2, estimate.min + 1);
    }

    return `${estimate.min}-${estimate.max} saat`;
  }
}

export default AIService.getInstance();
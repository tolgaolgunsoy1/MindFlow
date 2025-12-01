// src/services/analyticsService.ts

import { MindMap, Node, Connection, NodeStatus, NodeType } from '../types';

export interface ProductivityMetrics {
  completionRate: number;
  averageTaskTime: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
}

export interface CollaborationMetrics {
  activeUsers: number;
  totalContributions: number;
  mostActiveUsers: Array<{ userId: string; contributions: number }>;
  collaborationScore: number;
}

export interface ProjectHealth {
  overallScore: number; // 0-100
  bottlenecks: Node[];
  upcomingDeadlines: Node[];
  riskAreas: string[];
  recommendations: string[];
}

export interface TimeAnalytics {
  estimatedTotalTime: number;
  actualTimeSpent: number;
  timeEfficiency: number;
  burndownData: Array<{ date: string; remaining: number; completed: number }>;
}

export interface NodeTypeDistribution {
  [key: string]: {
    count: number;
    percentage: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
}

export interface AnalyticsData {
  productivity: ProductivityMetrics;
  collaboration: CollaborationMetrics;
  health: ProjectHealth;
  time: TimeAnalytics;
  distribution: NodeTypeDistribution;
  trends: {
    dailyProgress: Array<{ date: string; completed: number; created: number }>;
    statusChanges: Array<{ date: string; status: NodeStatus; count: number }>;
  };
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Ana mind map için kapsamlı analiz
   */
  async analyzeMindMap(mindMap: MindMap): Promise<AnalyticsData> {
    const nodes = Object.values(mindMap.nodes);
    const connections = mindMap.connections;

    // Paralel hesaplama için Promise.all kullan
    const [
      productivity,
      collaboration,
      health,
      time,
      distribution,
      trends
    ] = await Promise.all([
      this.calculateProductivityMetrics(nodes),
      this.calculateCollaborationMetrics(mindMap),
      this.assessProjectHealth(nodes, connections),
      this.calculateTimeAnalytics(nodes),
      this.calculateNodeDistribution(nodes),
      this.calculateTrends(nodes)
    ]);

    return {
      productivity,
      collaboration,
      health,
      time,
      distribution,
      trends
    };
  }

  /**
   * Verimlilik metriklerini hesapla
   */
  private async calculateProductivityMetrics(nodes: Node[]): Promise<ProductivityMetrics> {
    const totalTasks = nodes.length;
    const completedTasks = nodes.filter(n => n.status === 'done').length;
    const inProgressTasks = nodes.filter(n => n.status === 'in-progress').length;
    const blockedTasks = nodes.filter(n => n.status === 'blocked').length;

    // Geçmiş tarihli görevleri overdue olarak işaretle
    const now = new Date();
    const overdueTasks = nodes.filter(n =>
      n.dueDate && new Date(n.dueDate) < now && n.status !== 'done'
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Ortalama görev süresi tahmini (saat bazlı)
    const averageTaskTime = this.estimateAverageTaskTime(nodes);

    return {
      completionRate,
      averageTaskTime,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks
    };
  }

  /**
   * İşbirliği metriklerini hesapla
   */
  private async calculateCollaborationMetrics(mindMap: MindMap): Promise<CollaborationMetrics> {
    // Bu basit implementasyonda mock data kullanıyoruz
    // Gerçek uygulamada commit history ve user activity'den hesaplanır
    const activeUsers = 1; // Current user
    const totalContributions = Object.keys(mindMap.nodes).length;

    const mostActiveUsers = [
      { userId: mindMap.ownerId, contributions: totalContributions }
    ];

    // İşbirliği skoru: bağlantı sayısı ve düğüm sayısı bazlı
    const collaborationScore = Math.min(100,
      (mindMap.connections.length * 10) + (Object.keys(mindMap.nodes).length * 5)
    );

    return {
      activeUsers,
      totalContributions,
      mostActiveUsers,
      collaborationScore
    };
  }

  /**
   * Proje sağlığını değerlendir
   */
  private async assessProjectHealth(nodes: Node[], connections: Connection[]): Promise<ProjectHealth> {
    let overallScore = 100;

    // Bottleneck'leri belirle (blocked durumundaki düğümler)
    const bottlenecks = nodes.filter(n => n.status === 'blocked');

    // Yaklaşan deadline'ları kontrol et
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = nodes.filter(n =>
      n.dueDate &&
      new Date(n.dueDate) <= nextWeek &&
      new Date(n.dueDate) >= now &&
      n.status !== 'done'
    );

    // Risk alanlarını belirle
    const riskAreas: string[] = [];
    const recommendations: string[] = [];

    // Risk değerlendirmesi
    if (bottlenecks.length > 0) {
      riskAreas.push(`${bottlenecks.length} tıkanıklık noktası`);
      recommendations.push('Tıkanıklık noktalarını çözün');
      overallScore -= bottlenecks.length * 10;
    }

    if (upcomingDeadlines.length > 0) {
      riskAreas.push(`${upcomingDeadlines.length} yaklaşan deadline`);
      recommendations.push('Yaklaşan deadline\'ları takip edin');
      overallScore -= upcomingDeadlines.length * 5;
    }

    // Bağlantı yoğunluğu kontrolü
    const connectionDensity = connections.length / Math.max(nodes.length - 1, 1);
    if (connectionDensity < 0.3) {
      riskAreas.push('Düşük bağlantı yoğunluğu');
      recommendations.push('Düğümler arası ilişkileri güçlendirin');
      overallScore -= 20;
    }

    // Tamamlanma oranı kontrolü
    const completionRate = nodes.filter(n => n.status === 'done').length / nodes.length;
    if (completionRate < 0.3) {
      riskAreas.push('Düşük tamamlanma oranı');
      recommendations.push('Görevleri tamamlamaya odaklanın');
      overallScore -= 15;
    }

    // Öncelik dağılımı kontrolü
    const highPriorityTasks = nodes.filter(n => n.priority === 'high' || n.priority === 'critical');
    const completedHighPriority = highPriorityTasks.filter(n => n.status === 'done').length;
    if (highPriorityTasks.length > 0 && completedHighPriority / highPriorityTasks.length < 0.5) {
      riskAreas.push('Yüksek öncelikli görevler tamamlanmamış');
      recommendations.push('Yüksek öncelikli görevlere odaklanın');
      overallScore -= 10;
    }

    return {
      overallScore: Math.max(0, overallScore),
      bottlenecks,
      upcomingDeadlines,
      riskAreas,
      recommendations
    };
  }

  /**
   * Zaman analizi hesapla
   */
  private async calculateTimeAnalytics(nodes: Node[]): Promise<TimeAnalytics> {
    // Tahmini toplam süre (saat)
    const estimatedTotalTime = nodes.reduce((total, node) => {
      const baseTime = this.getEstimatedTimeForNode(node);
      return total + baseTime;
    }, 0);

    // Gerçek harcanan süre (mock data - gerçek uygulamada tracking'den gelir)
    const actualTimeSpent = estimatedTotalTime * 0.7; // %70 tamamlanmış varsayalım

    const timeEfficiency = estimatedTotalTime > 0 ? (actualTimeSpent / estimatedTotalTime) * 100 : 0;

    // Burndown chart data
    const burndownData = this.generateBurndownData(nodes);

    return {
      estimatedTotalTime,
      actualTimeSpent,
      timeEfficiency,
      burndownData
    };
  }

  /**
   * Düğüm türü dağılımını hesapla
   */
  private async calculateNodeDistribution(nodes: Node[]): Promise<NodeTypeDistribution> {
    const distribution: NodeTypeDistribution = {};

    // Tüm node türlerini başlat
    const allTypes: NodeType[] = ['idea', 'scope', 'feature', 'task', 'user', 'technology'];
    allTypes.forEach(type => {
      distribution[type] = { count: 0, percentage: 0, completed: 0, inProgress: 0, blocked: 0 };
    });

    // Gerçek sayıları hesapla
    nodes.forEach(node => {
      if (distribution[node.type]) {
        distribution[node.type].count++;
        switch (node.status) {
          case 'done':
            distribution[node.type].completed++;
            break;
          case 'in-progress':
            distribution[node.type].inProgress++;
            break;
          case 'blocked':
            distribution[node.type].blocked++;
            break;
        }
      }
    });

    // Yüzdeleri hesapla
    const totalNodes = nodes.length;
    Object.keys(distribution).forEach(type => {
      distribution[type].percentage = totalNodes > 0 ? (distribution[type].count / totalNodes) * 100 : 0;
    });

    return distribution;
  }

  /**
   * Trend analizi
   */
  private async calculateTrends(nodes: Node[]): Promise<AnalyticsData['trends']> {
    // Günlük ilerleme (son 30 gün)
    const dailyProgress = this.generateDailyProgress(nodes);

    // Durum değişiklikleri
    const statusChanges = this.generateStatusChanges(nodes);

    return {
      dailyProgress,
      statusChanges
    };
  }

  /**
   * Yardımcı fonksiyonlar
   */
  private estimateAverageTaskTime(nodes: Node[]): number {
    if (nodes.length === 0) return 0;

    const totalEstimatedTime = nodes.reduce((total, node) => {
      return total + this.getEstimatedTimeForNode(node);
    }, 0);

    return totalEstimatedTime / nodes.length;
  }

  private getEstimatedTimeForNode(node: Node): number {
    // Node türüne göre temel süre tahmini (saat)
    const baseTimes: Record<NodeType, number> = {
      idea: 2,
      scope: 4,
      feature: 8,
      task: 6,
      user: 3,
      technology: 5
    };

    let estimatedTime = baseTimes[node.type] || 4;

    // Öncelik çarpanı
    const priorityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
      critical: 1.5
    };

    estimatedTime *= priorityMultiplier[node.priority];

    // Karmaşıklık çarpanı (açıklama uzunluğuna göre)
    if (node.description && node.description.length > 100) {
      estimatedTime *= 1.2;
    }

    return estimatedTime;
  }

  private generateBurndownData(nodes: Node[]): TimeAnalytics['burndownData'] {
    const data: TimeAnalytics['burndownData'] = [];
    const totalTasks = nodes.length;

    // Son 14 gün için veri oluştur
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Basit progress simülasyonu
      const progressRatio = (14 - i) / 14; // Gün geçtikçe ilerleme
      const completed = Math.floor(totalTasks * progressRatio * 0.8); // %80 tamamlanmış
      const remaining = totalTasks - completed;

      data.push({
        date: date.toISOString().split('T')[0],
        remaining,
        completed
      });
    }

    return data;
  }

  private generateDailyProgress(nodes: Node[]): AnalyticsData['trends']['dailyProgress'] {
    const data: AnalyticsData['trends']['dailyProgress'] = [];

    // Son 30 gün için mock data
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Rastgele günlük progress
      const completed = Math.floor(Math.random() * 3); // 0-2 tamamlanan görev
      const created = Math.floor(Math.random() * 2); // 0-1 oluşturulan görev

      data.push({
        date: date.toISOString().split('T')[0],
        completed,
        created
      });
    }

    return data;
  }

  private generateStatusChanges(nodes: Node[]): AnalyticsData['trends']['statusChanges'] {
    const data: AnalyticsData['trends']['statusChanges'] = [];

    // Durum dağılımı
    const statusCounts = nodes.reduce((acc, node) => {
      acc[node.status] = (acc[node.status] || 0) + 1;
      return acc;
    }, {} as Record<NodeStatus, number>);

    // Her durum için bir giriş
    Object.entries(statusCounts).forEach(([status, count]) => {
      data.push({
        date: new Date().toISOString().split('T')[0],
        status: status as NodeStatus,
        count
      });
    });

    return data;
  }

  /**
   * Export fonksiyonları
   */
  async generateReport(mindMap: MindMap): Promise<string> {
    const analytics = await this.analyzeMindMap(mindMap);

    const report = `
MindFlow Analytics Report - ${mindMap.name}
Generated: ${new Date().toLocaleString('tr-TR')}

📊 PRODUCTIVITY METRICS
- Completion Rate: ${analytics.productivity.completionRate.toFixed(1)}%
- Total Tasks: ${analytics.productivity.totalTasks}
- Completed: ${analytics.productivity.completedTasks}
- In Progress: ${analytics.productivity.inProgressTasks}
- Blocked: ${analytics.productivity.blockedTasks}
- Overdue: ${analytics.productivity.overdueTasks}
- Average Task Time: ${analytics.productivity.averageTaskTime.toFixed(1)} hours

🏥 PROJECT HEALTH
- Overall Score: ${analytics.health.overallScore}/100
- Risk Areas: ${analytics.health.riskAreas.join(', ') || 'None'}
- Recommendations: ${analytics.health.recommendations.join(', ') || 'None'}

⏰ TIME ANALYTICS
- Estimated Total Time: ${analytics.time.estimatedTotalTime.toFixed(1)} hours
- Actual Time Spent: ${analytics.time.actualTimeSpent.toFixed(1)} hours
- Time Efficiency: ${analytics.time.timeEfficiency.toFixed(1)}%

🤝 COLLABORATION
- Active Users: ${analytics.collaboration.activeUsers}
- Total Contributions: ${analytics.collaboration.totalContributions}
- Collaboration Score: ${analytics.collaboration.collaborationScore}/100
    `;

    return report;
  }
}

export default AnalyticsService.getInstance();
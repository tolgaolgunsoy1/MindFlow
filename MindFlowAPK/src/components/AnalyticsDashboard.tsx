// src/components/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AnalyticsData, AnalyticsService } from '../services/analyticsService';
import useMindMapStore from '../store/mindMapStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  visible: boolean;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ visible, onClose }) => {
  const { currentMap, analyticsData, isAnalyzing, actions } = useMindMapStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'productivity' | 'health' | 'trends'>('overview');

  useEffect(() => {
    if (visible && currentMap && !analyticsData) {
      actions.analyzeMindMapAnalytics();
    }
  }, [visible, currentMap, analyticsData]);

  const handleShareReport = async () => {
    try {
      const report = await actions.generateAnalyticsReport();
      await Share.share({
        message: report,
        title: `${currentMap?.name} - Analytics Report`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, color = '#2196F3') => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderProgressBar = (value: number, max: number = 100, color = '#4CAF50') => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const renderStatusDistribution = () => {
    if (!analyticsData) return null;

    const { distribution } = analyticsData;
    const statusData = [
      { status: 'Tamamlandı', count: Object.values(distribution).reduce((sum, d) => sum + d.completed, 0), color: '#4CAF50' },
      { status: 'Devam Ediyor', count: Object.values(distribution).reduce((sum, d) => sum + d.inProgress, 0), color: '#FFC107' },
      { status: 'Bekliyor', count: Object.values(distribution).reduce((sum, d) => sum + d.count - d.completed - d.inProgress - d.blocked, 0), color: '#2196F3' },
      { status: 'Blokeli', count: Object.values(distribution).reduce((sum, d) => sum + d.blocked, 0), color: '#F44336' },
    ];

    const total = statusData.reduce((sum, item) => sum + item.count, 0);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Durum Dağılımı</Text>
        {statusData.map((item, index) => (
          <View key={index} style={styles.chartItem}>
            <View style={styles.chartLabel}>
              <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
              <Text style={styles.chartItemText}>{item.status}</Text>
            </View>
            <View style={styles.chartBar}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    width: total > 0 ? `${(item.count / total) * 100}%` : '0%',
                    backgroundColor: item.color
                  }
                ]}
              />
              <Text style={styles.chartBarText}>{item.count}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderBurndownChart = () => {
    if (!analyticsData?.time.burndownData) return null;

    const data = analyticsData.time.burndownData;
    const maxRemaining = Math.max(...data.map(d => d.remaining));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Burndown Chart</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.burndownContainer}>
            {data.map((point, index) => (
              <View key={index} style={styles.burndownPoint}>
                <View
                  style={[
                    styles.burndownBar,
                    {
                      height: maxRemaining > 0 ? `${(point.remaining / maxRemaining) * 100}%` : '0%',
                      backgroundColor: point.remaining > 0 ? '#FFC107' : '#4CAF50'
                    }
                  ]}
                />
                <Text style={styles.burndownLabel}>
                  {new Date(point.date).getDate()}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    const { productivity, health, collaboration, time } = analyticsData;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          {renderMetricCard('Tamamlanma Oranı', `${productivity.completionRate.toFixed(1)}%`, 'Görevlerin tamamlanma yüzdesi')}
          {renderMetricCard('Toplam Görev', productivity.totalTasks, 'Tüm düğümler')}
          {renderMetricCard('Aktif Kullanıcı', collaboration.activeUsers, 'İşbirliği yapan kişi')}
          {renderMetricCard('Proje Sağlığı', `${health.overallScore}/100`, 'Genel performans skoru')}
        </View>

        {/* Progress Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İlerleme Özeti</Text>
          <View style={styles.progressOverview}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Tamamlanan</Text>
              {renderProgressBar(productivity.completedTasks, productivity.totalTasks, '#4CAF50')}
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Devam Eden</Text>
              {renderProgressBar(productivity.inProgressTasks, productivity.totalTasks, '#FFC107')}
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Bekleyen</Text>
              {renderProgressBar(productivity.totalTasks - productivity.completedTasks - productivity.inProgressTasks - productivity.blockedTasks, productivity.totalTasks, '#2196F3')}
            </View>
          </View>
        </View>

        {/* Status Distribution */}
        {renderStatusDistribution()}

        {/* Health Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sağlık Görüşleri</Text>
          {health.riskAreas.map((risk, index) => (
            <View key={index} style={styles.riskItem}>
              <Icon name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.riskText}>{risk}</Text>
            </View>
          ))}
          {health.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Icon name="lightbulb" size={16} color="#4CAF50" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderProductivityTab = () => {
    if (!analyticsData) return null;

    const { productivity, time } = analyticsData;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {renderMetricCard('Ortalama Görev Süresi', `${productivity.averageTaskTime.toFixed(1)}h`, 'Tahmini tamamlanma')}
          {renderMetricCard('Zaman Verimliliği', `${time.timeEfficiency.toFixed(1)}%`, 'Tahmin vs gerçek süre')}
          {renderMetricCard('Geciken Görevler', productivity.overdueTasks, 'Deadline geçmiş')}
          {renderMetricCard('Blokeli Görevler', productivity.blockedTasks, 'Engellenmiş görevler')}
        </View>

        {renderBurndownChart()}
      </ScrollView>
    );
  };

  const renderHealthTab = () => {
    if (!analyticsData) return null;

    const { health } = analyticsData;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.healthScore}>
          <Text style={styles.healthScoreTitle}>Proje Sağlık Skoru</Text>
          <View style={styles.healthScoreContainer}>
            <View style={[styles.healthScoreBar, { width: `${health.overallScore}%` }]} />
            <Text style={styles.healthScoreText}>{health.overallScore}/100</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Alanları</Text>
          {health.riskAreas.map((risk, index) => (
            <View key={index} style={styles.riskItem}>
              <Icon name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.riskText}>{risk}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öneriler</Text>
          {health.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Icon name="lightbulb" size={16} color="#4CAF50" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan Deadline'lar</Text>
          {health.upcomingDeadlines.map((node, index) => (
            <View key={index} style={styles.deadlineItem}>
              <Icon name="calendar-clock" size={16} color="#F44336" />
              <View style={styles.deadlineContent}>
                <Text style={styles.deadlineTitle}>{node.title}</Text>
                <Text style={styles.deadlineDate}>
                  {node.dueDate ? new Date(node.dueDate).toLocaleDateString('tr-TR') : 'Tarih yok'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTrendsTab = () => {
    if (!analyticsData) return null;

    const { trends } = analyticsData;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Günlük İlerleme</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.trendsContainer}>
              {trends.dailyProgress.map((day, index) => (
                <View key={index} style={styles.trendDay}>
                  <View style={styles.trendBars}>
                    <View
                      style={[
                        styles.trendBar,
                        { height: day.completed * 10, backgroundColor: '#4CAF50' }
                      ]}
                    />
                    <View
                      style={[
                        styles.trendBar,
                        { height: day.created * 10, backgroundColor: '#2196F3' }
                      ]}
                    />
                  </View>
                  <Text style={styles.trendLabel}>
                    {new Date(day.date).getDate()}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Tamamlanan</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Oluşturulan</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.dashboard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="chart-line" size={24} color="#2196F3" />
            <Text style={styles.headerTitle}>Analitik Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShareReport} style={styles.shareButton}>
              <Icon name="share-variant" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'overview', label: 'Genel', icon: 'view-dashboard' },
            { key: 'productivity', label: 'Verimlilik', icon: 'chart-bar' },
            { key: 'health', label: 'Sağlık', icon: 'heart' },
            { key: 'trends', label: 'Trendler', icon: 'trending-up' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={selectedTab === tab.key ? '#2196F3' : '#666'}
              />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {isAnalyzing ? (
          <View style={styles.loadingContainer}>
            <Icon name="chart-line" size={48} color="#2196F3" />
            <Text style={styles.loadingText}>Analiz ediliyor...</Text>
          </View>
        ) : (
          <>
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'productivity' && renderProductivityTab()}
            {selectedTab === 'health' && renderHealthTab()}
            {selectedTab === 'trends' && renderTrendsTab()}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shareButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 32 - 12) / 2,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressOverview: {
    gap: 12,
  },
  progressItem: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 12,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: 2,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  chartContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartItemText: {
    fontSize: 14,
    color: '#333',
  },
  chartBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  chartBarText: {
    position: 'absolute',
    right: 8,
    top: 2,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  burndownContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    paddingVertical: 20,
    gap: 8,
  },
  burndownPoint: {
    alignItems: 'center',
    minWidth: 30,
  },
  burndownBar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  burndownLabel: {
    fontSize: 10,
    color: '#666',
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  riskText: {
    fontSize: 14,
    color: '#E65100',
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C62828',
  },
  deadlineDate: {
    fontSize: 12,
    color: '#E53935',
  },
  healthScore: {
    marginBottom: 24,
  },
  healthScoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  healthScoreContainer: {
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  healthScoreBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  healthScoreText: {
    position: 'absolute',
    right: 16,
    top: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  trendsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: 20,
    gap: 12,
  },
  trendDay: {
    alignItems: 'center',
    minWidth: 40,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  trendBar: {
    width: 16,
    borderRadius: 2,
  },
  trendLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default AnalyticsDashboard;
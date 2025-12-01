// src/screens/TimelineScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useMindMapStore from '../store/mindMapStore';
import { Node, MindMap } from '../types';

interface TimelineScreenProps {
  navigation: any;
  route: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TimelineScreen: React.FC<TimelineScreenProps> = ({ navigation, route }) => {
  const { currentMap, actions } = useMindMapStore();
  const [selectedProject, setSelectedProject] = useState<MindMap | null>(null);
  const [timelineData, setTimelineData] = useState<Node[]>([]);
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');

  useEffect(() => {
    if (route.params?.mapId) {
      // Load specific project
      // For now, we'll use currentMap
      if (currentMap) {
        setSelectedProject(currentMap);
        prepareTimelineData(currentMap);
      }
    }
  }, [route.params, currentMap]);

  const prepareTimelineData = (project: MindMap) => {
    const nodes = Object.values(project.nodes);
    const tasksWithDates = nodes.filter(node =>
      node.dueDate || node.status === 'in-progress' || node.status === 'todo'
    );

    // Sort by due date
    const sortedTasks = tasksWithDates.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    });

    setTimelineData(sortedTasks);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'todo': '#FFC107',
      'in-progress': '#2196F3',
      'done': '#4CAF50',
      'blocked': '#F44336',
    };
    return colors[status] || '#666';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': '#4CAF50',
      'medium': '#FFC107',
      'high': '#FF9800',
      'critical': '#F44336',
    };
    return colors[priority] || '#666';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderTimelineItem = (node: Node, index: number) => {
    const daysUntilDue = node.dueDate ? getDaysUntilDue(node.dueDate) : null;
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

    return (
      <View key={node.id} style={styles.timelineItem}>
        {/* Timeline line */}
        <View style={styles.timelineLine}>
          <View style={[styles.timelineDot, { backgroundColor: getStatusColor(node.status) }]} />
          {index < timelineData.length - 1 && <View style={styles.timelineConnector} />}
        </View>

        {/* Task card */}
        <TouchableOpacity
          style={[styles.taskCard, isOverdue && styles.overdueCard]}
          onPress={() => navigation.navigate('Editor', { mapId: selectedProject?.id })}
        >
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{node.title}</Text>
            <View style={styles.taskBadges}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(node.status) }]}>
                <Text style={styles.statusText}>{node.status}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(node.priority) }]}>
                <Text style={styles.priorityText}>{node.priority}</Text>
              </View>
            </View>
          </View>

          {node.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {node.description}
            </Text>
          )}

          <View style={styles.taskFooter}>
            <View style={styles.taskMeta}>
              {node.dueDate && (
                <View style={styles.dueDateContainer}>
                  <Icon name="calendar" size={14} color={isOverdue ? '#F44336' : '#666'} />
                  <Text style={[styles.dueDate, isOverdue && styles.overdueText]}>
                    {formatDate(node.dueDate)}
                  </Text>
                  {daysUntilDue !== null && (
                    <Text style={[styles.daysLeft, isOverdue && styles.overdueText]}>
                      {isOverdue ? `${Math.abs(daysUntilDue)} gün geçti` :
                       daysUntilDue === 0 ? 'Bugün' :
                       `${daysUntilDue} gün`}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {node.progress !== undefined && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>{node.progress}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${node.progress}%` }]}
                  />
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGanttView = () => {
    // Simple Gantt chart representation
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days ahead

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.ganttContainer}>
          {/* Header */}
          <View style={styles.ganttHeader}>
            <Text style={styles.ganttHeaderText}>Görevler</Text>
            <Text style={styles.ganttHeaderText}>Takvim</Text>
          </View>

          {/* Tasks */}
          {timelineData.map((node, index) => (
            <View key={node.id} style={styles.ganttRow}>
              <View style={styles.ganttTaskName}>
                <Text style={styles.ganttTaskTitle} numberOfLines={1}>
                  {node.title}
                </Text>
                <View style={[styles.ganttStatusDot, { backgroundColor: getStatusColor(node.status) }]} />
              </View>

              <View style={styles.ganttTimeline}>
                {/* Render timeline bars here */}
                {node.dueDate && (
                  <View
                    style={[
                      styles.ganttBar,
                      {
                        backgroundColor: getStatusColor(node.status),
                        left: 100, // Calculate based on date
                        width: 50, // Calculate based on duration
                      }
                    ]}
                  >
                    <Text style={styles.ganttBarText}>{node.title}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (!selectedProject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Proje yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedProject.name} - Timeline</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'timeline' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('timeline')}
          >
            <Icon name="timeline" size={20} color={viewMode === 'timeline' ? '#FFF' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'gantt' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('gantt')}
          >
            <Icon name="chart-gantt" size={20} color={viewMode === 'gantt' ? '#FFF' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'timeline' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {timelineData.length > 0 ? (
            timelineData.map((node, index) => renderTimelineItem(node, index))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="timeline-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>Zaman çizelgesi boş</Text>
              <Text style={styles.emptySubtext}>
                Bitiş tarihi olan görevler burada görünecek
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        renderGanttView()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLine: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
  },
  taskCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flex: 1,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  overdueText: {
    color: '#F44336',
  },
  daysLeft: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  ganttContainer: {
    padding: 16,
    minWidth: SCREEN_WIDTH,
  },
  ganttHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ganttHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 150,
  },
  ganttRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ganttTaskName: {
    width: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ganttTaskTitle: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  ganttStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ganttTimeline: {
    flex: 1,
    height: 30,
    position: 'relative',
  },
  ganttBar: {
    position: 'absolute',
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ganttBarText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default TimelineScreen;
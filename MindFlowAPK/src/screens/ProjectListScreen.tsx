// src/screens/ProjectListScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MindMap } from '../types';
import useMindMapStore from '../store/mindMapStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useOfflineStore from '../store/offlineStore';
import useNotificationStore from '../store/notificationStore';
import ServiceManager from '../services/serviceManager';
import { ExportService } from '../services/exportService';
import { Alert, Share } from 'react-native';
import FilterModal from '../components/FilterModal';

interface ProjectListScreenProps {
  navigation: any;
}

const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation }) => {
  const { currentMap, actions } = useMindMapStore();
  const { user, actions: authActions } = useAuthStore();
  const { isDark, actions: themeActions } = useThemeStore();
  const { isOnline, pendingChanges } = useOfflineStore();
  const { unreadCount } = useNotificationStore();
  const [projects, setProjects] = useState<MindMap[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<MindMap[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    hasDueDate: false,
    hasAttachments: false,
    dateRange: null as { start: Date; end: Date } | null,
    tags: [] as string[],
    progressRange: null as { min: number; max: number } | null,
    creator: null as string | null,
    assignee: null as string | null,
    searchQuery: '',
    sortBy: 'updated' as 'name' | 'created' | 'updated' | 'priority' | 'dueDate',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [savedPresets, setSavedPresets] = useState<{ name: string; filters: typeof filters }[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, filters]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const user = await ServiceManager.getCurrentUser();
      if (user) {
        const userProjects = await ServiceManager.getUserMindMaps(user.uid);
        setProjects(userProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Combined search (from both search input and filters)
    const searchText = (searchQuery + filters.searchQuery).trim();
    if (searchText) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchText.toLowerCase())) ||
        (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase())))
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(project => {
        const nodes = Object.values(project.nodes);
        return nodes.some(node => filters.status.includes(node.status));
      });
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(project => {
        const nodes = Object.values(project.nodes);
        return nodes.some(node => filters.priority.includes(node.priority));
      });
    }

    // Due date filter
    if (filters.hasDueDate) {
      filtered = filtered.filter(project => {
        const nodes = Object.values(project.nodes);
        return nodes.some(node => node.dueDate);
      });
    }

    // Attachments filter
    if (filters.hasAttachments) {
      filtered = filtered.filter(project => {
        const nodes = Object.values(project.nodes);
        return nodes.some(node => node.attachments && node.attachments.length > 0);
      });
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.updatedAt);
        return projectDate >= filters.dateRange!.start && projectDate <= filters.dateRange!.end;
      });
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(project => {
        if (!project.tags) return false;
        return filters.tags.some(filterTag =>
          project.tags!.some(projectTag =>
            projectTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
      });
    }

    // Progress range filter
    if (filters.progressRange) {
      filtered = filtered.filter(project => {
        const nodes = Object.values(project.nodes);
        return nodes.some(node => {
          const progress = node.progress || 0;
          return progress >= filters.progressRange!.min && progress <= filters.progressRange!.max;
        });
      });
    }

    // Creator filter
    if (filters.creator) {
      filtered = filtered.filter(project => project.ownerId === filters.creator);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'priority':
          // Calculate average priority score
          const getPriorityScore = (project: MindMap) => {
            const nodes = Object.values(project.nodes);
            if (nodes.length === 0) return 0;
            const scores = { low: 1, medium: 2, high: 3, critical: 4 };
            const totalScore = nodes.reduce((sum, node) => sum + (scores[node.priority] || 0), 0);
            return totalScore / nodes.length;
          };
          aValue = getPriorityScore(a);
          bValue = getPriorityScore(b);
          break;
        case 'dueDate':
          // Find earliest due date
          const getEarliestDueDate = (project: MindMap) => {
            const nodes = Object.values(project.nodes);
            const dueDates = nodes
              .map(node => node.dueDate)
              .filter(date => date)
              .map(date => new Date(date!));
            return dueDates.length > 0 ? Math.min(...dueDates.map(d => d.getTime())) : Infinity;
          };
          aValue = getEarliestDueDate(a);
          bValue = getEarliestDueDate(b);
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleProjectPress = (project: MindMap) => {
    actions.loadMap(project);
    navigation.navigate('Editor', { mapId: project.id });
  };

  const handleCreateProject = () => {
    navigation.navigate('Templates');
  };

  const handleLogout = async () => {
    try {
      await authActions.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleToggleTheme = () => {
    themeActions.toggleTheme();
  };

  const handleShowNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      hasDueDate: false,
      hasAttachments: false,
      dateRange: null,
      tags: [],
      progressRange: null,
      creator: null,
      assignee: null,
      searchQuery: '',
      sortBy: 'updated',
      sortOrder: 'desc',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.hasDueDate) count++;
    if (filters.hasAttachments) count++;
    if (filters.dateRange) count++;
    if (filters.tags.length > 0) count++;
    if (filters.progressRange) count++;
    if (filters.creator) count++;
    if (filters.assignee) count++;
    if (filters.searchQuery.trim()) count++;
    return count;
  };

  const handleImportMindMap = () => {
    Alert.alert(
      'Import Mind Map',
      'Paste your MindFlow JSON data below:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Import',
          onPress: () => {
            // For demo purposes, we'll use a simple prompt
            // In a real app, you'd use a proper input dialog
            Alert.prompt(
              'Import JSON',
              'Paste your exported MindFlow JSON data:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Import',
                  onPress: async (jsonString) => {
                    if (!jsonString) return;

                    try {
                      const importedMap = await ExportService.importFromJSON(jsonString);
                      // Create new mind map in Firebase (will get new ID)
                      const { id, ...mapData } = importedMap;
                      await ServiceManager.createMindMap({
                        ...mapData,
                        name: `${mapData.name} (Imported)`,
                      });
                      // Reload projects
                      loadProjects();
                      Alert.alert('Success', 'Mind map imported successfully!');
                    } catch (error) {
                      Alert.alert('Import Error', 'Failed to import mind map. Please check the JSON format.');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const renderProjectItem = ({ item }: { item: MindMap }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Icon name="chevron-right" size={24} color="#666" />
      </View>
      <View style={styles.projectMeta}>
        <Text style={styles.projectInfo}>
          {Object.keys(item.nodes).length} düğüm • {item.connections.length} bağlantı
        </Text>
        <Text style={styles.projectDate}>
          {new Date(item.updatedAt).toLocaleDateString('tr-TR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Projeler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MindFlow Projeleri</Text>
          <View style={styles.headerSubtitleRow}>
            {user && (
              <Text style={styles.headerSubtitle}>Merhaba, {user.displayName}</Text>
            )}
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Icon name="wifi-off" size={12} color="#FF9800" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
            {pendingChanges.operations.length > 0 && (
              <View style={styles.pendingIndicator}>
                <Icon name="sync" size={12} color="#2196F3" />
                <Text style={styles.pendingText}>{pendingChanges.operations.length}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShowNotifications} style={styles.headerButton}>
            <Icon name="bell" size={24} color="#666" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleTheme} style={styles.headerButton}>
            <Icon name={isDark ? "weather-sunny" : "weather-night"} size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImportMindMap} style={styles.headerButton}>
            <Icon name="file-import" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreateProject} style={styles.headerButton}>
            <Icon name="plus" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
            <Icon name="logout" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Proje ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, getActiveFilterCount() > 0 && styles.filterButtonActive]}
          onPress={handleToggleFilters}
        >
          <Icon name="filter-variant" size={20} color={getActiveFilterCount() > 0 ? "#FFF" : "#666"} />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Project List */}
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="file-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Henüz proje yok</Text>
            <Text style={styles.emptySubtext}>Yeni bir proje oluşturmak için + butonuna basın</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setShowFilters(false)}
        onClear={handleClearFilters}
        onSavePreset={(name, presetFilters) => {
          setSavedPresets(prev => [...prev, { name, filters: presetFilters }]);
        }}
        savedPresets={savedPresets}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  offlineText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  pendingText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectInfo: {
    fontSize: 14,
    color: '#666',
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
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
});

export default ProjectListScreen;

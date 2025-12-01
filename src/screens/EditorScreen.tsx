// src/screens/EditorScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Canvas from '../components/Canvas';
import NodeDetailsSheet from '../components/NodeDetailsSheet';
import useMindMapStore from '../store/mindMapStore';
import useAuthStore from '../store/authStore';
import useCollaborationStore from '../store/collaborationStore';
import { Node, NodeType } from '../types';
import { ExportService } from '../services/exportService';
import { LayoutService, LayoutAlgorithm } from '../services/layoutService';
import AISuggestionsPanel from '../components/AISuggestionsPanel';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import IntegrationManager from '../components/IntegrationManager';
import VideoConference from '../components/VideoConference';
import GamificationDashboard from '../components/GamificationDashboard';
import { Alert, Share } from 'react-native';

interface EditorScreenProps {
  navigation: any;
  route: any;
}

const EditorScreen: React.FC<EditorScreenProps> = ({ navigation, route }) => {
  const { mapId } = route.params;
  const { currentMap, selectedNode, zoom, actions } = useMindMapStore();
  const { user } = useAuthStore();
  const { activeUsers, actions: collabActions } = useCollaborationStore();

  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  // Initialize collaboration session
  useEffect(() => {
    if (user && mapId) {
      const cleanup = collabActions.joinSession(mapId, user.id, user.displayName);
      return cleanup;
    }
  }, [user, mapId]);

  // Update selected node in collaboration
  useEffect(() => {
    if (selectedNode) {
      collabActions.selectNode(selectedNode.id);
    } else {
      collabActions.selectNode(null);
    }
  }, [selectedNode]);

  const nodeTypes: { type: NodeType; label: string; icon: string; color: string }[] = [
    { type: 'idea', label: 'Fikir', icon: 'lightbulb', color: '#FFC107' },
    { type: 'scope', label: 'Kapsam', icon: 'target', color: '#2196F3' },
    { type: 'feature', label: 'Özellik', icon: 'star', color: '#4CAF50' },
    { type: 'task', label: 'Görev', icon: 'checkbox-marked', color: '#9C27B0' },
    { type: 'user', label: 'Kullanıcı', icon: 'account', color: '#FF5722' },
    { type: 'technology', label: 'Teknoloji', icon: 'code-tags', color: '#607D8B' },
  ];

  const handleAddNode = (type: NodeType) => {
    const newNode: Omit<Node, 'id'> = {
      type,
      title: `Yeni ${nodeTypes.find(nt => nt.type === type)?.label}`,
      description: '',
      position: { x: 200, y: 200 },
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    actions.addNode(newNode);
    setShowNodeMenu(false);
  };

  const handleNodePress = (node: Node) => {
    actions.setSelectedNode(node);
    setShowDetailsSheet(true);
  };

  const handleZoomIn = () => {
    actions.setZoom(Math.min(zoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    actions.setZoom(Math.max(zoom - 0.1, 0.5));
  };

  const handleExportJSON = async () => {
    try {
      if (!currentMap) return;
      const jsonData = await ExportService.exportToJSON(currentMap);
      await Share.share({
        message: `MindFlow Export: ${currentMap.name}\n\n${jsonData}`,
        title: `${currentMap.name} - MindFlow Mind Map`,
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export mind map');
    }
  };

  const handleExportSVG = async () => {
    try {
      if (!currentMap) return;
      const svgData = await ExportService.exportToSVG(currentMap, zoom);
      await Share.share({
        message: `MindFlow SVG Export: ${currentMap.name}\n\n${svgData}`,
        title: `${currentMap.name} - MindFlow Mind Map (SVG)`,
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export SVG');
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!currentMap) return;
      const htmlContent = await ExportService.exportToPDF(currentMap);
      // For now, share as HTML content (would need PDF library for actual PDF)
      await Share.share({
        message: `MindFlow PDF Export: ${currentMap.name}\n\n${htmlContent}`,
        title: `${currentMap.name} - MindFlow Mind Map (HTML)`,
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export PDF');
    }
  };

  const handleShowExportMenu = () => {
    Alert.alert(
      'Export Options',
      'Choose export format',
      [
        { text: 'JSON', onPress: handleExportJSON },
        { text: 'SVG', onPress: handleExportSVG },
        { text: 'PDF (HTML)', onPress: handleExportPDF },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleApplyLayout = (algorithm: LayoutAlgorithm) => {
    actions.applyLayout(algorithm);
    setShowLayoutMenu(false);
  };

  const handleCenterOnNode = () => {
    if (selectedNode) {
      actions.centerOnNode(selectedNode.id);
      setShowLayoutMenu(false);
    }
  };

  const layoutOptions: { algorithm: LayoutAlgorithm; label: string; icon: string }[] = [
    { algorithm: 'force-directed', label: 'Güç Yönelimli', icon: 'atom' },
    { algorithm: 'hierarchical', label: 'Hiyerarşik', icon: 'sitemap' },
    { algorithm: 'circular', label: 'Dairesel', icon: 'circle-outline' },
    { algorithm: 'grid', label: 'Izgara', icon: 'grid' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentMap?.name || 'MindFlow'}</Text>
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle}>
              {currentMap ? Object.keys(currentMap.nodes).length : 0} düğüm
            </Text>
            {activeUsers.length > 0 && (
              <View style={styles.collaborationIndicator}>
                <Icon name="account-group" size={12} color="#4CAF50" />
                <Text style={styles.collaborationText}>{activeUsers.length}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Timeline', { mapId })}>
            <Icon name="timeline-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLayoutMenu(true)}>
            <Icon name="arrange-bring-forward" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowHistory(true)}>
            <Icon name="history" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowGamification(true)}>
            <Icon name="trophy" size={24} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowVideoConference(true)}>
            <Icon name="video" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowIntegrations(true)}>
            <Icon name="link" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAnalytics(true)}>
            <Icon name="chart-line" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAISuggestions(true)}>
            <Icon name="robot" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCommitDialog(true)}>
            <Icon name="source-commit" size={24} color={actions.hasUncommittedChanges() ? "#FF9800" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShowExportMenu}>
            <Icon name="share-variant" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Canvas */}
      <Canvas onNodePress={handleNodePress} />

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Icon name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Icon name="minus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* FAB - Add Node */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNodeMenu(true)}
      >
        <Icon name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Node Type Menu */}
      <Modal
        visible={showNodeMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNodeMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowNodeMenu(false)}
        >
          <View style={styles.nodeMenu}>
            <Text style={styles.menuTitle}>Düğüm Türü Seç</Text>
            
            <FlatList
              data={nodeTypes}
              keyExtractor={(item) => item.type}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.nodeTypeButton, { backgroundColor: item.color }]}
                  onPress={() => handleAddNode(item.type)}
                >
                  <Icon name={item.icon} size={32} color="#FFF" />
                  <Text style={styles.nodeTypeLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Layout Menu */}
      <Modal
        visible={showLayoutMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLayoutMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowLayoutMenu(false)}
        >
          <View style={styles.layoutMenu}>
            <Text style={styles.menuTitle}>Düzenleme Algoritması</Text>

            {layoutOptions.map((option) => (
              <TouchableOpacity
                key={option.algorithm}
                style={styles.layoutOption}
                onPress={() => handleApplyLayout(option.algorithm)}
              >
                <Icon name={option.icon} size={24} color="#2196F3" />
                <Text style={styles.layoutOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            {selectedNode && (
              <TouchableOpacity
                style={styles.layoutOption}
                onPress={handleCenterOnNode}
              >
                <Icon name="target" size={24} color="#2196F3" />
                <Text style={styles.layoutOptionText}>Seçili Düğüme Odaklan</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Commit Dialog */}
      <Modal
        visible={showCommitDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCommitDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commitDialog}>
            <Text style={styles.dialogTitle}>Değişiklikleri Kaydet</Text>
            <TextInput
              style={styles.commitMessageInput}
              value={commitMessage}
              onChangeText={setCommitMessage}
              placeholder="Commit mesajı..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCommitDialog(false);
                  setCommitMessage('');
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commitButton}
                onPress={() => {
                  if (commitMessage.trim()) {
                    actions.commitChanges(commitMessage, user?.displayName || 'Anonymous');
                    setShowCommitDialog(false);
                    setCommitMessage('');
                  }
                }}
              >
                <Text style={styles.commitButtonText}>Commit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.dialogTitle}>Commit Geçmişi</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyContent}>
              {actions.getCommitHistory().map((commit) => (
                <View key={commit.id} style={styles.commitItem}>
                  <View style={styles.commitHeader}>
                    <Text style={styles.commitMessage}>{commit.message}</Text>
                    <Text style={styles.commitDate}>
                      {new Date(commit.timestamp).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <Text style={styles.commitAuthor}>{commit.author}</Text>
                  <View style={styles.commitStats}>
                    <Text style={styles.commitStat}>
                      +{commit.changes.nodes.added.length} düğüm
                    </Text>
                    <Text style={styles.commitStat}>
                      ~{commit.changes.nodes.modified.length} düzenleme
                    </Text>
                    <Text style={styles.commitStat}>
                      -{commit.changes.nodes.deleted.length} silme
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Node Details Sheet */}
      <NodeDetailsSheet
        visible={showDetailsSheet}
        node={selectedNode}
        onClose={() => {
          setShowDetailsSheet(false);
          actions.setSelectedNode(null);
        }}
      />

      {/* AI Suggestions Panel */}
      <AISuggestionsPanel
        visible={showAISuggestions}
        onClose={() => setShowAISuggestions(false)}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      {/* Integration Manager */}
      <IntegrationManager
        visible={showIntegrations}
        onClose={() => setShowIntegrations(false)}
      />

      {/* Video Conference */}
      <VideoConference
        visible={showVideoConference}
        onClose={() => setShowVideoConference(false)}
        mindMapId={mapId}
      />

      {/* Gamification Dashboard */}
      <GamificationDashboard
        visible={showGamification}
        onClose={() => setShowGamification(false)}
        userId="current_user"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  collaborationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  collaborationText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    padding: 8,
    alignItems: 'center',
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeMenu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  nodeTypeButton: {
    flex: 1,
    margin: 6,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  nodeTypeLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  layoutMenu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  layoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  layoutOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commitDialog: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  commitMessageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
    height: 80,
    textAlignVertical: 'top',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  commitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  commitButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  historyModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyContent: {
    padding: 16,
    maxHeight: 400,
  },
  commitItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commitMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  commitDate: {
    fontSize: 12,
    color: '#666',
  },
  commitAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  commitStats: {
    flexDirection: 'row',
    gap: 12,
  },
  commitStat: {
    fontSize: 11,
    color: '#666',
  },
});

export default EditorScreen;

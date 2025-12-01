// src/components/AISuggestionsPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AISuggestion, SubTaskSuggestion } from '../services/aiService';
import useMindMapStore from '../store/mindMapStore';

interface AISuggestionsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({ visible, onClose }) => {
  const {
    currentMap,
    aiSuggestions,
    mindMapAnalysis,
    isAIAnalyzing,
    actions
  } = useMindMapStore();

  const [showSubTaskGenerator, setShowSubTaskGenerator] = useState(false);
  const [mainTaskInput, setMainTaskInput] = useState('');
  const [generatedSubTasks, setGeneratedSubTasks] = useState<SubTaskSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (visible && currentMap && !mindMapAnalysis) {
      actions.analyzeMindMap();
    }
  }, [visible, currentMap, mindMapAnalysis]);

  const handleGenerateSubTasks = async () => {
    if (!mainTaskInput.trim()) return;

    setIsGenerating(true);
    try {
      const suggestions = await actions.generateSubTasks(mainTaskInput);
      setGeneratedSubTasks(suggestions);
    } catch (error) {
      console.error('Error generating sub-tasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    actions.applyAISuggestion(suggestion);
  };

  const handleApplySubTask = (subTask: SubTaskSuggestion) => {
    const node = {
      type: subTask.type,
      title: subTask.title,
      description: subTask.description,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      status: 'todo' as const,
      priority: subTask.priority,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    actions.addNode(node);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FFC107';
    return '#FF9800';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'node': return 'plus-circle';
      case 'connection': return 'link';
      case 'improvement': return 'lightbulb';
      case 'naming': return 'pencil';
      default: return 'help-circle';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Icon name="robot" size={24} color="#2196F3" />
              <Text style={styles.headerTitle}>AI Önerileri</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Analysis Section */}
            {mindMapAnalysis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mind Map Analizi</Text>

                {/* Completeness Score */}
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Tamamlık Oranı</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreFill,
                        { width: `${mindMapAnalysis.completeness * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreText}>
                    {Math.round(mindMapAnalysis.completeness * 100)}%
                  </Text>
                </View>

                {/* Insights */}
                {mindMapAnalysis.insights.length > 0 && (
                  <View style={styles.insightsContainer}>
                    <Text style={styles.insightsTitle}>AI Görüşleri:</Text>
                    {mindMapAnalysis.insights.map((insight, index) => (
                      <Text key={index} style={styles.insightText}>• {insight}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Öneriler</Text>
                {aiSuggestions.map((suggestion) => (
                  <View key={suggestion.id} style={styles.suggestionItem}>
                    <View style={styles.suggestionHeader}>
                      <View style={styles.suggestionLeft}>
                        <Icon
                          name={getSuggestionIcon(suggestion.type)}
                          size={20}
                          color="#2196F3"
                        />
                        <View style={styles.suggestionContent}>
                          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                          <Text style={styles.suggestionDescription}>
                            {suggestion.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.suggestionRight}>
                        <View style={[
                          styles.confidenceBadge,
                          { backgroundColor: getConfidenceColor(suggestion.confidence) }
                        ]}>
                          <Text style={styles.confidenceText}>
                            {Math.round(suggestion.confidence * 100)}%
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.applyButton}
                          onPress={() => handleApplySuggestion(suggestion)}
                        >
                          <Icon name="check" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Sub-task Generator */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alt Görev Oluşturucu</Text>
              <Text style={styles.sectionDescription}>
                Ana görevinizi yazın, AI size alt görev önerileri sunacak
              </Text>

              <View style={styles.inputContainer}>
                <Icon name="text-box-outline" size={20} color="#666" style={styles.inputIcon} />
                <Text style={styles.inputText}>{mainTaskInput || 'Ana görevinizi yazın...'}</Text>
                <TouchableOpacity
                  style={styles.inputButton}
                  onPress={() => setShowSubTaskGenerator(true)}
                >
                  <Icon name="pencil" size={16} color="#2196F3" />
                </TouchableOpacity>
              </View>

              {generatedSubTasks.length > 0 && (
                <View style={styles.subTasksContainer}>
                  <Text style={styles.subTasksTitle}>Önerilen Alt Görevler:</Text>
                  {generatedSubTasks.map((subTask, index) => (
                    <View key={index} style={styles.subTaskItem}>
                      <View style={styles.subTaskContent}>
                        <Text style={styles.subTaskTitle}>{subTask.title}</Text>
                        <Text style={styles.subTaskDescription}>{subTask.description}</Text>
                        <View style={styles.subTaskMeta}>
                          <Text style={styles.subTaskType}>{subTask.type}</Text>
                          <Text style={styles.subTaskTime}>{subTask.estimatedTime}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.addSubTaskButton}
                        onPress={() => handleApplySubTask(subTask)}
                      >
                        <Icon name="plus" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Loading State */}
            {isAIAnalyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>AI analiz ediliyor...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Sub-task Input Modal */}
      <Modal
        visible={showSubTaskGenerator}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubTaskGenerator(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subTaskModal}>
            <Text style={styles.modalTitle}>Alt Görev Oluştur</Text>
            <Text style={styles.modalDescription}>
              Ana görevinizi detaylı olarak yazın
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalInput}>{mainTaskInput}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSubTaskGenerator(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalGenerateButton, isGenerating && styles.modalButtonDisabled]}
                onPress={handleGenerateSubTasks}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalGenerateText}>Oluştur</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
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
  content: {
    padding: 16,
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
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  scoreContainer: {
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  insightsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  suggestionItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  suggestionLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#666',
  },
  suggestionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  applyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  inputButton: {
    padding: 8,
  },
  subTasksContainer: {
    marginTop: 12,
  },
  subTasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  subTaskContent: {
    flex: 1,
  },
  subTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  subTaskDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  subTaskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTaskType: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '500',
  },
  subTaskTime: {
    fontSize: 11,
    color: '#666',
  },
  addSubTaskButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTaskModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInputContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    minHeight: 80,
  },
  modalInput: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  modalGenerateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalGenerateText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default AISuggestionsPanel;
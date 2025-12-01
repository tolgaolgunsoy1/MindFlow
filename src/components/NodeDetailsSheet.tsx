// src/components/NodeDetailsSheet.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Node, NodeType, NodeStatus, Priority } from '../types';
import useMindMapStore from '../store/mindMapStore';
import { FileService, FileAttachment } from '../services/fileService';

interface NodeDetailsSheetProps {
  visible: boolean;
  node: Node | null;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NodeDetailsSheet: React.FC<NodeDetailsSheetProps> = ({ visible, node, onClose }) => {
  const { actions } = useMindMapStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<NodeStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setDescription(node.description);
      setStatus(node.status);
      setPriority(node.priority);
      setTags(node.tags.join(', '));
      setDueDate(node.dueDate || '');
      setProgress(node.progress || 0);
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;

    actions.updateNode(node.id, {
      title,
      description,
      status,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      dueDate: dueDate || undefined,
      progress,
      attachments: attachments.map(a => a.uri), // Store URIs as strings
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!node) return;
    actions.deleteNode(node.id);
    onClose();
  };

  const handleAddComment = () => {
    if (!node || !commentText.trim()) return;

    // TODO: Implement comment functionality
    setCommentText('');
  };

  const handleAddAttachment = () => {
    Alert.alert(
      'Dosya Ekle',
      'Dosya türünü seçin',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Galeri',
          onPress: async () => {
            try {
              const file = await FileService.pickImage();
              if (file) {
                const savedFile = { ...file, uri: await FileService.saveFileLocally(file) };
                setAttachments([...attachments, savedFile]);
              }
            } catch (error) {
              Alert.alert('Hata', 'Dosya seçilemedi');
            }
          }
        },
        {
          text: 'Kamera',
          onPress: async () => {
            try {
              const file = await FileService.takePhoto();
              if (file) {
                const savedFile = { ...file, uri: await FileService.saveFileLocally(file) };
                setAttachments([...attachments, savedFile]);
              }
            } catch (error) {
              Alert.alert('Hata', 'Fotoğraf çekilemedi');
            }
          }
        },
        {
          text: 'Belge',
          onPress: async () => {
            try {
              const file = await FileService.pickDocument();
              if (file) {
                const savedFile = { ...file, uri: await FileService.saveFileLocally(file) };
                setAttachments([...attachments, savedFile]);
              }
            } catch (error) {
              Alert.alert('Hata', 'Belge seçilemedi');
            }
          }
        }
      ]
    );
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (attachment) {
      FileService.deleteFile(attachment.id, attachment.name);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    }
  };

  if (!node) return null;

  const statusOptions: { value: NodeStatus; label: string; icon: string }[] = [
    { value: 'todo', label: 'Yapılacak', icon: 'clock-outline' },
    { value: 'in-progress', label: 'Devam Ediyor', icon: 'progress-clock' },
    { value: 'done', label: 'Tamamlandı', icon: 'check-circle' },
  ];

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Düşük', color: '#4CAF50' },
    { value: 'medium', label: 'Orta', color: '#FFC107' },
    { value: 'high', label: 'Yüksek', color: '#FF9800' },
    { value: 'critical', label: 'Kritik', color: '#F44336' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Düğüm Detayları</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Başlık */}
            <View style={styles.section}>
              <Text style={styles.label}>Başlık</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Düğüm başlığı"
                placeholderTextColor="#999"
              />
            </View>

            {/* Açıklama */}
            <View style={styles.section}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detaylı açıklama"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Durum */}
            <View style={styles.section}>
              <Text style={styles.label}>Durum</Text>
              <View style={styles.optionsRow}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      status === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setStatus(option.value)}
                  >
                    <Icon
                      name={option.icon}
                      size={20}
                      color={status === option.value ? '#2196F3' : '#666'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        status === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Öncelik */}
            <View style={styles.section}>
              <Text style={styles.label}>Öncelik</Text>
              <View style={styles.optionsRow}>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priorityButton,
                      priority === option.value && {
                        backgroundColor: option.color,
                        borderColor: option.color,
                      },
                    ]}
                    onPress={() => setPriority(option.value)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        priority === option.value && styles.priorityTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Etiketler */}
            <View style={styles.section}>
              <Text style={styles.label}>Etiketler (virgülle ayırın)</Text>
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="fikir, backend, api"
                placeholderTextColor="#999"
              />
            </View>

            {/* Bitiş Tarihi */}
            <View style={styles.section}>
              <Text style={styles.label}>Bitiş Tarihi</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            {/* İlerleme */}
            <View style={styles.section}>
              <Text style={styles.label}>İlerleme: {progress}%</Text>
              <View style={styles.progressContainer}>
                <TouchableOpacity
                  style={styles.progressButton}
                  onPress={() => setProgress(Math.max(0, progress - 10))}
                >
                  <Icon name="minus" size={20} color="#666" />
                </TouchableOpacity>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <TouchableOpacity
                  style={styles.progressButton}
                  onPress={() => setProgress(Math.min(100, progress + 10))}
                >
                  <Icon name="plus" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Ekler */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Ek Dosyalar</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddAttachment}>
                  <Icon name="plus" size={20} color="#2196F3" />
                </TouchableOpacity>
              </View>

              {attachments.length > 0 ? (
                <View style={styles.attachmentsContainer}>
                  {attachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentItem}>
                      <View style={styles.attachmentInfo}>
                        <Icon
                          name={FileService.getFileIcon(attachment.type, attachment.mimeType)}
                          size={20}
                          color="#666"
                        />
                        <View style={styles.attachmentDetails}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.attachmentMeta}>
                            {FileService.formatFileSize(attachment.size)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveAttachment(attachment.id)}
                      >
                        <Icon name="close" size={16} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noAttachments}>Henüz dosya eklenmemiş</Text>
              )}
            </View>

            {/* Yorumlar */}
            <View style={styles.section}>
              <Text style={styles.label}>Yorumlar</Text>
              {node.comments && node.comments.length > 0 ? (
                <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
                  {node.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.username}</Text>
                        <Text style={styles.commentDate}>
                          {new Date(comment.timestamp).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noComments}>Henüz yorum yok</Text>
              )}

              {/* Yorum Ekle */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={[styles.input, styles.commentInput]}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Yorumunuzu yazın..."
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
                  <Icon name="send" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bilgi */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Icon name="calendar" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Oluşturulma: {new Date(node.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="update" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Güncelleme: {new Date(node.updatedAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Icon name="delete" size={20} color="#FFF" />
              <Text style={styles.deleteButtonText}>Sil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Icon name="check" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    gap: 6,
  },
  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 12,
    color: '#666',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
  },
  priorityTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    marginBottom: 0,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 10,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    padding: 8,
  },
  attachmentsContainer: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  attachmentMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  noAttachments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  infoSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F44336',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NodeDetailsSheet;

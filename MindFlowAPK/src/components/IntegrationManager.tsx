// src/components/IntegrationManager.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IntegrationService, { IntegrationStatus } from '../services/integrationService';
import { MindMap } from '../types';
import useMindMapStore from '../store/mindMapStore';

interface IntegrationManagerProps {
  visible: boolean;
  onClose: () => void;
}

const IntegrationManager: React.FC<IntegrationManagerProps> = ({ visible, onClose }) => {
  const { currentMap, actions } = useMindMapStore();

  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [trelloApiKey, setTrelloApiKey] = useState('');
  const [trelloToken, setTrelloToken] = useState('');
  const [trelloBoardId, setTrelloBoardId] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');
  const [slackSigningSecret, setSlackSigningSecret] = useState('');
  const [slackChannel, setSlackChannel] = useState('');

  useEffect(() => {
    if (visible) {
      loadStatus();
    }
  }, [visible]);

  const loadStatus = async () => {
    const currentStatus = IntegrationService.getStatus();
    setStatus(currentStatus);
  };

  const testConnections = async () => {
    setLoading(true);
    try {
      const results = await IntegrationService.testAllConnections();
      setStatus(results);

      const trelloOk = results.trello.connected;
      const slackOk = results.slack.connected;

      if (trelloOk && slackOk) {
        Alert.alert('Başarılı', 'Tüm entegrasyonlar bağlandı! ✅');
      } else if (trelloOk || slackOk) {
        Alert.alert('Kısmi Başarı', `${trelloOk ? 'Trello' : ''} ${trelloOk && slackOk ? 've' : ''} ${slackOk ? 'Slack' : ''} bağlandı`);
      } else {
        Alert.alert('Hata', 'Hiçbir entegrasyon bağlanamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bağlantı testi başarısız');
    } finally {
      setLoading(false);
    }
  };

  const saveTrelloConfig = () => {
    if (!trelloApiKey || !trelloToken) {
      Alert.alert('Hata', 'Trello API Key ve Token gerekli');
      return;
    }

    IntegrationService.configure({
      trello: {
        apiKey: trelloApiKey,
        token: trelloToken,
        boardId: trelloBoardId || undefined,
      }
    });

    Alert.alert('Başarılı', 'Trello yapılandırması kaydedildi');
    loadStatus();
  };

  const saveSlackConfig = () => {
    if (!slackBotToken || !slackSigningSecret) {
      Alert.alert('Hata', 'Slack Bot Token ve Signing Secret gerekli');
      return;
    }

    IntegrationService.configure({
      slack: {
        botToken: slackBotToken,
        signingSecret: slackSigningSecret,
        defaultChannel: slackChannel || undefined,
      }
    });

    Alert.alert('Başarılı', 'Slack yapılandırması kaydedildi');
    loadStatus();
  };

  const importFromTrello = async () => {
    if (!status?.trello.configured || !trelloBoardId) {
      Alert.alert('Hata', 'Trello yapılandırması ve Board ID gerekli');
      return;
    }

    setLoading(true);
    try {
      const mindMap = await IntegrationService.importFromService('trello', trelloBoardId);
      actions.loadMap(mindMap);
      Alert.alert('Başarılı', 'Trello board başarıyla içe aktarıldı!');
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Trello içe aktarma başarısız');
    } finally {
      setLoading(false);
    }
  };

  const exportToServices = async () => {
    if (!currentMap) {
      Alert.alert('Hata', 'Aktif mind map bulunamadı');
      return;
    }

    setLoading(true);
    try {
      await IntegrationService.exportMindMap(currentMap);
      Alert.alert('Başarılı', 'Mind map dış servislere aktarıldı!');
    } catch (error) {
      Alert.alert('Hata', 'Dışa aktarma başarısız');
    } finally {
      setLoading(false);
    }
  };

  const disconnectService = (service: 'trello' | 'slack') => {
    Alert.alert(
      'Bağlantıyı Kes',
      `${service === 'trello' ? 'Trello' : 'Slack'} bağlantısını kesmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kes',
          style: 'destructive',
          onPress: () => {
            IntegrationService.disconnect(service);
            loadStatus();
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="link" size={24} color="#2196F3" />
            <Text style={styles.headerTitle}>Entegrasyonlar</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Connection Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bağlantı Durumu</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <Icon name="trello" size={20} color="#0079BF" />
                  <Text style={styles.statusTitle}>Trello</Text>
                </View>
                <View style={styles.statusIndicator}>
                  {status?.trello.configured ? (
                    <View style={[styles.statusBadge, status.trello.connected ? styles.statusConnected : styles.statusDisconnected]}>
                      <Text style={styles.statusText}>
                        {status.trello.connected ? 'Bağlı' : 'Yapılandırıldı'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.statusText}>Yapılandırılmamış</Text>
                  )}
                </View>
              </View>

              <View style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <Icon name="slack" size={20} color="#4A154B" />
                  <Text style={styles.statusTitle}>Slack</Text>
                </View>
                <View style={styles.statusIndicator}>
                  {status?.slack.configured ? (
                    <View style={[styles.statusBadge, status.slack.connected ? styles.statusConnected : styles.statusDisconnected]}>
                      <Text style={styles.statusText}>
                        {status.slack.connected ? 'Bağlı' : 'Yapılandırıldı'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.statusText}>Yapılandırılmamış</Text>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.testButton, loading && styles.buttonDisabled]}
              onPress={testConnections}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="connection" size={16} color="#FFF" />
                  <Text style={styles.testButtonText}>Bağlantıları Test Et</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Trello Configuration */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="trello" size={20} color="#0079BF" />
              <Text style={styles.sectionTitle}>Trello Yapılandırması</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>API Key</Text>
              <TextInput
                style={styles.input}
                value={trelloApiKey}
                onChangeText={setTrelloApiKey}
                placeholder="Trello API Key"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Token</Text>
              <TextInput
                style={styles.input}
                value={trelloToken}
                onChangeText={setTrelloToken}
                placeholder="Trello Token"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Board ID (İsteğe bağlı)</Text>
              <TextInput
                style={styles.input}
                value={trelloBoardId}
                onChangeText={setTrelloBoardId}
                placeholder="Trello Board ID"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={saveTrelloConfig}>
                <Icon name="content-save" size={16} color="#FFF" />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>

              {status?.trello.configured && (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => disconnectService('trello')}
                >
                  <Icon name="link-off" size={16} color="#F44336" />
                  <Text style={styles.disconnectButtonText}>Bağlantıyı Kes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Slack Configuration */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="slack" size={20} color="#4A154B" />
              <Text style={styles.sectionTitle}>Slack Yapılandırması</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bot Token</Text>
              <TextInput
                style={styles.input}
                value={slackBotToken}
                onChangeText={setSlackBotToken}
                placeholder="Slack Bot Token"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Signing Secret</Text>
              <TextInput
                style={styles.input}
                value={slackSigningSecret}
                onChangeText={setSlackSigningSecret}
                placeholder="Slack Signing Secret"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Varsayılan Kanal (İsteğe bağlı)</Text>
              <TextInput
                style={styles.input}
                value={slackChannel}
                onChangeText={setSlackChannel}
                placeholder="#general"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={saveSlackConfig}>
                <Icon name="content-save" size={16} color="#FFF" />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>

              {status?.slack.configured && (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => disconnectService('slack')}
                >
                  <Icon name="link-off" size={16} color="#F44336" />
                  <Text style={styles.disconnectButtonText}>Bağlantıyı Kes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Import/Export Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İçe/Dışa Aktarma</Text>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={importFromTrello}
              disabled={loading || !status?.trello.configured}
            >
              <Icon name="download" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Trello'dan İçe Aktar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={exportToServices}
              disabled={loading || !currentMap}
            >
              <Icon name="upload" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Dış Servislere Aktar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disconnectButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IntegrationManager;
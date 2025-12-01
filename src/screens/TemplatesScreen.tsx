// src/screens/TemplatesScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TEMPLATES } from '../data/templates';
import { Template } from '../types';
import useMindMapStore from '../store/mindMapStore';
import useAuthStore from '../store/authStore';
import FirebaseService from '../services/firebase';

interface TemplatesScreenProps {
  navigation: any;
}

const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ navigation }) => {
  const { actions } = useMindMapStore();
  const { user } = useAuthStore();

  const handleTemplateSelect = async (template: Template) => {
    try {
      // Create a new mind map from template
      const nodes: { [key: string]: any } = {};
      const connections: any[] = [];

      // Add nodes with positions
      template.structure.nodes.forEach((nodeData, index) => {
        const nodeId = `node${index + 1}`;
        nodes[nodeId] = {
          ...nodeData,
          id: nodeId,
          position: { x: 200 + (index * 200), y: 300 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Add connections from template structure
      template.structure.connections.forEach((connData, index) => {
        connections.push({
          ...connData,
          id: `conn${index + 1}`,
        });
      });

      const newMapData = {
        name: `${template.name} - ${new Date().toLocaleDateString('tr-TR')}`,
        nodes,
        connections,
        ownerId: user?.id || 'anonymous',
        collaborators: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save to Firebase
      const savedMap = await FirebaseService.createMindMap(newMapData);

      actions.loadMap(savedMap);
      navigation.navigate('Editor', { mapId: savedMap.id });
    } catch (error) {
      console.error('Template creation error:', error);
      // Fallback: create local map
      const nodes: { [key: string]: any } = {};
      template.structure.nodes.forEach((nodeData, index) => {
        const nodeId = `node${index + 1}`;
        nodes[nodeId] = {
          ...nodeData,
          id: nodeId,
          position: { x: 200 + (index * 200), y: 300 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      const localMap = {
        id: Date.now().toString(),
        name: `${template.name} - ${new Date().toLocaleDateString('tr-TR')}`,
        nodes,
        connections: [],
        ownerId: user?.id || 'anonymous',
        collaborators: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      actions.loadMap(localMap);
      navigation.navigate('Editor', { mapId: localMap.id });
    }
  };

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => handleTemplateSelect(item)}
    >
      <View style={styles.templateHeader}>
        <Icon name="file-outline" size={32} color="#2196F3" />
        <Text style={styles.templateName}>{item.name}</Text>
      </View>
      <Text style={styles.templateDescription}>{item.description}</Text>
      <View style={styles.templateMeta}>
        <Text style={styles.templateInfo}>
          {item.structure.nodes.length} düğüm • {item.structure.connections.length} bağlantı
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şablonlar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Templates List */}
      <FlatList
        data={TEMPLATES}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplateItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  templateCard: {
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
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateInfo: {
    fontSize: 12,
    color: '#999',
  },
});

export default TemplatesScreen;

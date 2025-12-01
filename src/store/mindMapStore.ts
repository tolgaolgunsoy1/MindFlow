// src/store/mindMapStore.ts

import { create } from 'zustand';
import { Node, Connection, MindMap } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ServiceManager from '../services/serviceManager';
import useOfflineStore from './offlineStore';
import LayoutService, { LayoutAlgorithm, LayoutOptions } from '../services/layoutService';
import VersionControlService, { Commit } from '../services/versionControlService';
import AIService, { AISuggestion, SubTaskSuggestion, MindMapAnalysis } from '../services/aiService';
import AnalyticsService, { AnalyticsData } from '../services/analyticsService';

interface MindMapState {
  currentMap: MindMap | null;
  selectedNode: Node | null;
  zoom: number;
  pan: { x: number; y: number };
  lastCommittedMap: MindMap | null;
  commitHistory: Commit[];
  aiSuggestions: AISuggestion[];
  mindMapAnalysis: MindMapAnalysis | null;
  isAIAnalyzing: boolean;
  analyticsData: AnalyticsData | null;
  isAnalyzing: boolean;
  actions: {
    loadMap: (map: MindMap) => void;
    addNode: (node: Omit<Node, 'id'>) => void;
    updateNode: (nodeId: string, updates: Partial<Node>) => void;
    deleteNode: (nodeId: string) => void;
    addConnection: (from: string, to: string) => void;
    deleteConnection: (connectionId: string) => void;
    setSelectedNode: (node: Node | null) => void;
    setZoom: (zoom: number) => void;
    setPan: (pan: { x: number; y: number }) => void;
    applyLayout: (algorithm: LayoutAlgorithm, options?: Partial<LayoutOptions>) => void;
    centerOnNode: (nodeId: string) => void;
    commitChanges: (message: string, author: string) => Commit | null;
    undoLastChange: () => void;
    getCommitHistory: () => Commit[];
    hasUncommittedChanges: () => boolean;
    generateSubTasks: (mainTask: string) => Promise<SubTaskSuggestion[]>;
    analyzeMindMap: () => Promise<MindMapAnalysis>;
    suggestNodeNames: (partialName: string) => Promise<string[]>;
    suggestConnections: (nodeId: string) => Promise<AISuggestion[]>;
    applyAISuggestion: (suggestion: AISuggestion) => void;
    analyzeMindMapAnalytics: () => Promise<AnalyticsData>;
    generateAnalyticsReport: () => Promise<string>;
  };
}

const useMindMapStore = create<MindMapState>((set, get) => ({
  currentMap: null,
  selectedNode: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  lastCommittedMap: null,
  commitHistory: [],
  aiSuggestions: [],
  mindMapAnalysis: null,
  isAIAnalyzing: false,
  analyticsData: null,
  isAnalyzing: false,
  actions: {
    loadMap: (map) => {
      // Initialize version control for the map
      const committedMap = JSON.parse(JSON.stringify(map));
      set({
        currentMap: map,
        lastCommittedMap: committedMap,
        commitHistory: VersionControlService.getCommitHistory(),
      });
    },
    addNode: (node) =>
      set((state) => {
        if (!state.currentMap) return {};
        const newNode: Node = { ...node, id: uuidv4() };
        const updatedMap = {
          ...state.currentMap,
          nodes: { ...state.currentMap.nodes, [newNode.id]: newNode },
        };

        // Save offline
        setTimeout(() => {
          try {
            const offlineStore = useOfflineStore.getState();
            offlineStore.actions.saveOfflineData(updatedMap);
            offlineStore.actions.addPendingChange({
              type: 'create',
              collection: 'nodes',
              data: newNode,
            });
          } catch (error) {
            console.error('Offline save error:', error);
          }
        }, 0);

        return { currentMap: updatedMap };
      }),
    updateNode: (nodeId, updates) =>
      set((state) => {
        if (!state.currentMap?.nodes[nodeId]) return {};
        return {
          currentMap: {
            ...state.currentMap,
            nodes: {
              ...state.currentMap.nodes,
              [nodeId]: { ...state.currentMap.nodes[nodeId], ...updates },
            },
          },
        };
      }),
    deleteNode: (nodeId) =>
      set((state) => {
        if (!state.currentMap) return {};
        const newNodes = { ...state.currentMap.nodes };
        delete newNodes[nodeId];
        // Also remove connections to this node
        const newConnections = state.currentMap.connections.filter(
          (c) => c.from !== nodeId && c.to !== nodeId
        );
        return {
          currentMap: { ...state.currentMap, nodes: newNodes, connections: newConnections },
        };
      }),
    addConnection: (from, to) =>
      set((state) => {
        if (!state.currentMap) return {};
        const newConnection: Connection = { id: uuidv4(), from, to, type: 'related' };
        return {
          currentMap: {
            ...state.currentMap,
            connections: [...state.currentMap.connections, newConnection],
          },
        };
      }),
    deleteConnection: (connectionId) =>
      set((state) => {
        if (!state.currentMap) return {};
        return {
          currentMap: {
            ...state.currentMap,
            connections: state.currentMap.connections.filter((c) => c.id !== connectionId),
          },
        };
      }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (pan) => set({ pan }),
    applyLayout: (algorithm, options = {}) =>
      set((state) => {
        if (!state.currentMap) return {};

        const defaultOptions: LayoutOptions = {
          algorithm,
          spacing: 200,
          centerX: 0,
          centerY: 0,
          maxIterations: 100,
          attractionForce: 0.01,
          repulsionForce: 1000,
          ...options,
        };

        const newPositions = LayoutService.applyLayout(
          state.currentMap.nodes,
          state.currentMap.connections,
          defaultOptions
        );

        // Update all node positions
        const updatedNodes = { ...state.currentMap.nodes };
        Object.entries(newPositions).forEach(([nodeId, position]) => {
          if (updatedNodes[nodeId]) {
            updatedNodes[nodeId] = { ...updatedNodes[nodeId], position };
          }
        });

        return {
          currentMap: {
            ...state.currentMap,
            nodes: updatedNodes,
          },
        };
      }),
    centerOnNode: (nodeId) =>
      set((state) => {
        if (!state.currentMap?.nodes[nodeId]) return {};

        const newPositions = LayoutService.centerOnNode(
          state.currentMap.nodes,
          nodeId,
          state.currentMap.connections
        );

        // Update all node positions
        const updatedNodes = { ...state.currentMap.nodes };
        Object.entries(newPositions).forEach(([id, position]) => {
          if (updatedNodes[id]) {
            updatedNodes[id] = { ...updatedNodes[id], position };
          }
        });

        return {
          currentMap: {
            ...state.currentMap,
            nodes: updatedNodes,
          },
        };
      }),
    commitChanges: (message, author) => {
      const state = get();
      if (!state.currentMap || !state.lastCommittedMap) return null;

      try {
        const commit = VersionControlService.commitChanges(
          state.currentMap.id,
          state.lastCommittedMap,
          state.currentMap,
          message,
          author
        );

        set({
          lastCommittedMap: JSON.parse(JSON.stringify(state.currentMap)),
          commitHistory: VersionControlService.getCommitHistory(),
        });

        return commit;
      } catch (error) {
        console.error('Commit error:', error);
        return null;
      }
    },
    undoLastChange: () => {
      const state = get();
      if (!state.commitHistory.length || !state.lastCommittedMap) return;

      // For now, just revert to the last committed state
      // In a full implementation, this would reconstruct from commit diffs
      set({
        currentMap: JSON.parse(JSON.stringify(state.lastCommittedMap)),
      });
    },
    getCommitHistory: () => {
      return VersionControlService.getCommitHistory();
    },
    hasUncommittedChanges: () => {
      const state = get();
      if (!state.currentMap || !state.lastCommittedMap) return false;

      return JSON.stringify(state.currentMap) !== JSON.stringify(state.lastCommittedMap);
    },
    generateSubTasks: async (mainTask) => {
      return await AIService.generateSubTasks(mainTask);
    },
    analyzeMindMap: async () => {
      const state = get();
      if (!state.currentMap) return { completeness: 0, suggestions: [], insights: [], optimizationScore: 0 };

      set({ isAIAnalyzing: true });
      try {
        const analysis = await AIService.analyzeMindMap(state.currentMap);
        set({ mindMapAnalysis: analysis, aiSuggestions: analysis.suggestions, isAIAnalyzing: false });
        return analysis;
      } catch (error) {
        set({ isAIAnalyzing: false });
        throw error;
      }
    },
    analyzeMindMapAnalytics: async () => {
      const state = get();
      if (!state.currentMap) throw new Error('No mind map loaded');

      set({ isAnalyzing: true });
      try {
        const analytics = await AnalyticsService.analyzeMindMap(state.currentMap);
        set({ analyticsData: analytics, isAnalyzing: false });
        return analytics;
      } catch (error) {
        set({ isAnalyzing: false });
        throw error;
      }
    },
    generateAnalyticsReport: async () => {
      const state = get();
      if (!state.currentMap) throw new Error('No mind map loaded');

      return await AnalyticsService.generateReport(state.currentMap);
    },
    suggestNodeNames: async (partialName) => {
      return await AIService.suggestNodeNames(partialName);
    },
    suggestConnections: async (nodeId) => {
      const state = get();
      if (!state.currentMap) return [];

      return await AIService.suggestConnections(state.currentMap, nodeId);
    },
    applyAISuggestion: (suggestion) => {
      const state = get();

      if (suggestion.type === 'node' && suggestion.data) {
        // Add suggested node
        const node: Omit<Node, 'id'> = {
          type: suggestion.data.type || 'task',
          title: suggestion.data.title || suggestion.title,
          description: suggestion.data.description || '',
          position: suggestion.data.position || { x: 200, y: 200 },
          status: 'todo',
          priority: suggestion.data.priority || 'medium',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.actions.addNode(node);
      } else if (suggestion.type === 'connection' && suggestion.data) {
        // Add suggested connection
        state.actions.addConnection(suggestion.data.from, suggestion.data.to);
      }
    },
  },
}));

export default useMindMapStore;

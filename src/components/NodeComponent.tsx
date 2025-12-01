// src/components/NodeComponent.tsx
import React, { useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Node, Position } from '../types';

interface NodeComponentProps {
  node: Node;
  zoom: number;
  pan: Position;
  isSelected: boolean;
  onPress: (node: Node) => void;
  onMove: (nodeId: string, position: Position) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 80;

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  zoom,
  pan,
  isSelected,
  onPress,
  onMove,
}) => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastOffset = useRef({ x: node.position.x, y: node.position.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        position.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y,
        });
        position.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (e, gestureState) => {
        position.flattenOffset();
        const newX = lastOffset.current.x + gestureState.dx / zoom;
        const newY = lastOffset.current.y + gestureState.dy / zoom;
        
        lastOffset.current = { x: newX, y: newY };
        onMove(node.id, { x: newX, y: newY });
      },
    })
  ).current;

  const getNodeColor = () => {
    if (node.color) return node.color;
    
    const colors: Record<string, string> = {
      idea: '#FFC107',
      scope: '#2196F3',
      feature: '#4CAF50',
      task: '#9C27B0',
      user: '#FF5722',
      technology: '#607D8B',
    };
    return colors[node.type] || '#666';
  };

  const getNodeIcon = () => {
    const icons: Record<string, string> = {
      idea: 'lightbulb',
      scope: 'target',
      feature: 'star',
      task: 'checkbox-marked',
      user: 'account',
      technology: 'code-tags',
    };
    return icons[node.type] || 'circle';
  };

  const getStatusIcon = () => {
    const icons: Record<string, string> = {
      todo: 'clock-outline',
      'in-progress': 'progress-clock',
      done: 'check-circle',
      blocked: 'alert-circle',
    };
    return icons[node.status] || 'circle';
  };

  const x = node.position.x * zoom + pan.x;
  const y = node.position.y * zoom + pan.y;

  return (
    <Animated.View
      style={[
        styles.nodeContainer,
        {
          left: x - NODE_WIDTH / 2,
          top: y - NODE_HEIGHT / 2,
          transform: [{ scale: zoom }],
          borderColor: isSelected ? '#2196F3' : 'transparent',
          borderWidth: isSelected ? 3 : 0,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={[styles.node, { backgroundColor: getNodeColor() }]}
        onPress={() => onPress(node)}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name={getNodeIcon()} size={20} color="#FFF" />
          <Icon name={getStatusIcon()} size={16} color="#FFF" style={styles.statusIcon} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {node.title}
        </Text>

        {/* Priority Badge */}
        {node.priority !== 'low' && (
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(node.priority) }]}>
            <Text style={styles.priorityText}>
              {node.priority === 'critical' ? '!' : node.priority.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

      </TouchableOpacity>
    </Animated.View>
  );
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: '#4CAF50',
    medium: '#FFC107',
    high: '#FF9800',
    critical: '#F44336',
  };
  return colors[priority] || '#666';
};

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  node: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    marginLeft: 'auto',
  },
  title: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  assignedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  assignedText: {
    color: '#FFF',
    fontSize: 10,
    marginLeft: 2,
  },
});

export default memo<NodeComponentProps>(NodeComponent);

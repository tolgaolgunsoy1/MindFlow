// Canvas component for mind map visualization and interaction
import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import useMindMapStore from '../store/mindMapStore';
import useCollaborationStore from '../store/collaborationStore';
import NodeComponent from './NodeComponent';
import Minimap from './Minimap';
import { Node, Connection, Position } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CanvasProps {
  onNodePress: (node: Node) => void;
}

const Canvas: React.FC<CanvasProps> = ({ onNodePress }) => {
  const { currentMap, selectedNode, zoom, pan, actions } = useMindMapStore();
  const { activeUsers, actions: collabActions } = useCollaborationStore();

  const [isPanning, setIsPanning] = useState(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  // Virtual rendering: only render visible nodes
  const visibleNodes = useMemo(() => {
    if (!currentMap?.nodes) return [];

    const nodeSize = 120; // Approximate node size
    const buffer = 200; // Extra buffer around viewport

    const viewportLeft = -pan.x / zoom - buffer;
    const viewportTop = -pan.y / zoom - buffer;
    const viewportRight = (-pan.x + SCREEN_WIDTH) / zoom + buffer;
    const viewportBottom = (-pan.y + SCREEN_HEIGHT) / zoom + buffer;

    return Object.values(currentMap.nodes).filter(node => {
      const nodeLeft = node.position.x;
      const nodeTop = node.position.y;
      const nodeRight = node.position.x + nodeSize;
      const nodeBottom = node.position.y + 80; // Approximate node height

      return !(nodeRight < viewportLeft ||
               nodeLeft > viewportRight ||
               nodeBottom < viewportTop ||
               nodeTop > viewportBottom);
    });
  }, [currentMap?.nodes, pan, zoom]);

  // Memoized connection rendering
  const visibleConnections = useMemo(() => {
    if (!currentMap?.connections || !currentMap?.nodes) return [];

    return currentMap.connections.filter(connection => {
      const fromNode = currentMap.nodes[connection.from];
      const toNode = currentMap.nodes[connection.to];
      return fromNode && toNode &&
             visibleNodes.some(n => n.id === connection.from) &&
             visibleNodes.some(n => n.id === connection.to);
    });
  }, [currentMap?.connections, currentMap?.nodes, visibleNodes]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt, gestureState) => {
        lastPanRef.current = { x: gestureState.dx, y: gestureState.dy };
        setIsPanning(true);
      },

      onPanResponderMove: (evt, gestureState) => {
        // Update cursor position for collaboration
        const cursorX = (gestureState.x0 - pan.x) / zoom;
        const cursorY = (gestureState.y0 - pan.y) / zoom;
        collabActions.updateCursor(cursorX, cursorY);

        // Pan canvas if no node is selected
        if (!selectedNode) {
          actions.setPan({
            x: pan.x + gestureState.dx - lastPanRef.current.x,
            y: pan.y + gestureState.dy - lastPanRef.current.y,
          });
          lastPanRef.current = { x: gestureState.dx, y: gestureState.dy };
        }
      },

      onPanResponderRelease: () => {
        setIsPanning(false);
      },
    })
  ).current;

  const renderConnections = useCallback(() => {
    if (!visibleConnections.length) return null;

    return visibleConnections.map((connection: Connection) => {
      const sourceNode = currentMap?.nodes[connection.from];
      const targetNode = currentMap?.nodes[connection.to];

      if (!sourceNode || !targetNode) return null;

      const x1 = sourceNode.position.x * zoom + pan.x;
      const y1 = sourceNode.position.y * zoom + pan.y;
      const x2 = targetNode.position.x * zoom + pan.x;
      const y2 = targetNode.position.y * zoom + pan.y;

      return (
        <Line
          key={connection.id}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#666"
          strokeWidth={2}
          strokeDasharray={connection.type === 'dependency' ? '5,5' : undefined}
        />
      );
    });
  }, [visibleConnections, currentMap?.nodes, zoom, pan]);

  const renderNodes = useCallback(() => {
    if (!visibleNodes.length) return null;

    return visibleNodes.map((node: Node) => (
      <NodeComponent
        key={node.id}
        node={node}
        zoom={zoom}
        pan={pan}
        isSelected={selectedNode?.id === node.id}
        onPress={onNodePress}
        onMove={(nodeId, position) => actions.updateNode(nodeId, { position })}
      />
    ));
  }, [visibleNodes, zoom, pan, selectedNode, onNodePress, actions]);

  const renderCollaboratorCursors = () => {
    if (!activeUsers.length) return null;

    return activeUsers.map((user) => {
      if (!user.cursor) return null;

      const x = user.cursor.x * zoom + pan.x;
      const y = user.cursor.y * zoom + pan.y;

      return (
        <View key={user.userId} style={[styles.cursor, { left: x, top: y }]}>
          <View style={styles.cursorPointer} />
          <Text style={styles.cursorLabel}>{user.displayName}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* SVG layer for connections */}
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={StyleSheet.absoluteFill}
      >
        {renderConnections()}
      </Svg>

      {/* View layer for nodes */}
      <View style={StyleSheet.absoluteFill}>
        {renderNodes()}
        {renderCollaboratorCursors()}
      </View>

      {/* Minimap */}
      {currentMap && (
        <Minimap
          nodes={currentMap.nodes}
          connections={currentMap.connections}
          viewport={{
            pan,
            zoom,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          }}
          onViewportChange={(newPan) => actions.setPan(newPan)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  cursor: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
  },
  cursorPointer: {
    width: 12,
    height: 12,
    backgroundColor: '#FF5722',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cursorLabel: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#FFF',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default Canvas;

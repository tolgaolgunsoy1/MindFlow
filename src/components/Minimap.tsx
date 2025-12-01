// src/components/Minimap.tsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Circle, Line } from 'react-native-svg';
import { Node, Connection, Position } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MinimapProps {
  nodes: { [key: string]: Node };
  connections: Connection[];
  viewport: {
    pan: Position;
    zoom: number;
    width: number;
    height: number;
  };
  onViewportChange: (pan: Position) => void;
}

const MINIMAP_SIZE = 120;
const MINIMAP_PADDING = 10;

const Minimap: React.FC<MinimapProps> = ({
  nodes,
  connections,
  viewport,
  onViewportChange,
}) => {
  const minimapData = useMemo(() => {
    if (!nodes || Object.keys(nodes).length === 0) {
      return {
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
        scale: 1,
        nodes: [],
        connections: [],
        viewportRect: { x: 0, y: 0, width: MINIMAP_SIZE, height: MINIMAP_SIZE },
      };
    }

    const nodeList = Object.values(nodes);
    const minX = Math.min(...nodeList.map(n => n.position.x));
    const minY = Math.min(...nodeList.map(n => n.position.y));
    const maxX = Math.max(...nodeList.map(n => n.position.x + 120)); // Node width
    const maxY = Math.max(...nodeList.map(n => n.position.y + 80));  // Node height

    const mapWidth = maxX - minX || 100;
    const mapHeight = maxY - minY || 100;
    const scale = Math.min(
      (MINIMAP_SIZE - 2 * MINIMAP_PADDING) / mapWidth,
      (MINIMAP_SIZE - 2 * MINIMAP_PADDING) / mapHeight
    );

    // Transform nodes to minimap coordinates
    const transformedNodes = nodeList.map(node => ({
      ...node,
      x: (node.position.x - minX) * scale + MINIMAP_PADDING,
      y: (node.position.y - minY) * scale + MINIMAP_PADDING,
    }));

    // Transform connections
    const transformedConnections = connections.map(conn => {
      const fromNode = transformedNodes.find(n => n.id === conn.from);
      const toNode = transformedNodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return null;

      return {
        ...conn,
        x1: fromNode.x + 60 * scale, // Center of node
        y1: fromNode.y + 40 * scale,
        x2: toNode.x + 60 * scale,
        y2: toNode.y + 40 * scale,
      };
    }).filter(Boolean);

    // Calculate viewport rectangle
    const viewportX = (-viewport.pan.x / viewport.zoom - minX) * scale + MINIMAP_PADDING;
    const viewportY = (-viewport.pan.y / viewport.zoom - minY) * scale + MINIMAP_PADDING;
    const viewportWidth = (viewport.width / viewport.zoom) * scale;
    const viewportHeight = (viewport.height / viewport.zoom) * scale;

    return {
      bounds: { minX, minY, maxX, maxY },
      scale,
      nodes: transformedNodes,
      connections: transformedConnections,
      viewportRect: {
        x: Math.max(MINIMAP_PADDING, Math.min(MINIMAP_SIZE - MINIMAP_PADDING - viewportWidth, viewportX)),
        y: Math.max(MINIMAP_PADDING, Math.min(MINIMAP_SIZE - MINIMAP_PADDING - viewportHeight, viewportY)),
        width: Math.min(viewportWidth, MINIMAP_SIZE - 2 * MINIMAP_PADDING),
        height: Math.min(viewportHeight, MINIMAP_SIZE - 2 * MINIMAP_PADDING),
      },
    };
  }, [nodes, connections, viewport]);

  const handleMinimapPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const relativeX = locationX - MINIMAP_PADDING;
    const relativeY = locationY - MINIMAP_PADDING;

    // Convert minimap coordinates back to world coordinates
    const worldX = (relativeX / minimapData.scale) + minimapData.bounds.minX;
    const worldY = (relativeY / minimapData.scale) + minimapData.bounds.minY;

    // Center the viewport on the clicked point
    const newPanX = -(worldX * viewport.zoom - viewport.width / 2);
    const newPanY = -(worldY * viewport.zoom - viewport.height / 2);

    onViewportChange({ x: newPanX, y: newPanY });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.minimapContainer}
        onPress={handleMinimapPress}
        activeOpacity={1}
      >
        <Svg width={MINIMAP_SIZE} height={MINIMAP_SIZE}>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={MINIMAP_SIZE}
            height={MINIMAP_SIZE}
            fill="rgba(255,255,255,0.9)"
            stroke="#DDD"
            strokeWidth={1}
          />

          {/* Connections */}
          {minimapData.connections.map((conn: any) => (
            <Line
              key={conn.id}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="#CCC"
              strokeWidth={1}
            />
          ))}

          {/* Nodes */}
          {minimapData.nodes.map((node) => (
            <Rect
              key={node.id}
              x={node.x}
              y={node.y}
              width={60 * minimapData.scale}
              height={40 * minimapData.scale}
              fill="#2196F3"
              rx={4}
            />
          ))}

          {/* Viewport rectangle */}
          <Rect
            x={minimapData.viewportRect.x}
            y={minimapData.viewportRect.y}
            width={minimapData.viewportRect.width}
            height={minimapData.viewportRect.height}
            fill="none"
            stroke="#FF5722"
            strokeWidth={2}
            strokeDasharray="2,2"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 1000,
  },
  minimapContainer: {
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Minimap;
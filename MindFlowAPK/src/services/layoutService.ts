// src/services/layoutService.ts

import { Node, Connection, Position } from '../types';

export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'circular' | 'grid';

export interface LayoutOptions {
  algorithm: LayoutAlgorithm;
  spacing?: number;
  centerX?: number;
  centerY?: number;
  maxIterations?: number;
  attractionForce?: number;
  repulsionForce?: number;
}

export class LayoutService {
  private static instance: LayoutService;

  static getInstance(): LayoutService {
    if (!LayoutService.instance) {
      LayoutService.instance = new LayoutService();
    }
    return LayoutService.instance;
  }

  /**
   * Otomatik düzenleme uygular
   */
  applyLayout(
    nodes: { [key: string]: Node },
    connections: Connection[],
    options: LayoutOptions
  ): { [key: string]: Position } {
    const nodeList = Object.values(nodes);
    if (nodeList.length === 0) return {};

    switch (options.algorithm) {
      case 'force-directed':
        return this.forceDirectedLayout(nodeList, connections, options);
      case 'hierarchical':
        return this.hierarchicalLayout(nodeList, connections, options);
      case 'circular':
        return this.circularLayout(nodeList, options);
      case 'grid':
        return this.gridLayout(nodeList, options);
      default:
        return {};
    }
  }

  /**
   * Force-directed layout algoritması
   * Düğümler arası bağlantılara göre doğal düzenleme
   */
  private forceDirectedLayout(
    nodes: Node[],
    connections: Connection[],
    options: LayoutOptions
  ): { [key: string]: Position } {
    const spacing = options.spacing || 150;
    const maxIterations = options.maxIterations || 100;
    const attractionForce = options.attractionForce || 0.01;
    const repulsionForce = options.repulsionForce || 1000;

    // Başlangıç pozisyonları (eğer mevcut değilse rastgele)
    const positions: { [key: string]: Position } = {};
    nodes.forEach((node, index) => {
      if (!positions[node.id]) {
        positions[node.id] = {
          x: Math.cos((index / nodes.length) * 2 * Math.PI) * 200,
          y: Math.sin((index / nodes.length) * 2 * Math.PI) * 200,
        };
      }
    });

    // Force-directed algoritması
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const forces: { [key: string]: Position } = {};

      // Her düğüm için kuvvet hesapla
      nodes.forEach(node => {
        forces[node.id] = { x: 0, y: 0 };

        nodes.forEach(otherNode => {
          if (node.id === otherNode.id) return;

          const dx = positions[otherNode.id].x - positions[node.id].x;
          const dy = positions[otherNode.id].y - positions[node.id].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          // Repulsion force (düğümler birbirini iter)
          const repulsion = repulsionForce / (distance * distance);
          forces[node.id].x -= (dx / distance) * repulsion;
          forces[node.id].y -= (dy / distance) * repulsion;
        });

        // Attraction force (bağlantılı düğümler birbirini çeker)
        connections.forEach(connection => {
          if (connection.from === node.id) {
            const targetNode = nodes.find(n => n.id === connection.to);
            if (targetNode) {
              const dx = positions[targetNode.id].x - positions[node.id].x;
              const dy = positions[targetNode.id].y - positions[node.id].y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;

              forces[node.id].x += dx * attractionForce;
              forces[node.id].y += dy * attractionForce;
            }
          }
          if (connection.to === node.id) {
            const sourceNode = nodes.find(n => n.id === connection.from);
            if (sourceNode) {
              const dx = positions[sourceNode.id].x - positions[node.id].x;
              const dy = positions[sourceNode.id].y - positions[node.id].y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;

              forces[node.id].x += dx * attractionForce;
              forces[node.id].y += dy * attractionForce;
            }
          }
        });
      });

      // Pozisyonları güncelle
      nodes.forEach(node => {
        const damping = 0.9; // Hareketi yavaşlat
        positions[node.id].x += forces[node.id].x * damping;
        positions[node.id].y += forces[node.id].y * damping;
      });
    }

    return positions;
  }

  /**
   * Hierarchical layout algoritması
   * Üst-alt ilişkisine göre düzenleme
   */
  private hierarchicalLayout(
    nodes: Node[],
    connections: Connection[],
    options: LayoutOptions
  ): { [key: string]: Position } {
    const spacing = options.spacing || 200;
    const positions: { [key: string]: Position } = {};

    // Bağlantı grafiği oluştur
    const graph: { [key: string]: string[] } = {};
    const inDegree: { [key: string]: number } = {};

    nodes.forEach(node => {
      graph[node.id] = [];
      inDegree[node.id] = 0;
    });

    connections.forEach(conn => {
      if (conn.type === 'dependency') {
        graph[conn.from].push(conn.to);
        inDegree[conn.to] = (inDegree[conn.to] || 0) + 1;
      }
    });

    // Topological sort benzeri yaklaşım
    const levels: Node[][] = [];
    let currentLevel = nodes.filter(node => inDegree[node.id] === 0);

    while (currentLevel.length > 0) {
      levels.push([...currentLevel]);

      const nextLevel: Node[] = [];
      currentLevel.forEach(node => {
        graph[node.id].forEach(targetId => {
          inDegree[targetId]--;
          if (inDegree[targetId] === 0) {
            nextLevel.push(nodes.find(n => n.id === targetId)!);
          }
        });
      });

      currentLevel = nextLevel;
    }

    // Pozisyonları hesapla
    const centerX = options.centerX || 0;
    const centerY = options.centerY || 0;

    levels.forEach((levelNodes, levelIndex) => {
      const levelWidth = levelNodes.length * spacing;
      const startX = centerX - levelWidth / 2;

      levelNodes.forEach((node, nodeIndex) => {
        positions[node.id] = {
          x: startX + nodeIndex * spacing,
          y: centerY + levelIndex * spacing,
        };
      });
    });

    return positions;
  }

  /**
   * Circular layout algoritması
   * Düğümleri daire şeklinde düzenler
   */
  private circularLayout(nodes: Node[], options: LayoutOptions): { [key: string]: Position } {
    const radius = options.spacing || 200;
    const centerX = options.centerX || 0;
    const centerY = options.centerY || 0;
    const positions: { [key: string]: Position } = {};

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    return positions;
  }

  /**
   * Grid layout algoritması
   * Düğümleri ızgara şeklinde düzenler
   */
  private gridLayout(nodes: Node[], options: LayoutOptions): { [key: string]: Position } {
    const spacing = options.spacing || 150;
    const centerX = options.centerX || 0;
    const centerY = options.centerY || 0;
    const positions: { [key: string]: Position } = {};

    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);

    const totalWidth = (cols - 1) * spacing;
    const totalHeight = (rows - 1) * spacing;
    const startX = centerX - totalWidth / 2;
    const startY = centerY - totalHeight / 2;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      positions[node.id] = {
        x: startX + col * spacing,
        y: startY + row * spacing,
      };
    });

    return positions;
  }

  /**
   * Belirli bir düğümü merkez alarak düzenler
   */
  centerOnNode(
    nodes: { [key: string]: Node },
    centerNodeId: string,
    connections: Connection[]
  ): { [key: string]: Position } {
    const centerNode = nodes[centerNodeId];
    if (!centerNode) return {};

    const visited = new Set<string>();
    const positions: { [key: string]: Position } = {};

    // BFS ile düğümleri seviyelere ayır
    const queue = [{ nodeId: centerNodeId, level: 0, angle: 0 }];
    positions[centerNodeId] = { x: 0, y: 0 };
    visited.add(centerNodeId);

    let level = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;
      const radius = (level + 1) * 150;

      for (let i = 0; i < levelSize; i++) {
        const { nodeId } = queue.shift()!;

        // Bağlı düğümleri bul
        connections.forEach(conn => {
          let nextNodeId: string | null = null;
          if (conn.from === nodeId && !visited.has(conn.to)) {
            nextNodeId = conn.to;
          } else if (conn.to === nodeId && !visited.has(conn.from)) {
            nextNodeId = conn.from;
          }

          if (nextNodeId && nodes[nextNodeId]) {
            const angle = (visited.size / Math.max(6, levelSize * 2)) * 2 * Math.PI;
            positions[nextNodeId] = {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
            };
            visited.add(nextNodeId);
            queue.push({ nodeId: nextNodeId, level: level + 1, angle });
          }
        });
      }
      level++;
    }

    return positions;
  }
}

export default LayoutService.getInstance();
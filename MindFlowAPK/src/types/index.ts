// src/types/index.ts

export type NodeType = 'idea' | 'scope' | 'feature' | 'task' | 'user' | 'technology';

export type NodeStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Position {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  position: Position;
  status: NodeStatus;
  priority: Priority;
  tags: string[];
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  dueDate?: string;
  progress?: number; // 0-100
  attachments?: string[]; // URLs to attachments
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'related' | 'blocking' | 'dependency';
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

export interface MindMap {
  id: string;
  name: string;
  description?: string;
  nodes: { [key: string]: Node };
  connections: Connection[];
  ownerId: string;
  collaborators: string[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  structure: {
    nodes: Omit<Node, 'id' | 'position' | 'children' | 'parent'>[];
    connections: Omit<Connection, 'id' | 'from' | 'to'>[];
  };
}

export interface UserPresence {
  userId: string;
  displayName: string;
  photoURL?: string;
  mapId: string;
  lastSeen: number;
  cursor?: {
    x: number;
    y: number;
  };
  selectedNodeId?: string;
  isOnline: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface Activity {
  id: string;
  userId: string;
  username: string;
  action: 'create' | 'update' | 'delete' | 'comment';
  targetType: 'node' | 'connection' | 'map';
  targetId: string;
  description: string;
  timestamp: string;
}

export interface CollaborationSession {
  mapId: string;
  activeUsers: UserPresence[];
  lastActivity: number;
}

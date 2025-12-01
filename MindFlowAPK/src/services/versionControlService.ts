// src/services/versionControlService.ts

import { MindMap, Node, Connection } from '../types';

export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  author: string;
  changes: {
    nodes: {
      added: Node[];
      modified: Node[];
      deleted: string[];
    };
    connections: {
      added: Connection[];
      modified: Connection[];
      deleted: string[];
    };
  };
  parentCommitId?: string;
  branch: string;
}

export interface Branch {
  name: string;
  headCommitId: string;
  createdAt: number;
  description?: string;
}

export class VersionControlService {
  private static instance: VersionControlService;

  static getInstance(): VersionControlService {
    if (!VersionControlService.instance) {
      VersionControlService.instance = new VersionControlService();
    }
    return VersionControlService.instance;
  }

  private commits: Map<string, Commit> = new Map();
  private branches: Map<string, Branch> = new Map();
  private currentBranch: string = 'main';

  constructor() {
    // Initialize main branch
    this.branches.set('main', {
      name: 'main',
      headCommitId: '',
      createdAt: Date.now(),
      description: 'Main branch',
    });
  }

  /**
   * Create initial commit for a new mind map
   */
  initializeRepository(mapId: string, initialMap: MindMap, author: string): Commit {
    const commit: Commit = {
      id: this.generateCommitId(),
      message: 'Initial commit',
      timestamp: Date.now(),
      author,
      changes: {
        nodes: {
          added: Object.values(initialMap.nodes),
          modified: [],
          deleted: [],
        },
        connections: {
          added: initialMap.connections,
          modified: [],
          deleted: [],
        },
      },
      branch: this.currentBranch,
    };

    this.commits.set(commit.id, commit);
    this.branches.get(this.currentBranch)!.headCommitId = commit.id;

    return commit;
  }

  /**
   * Commit changes to current branch
   */
  commitChanges(
    mapId: string,
    previousMap: MindMap,
    currentMap: MindMap,
    message: string,
    author: string
  ): Commit {
    const changes = this.calculateChanges(previousMap, currentMap);

    // Skip commit if no changes
    if (changes.nodes.added.length === 0 &&
        changes.nodes.modified.length === 0 &&
        changes.nodes.deleted.length === 0 &&
        changes.connections.added.length === 0 &&
        changes.connections.modified.length === 0 &&
        changes.connections.deleted.length === 0) {
      throw new Error('No changes to commit');
    }

    const currentBranch = this.branches.get(this.currentBranch);
    if (!currentBranch) {
      throw new Error('Current branch not found');
    }

    const commit: Commit = {
      id: this.generateCommitId(),
      message,
      timestamp: Date.now(),
      author,
      changes,
      parentCommitId: currentBranch.headCommitId || undefined,
      branch: this.currentBranch,
    };

    this.commits.set(commit.id, commit);
    currentBranch.headCommitId = commit.id;

    return commit;
  }

  /**
   * Get commit history for current branch
   */
  getCommitHistory(limit: number = 50): Commit[] {
    const currentBranch = this.branches.get(this.currentBranch);
    if (!currentBranch || !currentBranch.headCommitId) {
      return [];
    }

    const history: Commit[] = [];
    let currentCommitId: string | null = currentBranch.headCommitId;

    while (currentCommitId && history.length < limit) {
      const commit = this.commits.get(currentCommitId);
      if (!commit) break;

      history.push(commit);
      currentCommitId = commit.parentCommitId || null;
    }

    return history;
  }

  /**
   * Revert to a specific commit
   */
  revertToCommit(commitId: string): MindMap | null {
    const commit = this.commits.get(commitId);
    if (!commit) return null;

    // This would need to reconstruct the mind map from commit history
    // For now, return null as this requires more complex implementation
    return null;
  }

  /**
   * Create a new branch
   */
  createBranch(name: string, description?: string): Branch {
    if (this.branches.has(name)) {
      throw new Error(`Branch '${name}' already exists`);
    }

    const currentBranch = this.branches.get(this.currentBranch);
    if (!currentBranch) {
      throw new Error('Current branch not found');
    }

    const branch: Branch = {
      name,
      headCommitId: currentBranch.headCommitId,
      createdAt: Date.now(),
      description,
    };

    this.branches.set(name, branch);
    return branch;
  }

  /**
   * Switch to a different branch
   */
  switchBranch(name: string): void {
    if (!this.branches.has(name)) {
      throw new Error(`Branch '${name}' does not exist`);
    }

    this.currentBranch = name;
  }

  /**
   * Get all branches
   */
  getBranches(): Branch[] {
    return Array.from(this.branches.values());
  }

  /**
   * Get current branch
   */
  getCurrentBranch(): Branch | null {
    return this.branches.get(this.currentBranch) || null;
  }

  /**
   * Calculate changes between two mind map versions
   */
  private calculateChanges(previousMap: MindMap, currentMap: MindMap) {
    const changes = {
      nodes: {
        added: [] as Node[],
        modified: [] as Node[],
        deleted: [] as string[],
      },
      connections: {
        added: [] as Connection[],
        modified: [] as Connection[],
        deleted: [] as string[],
      },
    };

    const prevNodes = previousMap.nodes;
    const currNodes = currentMap.nodes;
    const prevConnections = new Map(previousMap.connections.map(c => [c.id, c]));
    const currConnections = new Map(currentMap.connections.map(c => [c.id, c]));

    // Check nodes
    Object.keys(currNodes).forEach(nodeId => {
      if (!prevNodes[nodeId]) {
        changes.nodes.added.push(currNodes[nodeId]);
      } else if (this.hasNodeChanged(prevNodes[nodeId], currNodes[nodeId])) {
        changes.nodes.modified.push(currNodes[nodeId]);
      }
    });

    Object.keys(prevNodes).forEach(nodeId => {
      if (!currNodes[nodeId]) {
        changes.nodes.deleted.push(nodeId);
      }
    });

    // Check connections
    currConnections.forEach((connection, id) => {
      if (!prevConnections.has(id)) {
        changes.connections.added.push(connection);
      }
    });

    prevConnections.forEach((connection, id) => {
      if (!currConnections.has(id)) {
        changes.connections.deleted.push(id);
      }
    });

    return changes;
  }

  /**
   * Check if a node has been modified
   */
  private hasNodeChanged(node1: Node, node2: Node): boolean {
    return JSON.stringify(node1) !== JSON.stringify(node2);
  }

  /**
   * Generate unique commit ID
   */
  private generateCommitId(): string {
    return `commit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics for current repository
   */
  getRepositoryStats() {
    const history = this.getCommitHistory();
    const branches = this.getBranches();

    return {
      totalCommits: history.length,
      totalBranches: branches.length,
      currentBranch: this.currentBranch,
      latestCommit: history[0] || null,
      branchStats: branches.map(branch => ({
        name: branch.name,
        commits: this.getBranchCommitCount(branch.name),
        lastActivity: branch.createdAt,
      })),
    };
  }

  /**
   * Get commit count for a specific branch
   */
  private getBranchCommitCount(branchName: string): number {
    const branch = this.branches.get(branchName);
    if (!branch || !branch.headCommitId) return 0;

    let count = 0;
    let currentCommitId: string | null = branch.headCommitId;

    while (currentCommitId) {
      count++;
      const commit = this.commits.get(currentCommitId);
      if (!commit) break;
      currentCommitId = commit.parentCommitId || null;
    }

    return count;
  }
}

export default VersionControlService.getInstance();
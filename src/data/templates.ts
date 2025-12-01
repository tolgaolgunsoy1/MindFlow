// src/data/templates.ts

import { Template, NodeType } from '../types';

export const TEMPLATES: Template[] = [
  {
    id: 'basic-mindmap',
    name: 'Temel Mind Map',
    description: 'Basit bir fikir haritası için başlangıç şablonu',
    structure: {
      nodes: [
        {
          type: 'idea' as NodeType,
          title: 'Ana Fikir',
          description: 'Projenizin ana fikri',
          status: 'todo' as const,
          priority: 'medium' as const,
          tags: ['ana'],
          color: '#FFC107',
          icon: 'lightbulb',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      connections: [],
    },
  },
  {
    id: 'project-planning',
    name: 'Proje Planlama',
    description: 'Proje yönetimi için kapsamlı şablon',
    structure: {
      nodes: [
        {
          type: 'scope' as NodeType,
          title: 'Proje Kapsamı',
          description: 'Projenin genel kapsamı',
          status: 'todo' as const,
          priority: 'high' as const,
          tags: ['kapsam'],
          color: '#2196F3',
          icon: 'target',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          type: 'task' as NodeType,
          title: 'Görev 1',
          description: 'İlk görev',
          status: 'todo' as const,
          priority: 'medium' as const,
          tags: ['görev'],
          color: '#9C27B0',
          icon: 'checkbox-marked',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          type: 'task' as NodeType,
          title: 'Görev 2',
          description: 'İkinci görev',
          status: 'todo' as const,
          priority: 'medium' as const,
          tags: ['görev'],
          color: '#9C27B0',
          icon: 'checkbox-marked',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      connections: [
        { type: 'related' as const },
        { type: 'related' as const },
      ],
    },
  },
];

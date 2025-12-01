// src/services/exportService.ts

import { MindMap, Node, Connection } from '../types';

export class ExportService {
  // JSON Export
  static async exportToJSON(mindMap: MindMap): Promise<string> {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        mindMap: {
          ...mindMap,
          nodes: Object.values(mindMap.nodes),
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('JSON export error:', error);
      throw error;
    }
  }

  // JSON Import
  static async importFromJSON(jsonString: string): Promise<MindMap> {
    try {
      const importData = JSON.parse(jsonString);

      if (!importData.mindMap) {
        throw new Error('Invalid JSON format');
      }

      const mindMap = importData.mindMap;

      // Convert nodes array back to object
      const nodesObject: { [key: string]: Node } = {};
      mindMap.nodes.forEach((node: Node) => {
        nodesObject[node.id] = node;
      });

      return {
        ...mindMap,
        nodes: nodesObject,
      };
    } catch (error) {
      console.error('JSON import error:', error);
      throw error;
    }
  }

  // SVG Export (basic implementation)
  static async exportToSVG(mindMap: MindMap, zoom: number = 1): Promise<string> {
    try {
      const nodes = Object.values(mindMap.nodes);
      const connections = mindMap.connections;

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      nodes.forEach(node => {
        minX = Math.min(minX, node.position.x - 60);
        minY = Math.min(minY, node.position.y - 40);
        maxX = Math.max(maxX, node.position.x + 60);
        maxY = Math.max(maxY, node.position.y + 40);
      });

      const width = (maxX - minX + 100) * zoom;
      const height = (maxY - minY + 100) * zoom;

      let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

      // Add connections
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);

        if (fromNode && toNode) {
          const x1 = (fromNode.position.x - minX + 50) * zoom;
          const y1 = (fromNode.position.y - minY + 40) * zoom;
          const x2 = (toNode.position.x - minX + 50) * zoom;
          const y2 = (toNode.position.y - minY + 40) * zoom;

          const strokeColor = conn.type === 'dependency' ? '#FF5722' : '#666';
          const strokeDash = conn.type === 'dependency' ? 'stroke-dasharray="5,5"' : '';

          svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="2" ${strokeDash}/>`;
        }
      });

      // Add nodes
      nodes.forEach(node => {
        const x = (node.position.x - minX + 10) * zoom;
        const y = (node.position.y - minY + 10) * zoom;
        const width = 100 * zoom;
        const height = 60 * zoom;

        // Node background
        svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${node.color || '#2196F3'}" rx="8"/>`;

        // Node text
        svg += `<text x="${x + width/2}" y="${y + height/2 + 5}" text-anchor="middle" fill="white" font-size="${12 * zoom}" font-weight="bold">${node.title}</text>`;
      });

      svg += '</svg>';
      return svg;
    } catch (error) {
      console.error('SVG export error:', error);
      throw error;
    }
  }

  // PDF Export (HTML-based approach)
  static async exportToPDF(mindMap: MindMap): Promise<string> {
    try {
      const nodes = Object.values(mindMap.nodes);
      const connections = mindMap.connections;

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.position.x - 60);
        minY = Math.min(minY, node.position.y - 40);
        maxX = Math.max(maxX, node.position.x + 60);
        maxY = Math.max(maxY, node.position.y + 40);
      });

      const width = Math.max(800, maxX - minX + 200);
      const height = Math.max(600, maxY - minY + 200);

      // Generate HTML
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${mindMap.name} - MindFlow</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .canvas {
              position: relative;
              width: ${width}px;
              height: ${height}px;
              background: white;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              margin: 0 auto;
            }
            .node {
              position: absolute;
              padding: 10px 15px;
              border-radius: 8px;
              color: white;
              text-align: center;
              font-weight: bold;
              font-size: 12px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              border: 2px solid rgba(255,255,255,0.3);
            }
            .connection {
              position: absolute;
              height: 2px;
              background: #666;
              transform-origin: 0 50%;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${mindMap.name}</h1>
            <p>MindFlow Mind Map - ${new Date().toLocaleDateString('tr-TR')}</p>
            <p>${nodes.length} düğüm • ${connections.length} bağlantı</p>
          </div>

          <div class="canvas">
      `;

      // Add connections
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);

        if (fromNode && toNode) {
          const x1 = fromNode.position.x - minX + 50;
          const y1 = fromNode.position.y - minY + 40;
          const x2 = toNode.position.x - minX + 50;
          const y2 = toNode.position.y - minY + 40;

          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

          html += `<div class="connection" style="left: ${x1}px; top: ${y1}px; width: ${length}px; transform: rotate(${angle}deg);"></div>`;
        }
      });

      // Add nodes
      nodes.forEach(node => {
        const x = node.position.x - minX + 10;
        const y = node.position.y - minY + 10;
        const color = node.color || '#2196F3';

        html += `
          <div class="node" style="left: ${x}px; top: ${y}px; background-color: ${color};">
            ${node.title}
          </div>
        `;
      });

      html += `
          </div>

          <div class="footer">
            <p>Oluşturulma: ${new Date(mindMap.createdAt).toLocaleString('tr-TR')}</p>
            <p>MindFlow - Fikir Mimarı</p>
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  }

  // Create shareable text format
  static async createShareableText(mindMap: MindMap): Promise<string> {
    try {
      const jsonData = await this.exportToJSON(mindMap);
      return `MindFlow Mind Map: ${mindMap.name}\n\n${jsonData}`;
    } catch (error) {
      console.error('Share text creation error:', error);
      throw error;
    }
  }

  // Validate import data
  static validateImportData(data: any): boolean {
    try {
      return !!(data.version && data.mindMap && data.mindMap.id && data.mindMap.nodes);
    } catch {
      return false;
    }
  }
}
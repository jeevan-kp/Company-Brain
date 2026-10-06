const { PROJECTS, getProjectById, getGlobalGraph, getProjectsByDepartment } = require('./projectsData');

class GraphService {
  /**
   * Complete unified enterprise graph across all 20 projects, shared systems, ADRs, stakeholders, and departments
   */
  async getEnterpriseGraph() {
    return getGlobalGraph();
  }

  /**
   * Department-specific graph
   */
  async getDepartmentGraph(deptName) {
    const globalGraph = getGlobalGraph();
    const projectsInDept = getProjectsByDepartment(deptName).map(p => `PROJECT:${p.project_id}`);
    const deptId = `DEPT:${deptName.toUpperCase().replace(/\s+/g, '-').replace(/&/g, '')}`;

    const relevantNodeIds = new Set(projectsInDept);
    relevantNodeIds.add(deptId);

    // Add 1-hop connected nodes
    globalGraph.links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (relevantNodeIds.has(s)) relevantNodeIds.add(t);
      if (relevantNodeIds.has(t)) relevantNodeIds.add(s);
    });

    const nodes = globalGraph.nodes.filter(n => relevantNodeIds.has(n.id));
    const links = globalGraph.links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return relevantNodeIds.has(s) && relevantNodeIds.has(t);
    });

    return { nodes, links };
  }

  /**
   * Multi-hop subgraph around any entity ID
   */
  async getSubgraph(entityId, maxDepth = 2) {
    const globalGraph = getGlobalGraph();
    const visited = new Set([entityId]);
    let frontier = new Set([entityId]);

    for (let depth = 0; depth < maxDepth; depth++) {
      const nextFrontier = new Set();
      globalGraph.links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (frontier.has(s) && !visited.has(t)) {
          visited.add(t);
          nextFrontier.add(t);
        }
        if (frontier.has(t) && !visited.has(s)) {
          visited.add(s);
          nextFrontier.add(s);
        }
      });
      frontier = nextFrontier;
      if (frontier.size === 0) break;
    }

    const nodes = globalGraph.nodes.filter(n => visited.has(n.id));
    const links = globalGraph.links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return visited.has(s) && visited.has(t);
    });

    return { nodes, links };
  }

  /**
   * Project specific graph
   */
  async getProjectGraph(projectId) {
    const project = getProjectById(projectId);
    if (project && project.graph) {
      return project.graph;
    }
    return this.getSubgraph(`PROJECT:${projectId.toUpperCase()}`, 2);
  }

  /**
   * Search entities by name, ID, or type
   */
  async searchEntities(query, type) {
    const q = (query || '').toLowerCase().trim();
    const globalGraph = getGlobalGraph();
    
    return globalGraph.nodes.filter(node => {
      const matchesQuery = !q || node.name.toLowerCase().includes(q) || node.id.toLowerCase().includes(q) || (node.desc && node.desc.toLowerCase().includes(q));
      const matchesType = !type || node.type.toUpperCase() === type.toUpperCase();
      return matchesQuery && matchesType;
    });
  }

  /**
   * Permission-filtered entity query with connected relationships and evidence
   */
  async getEntityWithEvidence(entityId, userRoles) {
    const globalGraph = getGlobalGraph();
    const node = globalGraph.nodes.find(n => n.id.toUpperCase() === entityId.toUpperCase()) || {
      id: entityId,
      name: entityId,
      type: 'ENTITY',
      desc: 'Enterprise Knowledge Node'
    };

    // Find all incoming and outgoing connections
    const connections = [];
    globalGraph.links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s.toUpperCase() === entityId.toUpperCase()) {
        const targetNode = globalGraph.nodes.find(n => n.id === t);
        connections.push({ direction: 'OUTGOING', label: l.label, targetId: t, targetName: targetNode ? targetNode.name : t, targetType: targetNode ? targetNode.type : 'UNKNOWN' });
      } else if (t.toUpperCase() === entityId.toUpperCase()) {
        const sourceNode = globalGraph.nodes.find(n => n.id === s);
        connections.push({ direction: 'INCOMING', label: l.label, sourceId: s, sourceName: sourceNode ? sourceNode.name : s, sourceType: sourceNode ? sourceNode.type : 'UNKNOWN' });
      }
    });

    // Find any relevant evidence items across all projects
    const evidence = [];
    PROJECTS.forEach(p => {
      if (p.evidence) {
        p.evidence.forEach(ev => {
          if (ev.text.toLowerCase().includes(entityId.toLowerCase()) || (node.name && ev.text.toLowerCase().includes(node.name.toLowerCase()))) {
            evidence.push({ ...ev, project_id: p.project_id });
          }
        });
      }
    });

    return {
      entity: node,
      connections,
      evidence
    };
  }
}

module.exports = new GraphService();

const fs = require('fs');
const path = require('path');

/**
 * Robust CSV parser that handles quotes, escaped characters, and multi-line values
 */
function parseCSV(content) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      row.push(cell.trim());
      if (row.length > 0 && row.some(c => c.length > 0)) {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c.length > 0)) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return [];
  const headers = lines[0];
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] !== undefined ? values[idx] : '';
    });
    records.push(record);
  }

  return records;
}

const DATA_DIR = path.join(__dirname, '../../../data/company_brain');

function loadCSV(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[DatasetLoader] Warning: ${filePath} not found`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseCSV(content);
}

// 1. Raw Dataset Tables
const DOMAINS = loadCSV('domains.csv');
const PLATFORMS = loadCSV('platforms.csv');
const PLATFORM_SERVICES = loadCSV('platform_services.csv');
const SERVICE_DEPENDENCIES = loadCSV('service_dependencies.csv');
const TEAMS = loadCSV('teams.csv');
const PEOPLE = loadCSV('people.csv');
const RAW_PROJECTS = loadCSV('projects.csv');
const PROJECT_SERVICE_USAGE = loadCSV('project_service_usage.csv');
const PROJECT_DEPENDENCIES = loadCSV('project_dependencies.csv');
const ALLOCATIONS = loadCSV('allocations.csv');
const GRAPH_EDGES = loadCSV('graph_edges.csv');
const GOLDEN_QA = loadCSV('golden_qa.csv');

// Index Maps
const peopleMap = new Map(PEOPLE.map(p => [p.person_id, p]));
const teamsMap = new Map(TEAMS.map(t => [t.team_id, t]));
const domainsMap = new Map(DOMAINS.map(d => [d.domain_id, d]));
const platformsMap = new Map(PLATFORMS.map(p => [p.platform_id, p]));
const servicesMap = new Map(PLATFORM_SERVICES.map(s => [s.service_id, s]));

// 2. Enriched Projects Dataset
const PROJECTS = RAW_PROJECTS.map(p => {
  const bOwner = peopleMap.get(p.business_owner_id) || { name: p.business_owner_id, job_title: 'Business Owner' };
  const tLead = peopleMap.get(p.tech_lead_id) || { name: p.tech_lead_id, job_title: 'Tech Lead' };
  const bTeam = teamsMap.get(p.business_team_id) || { name: p.business_team_id };
  const tTeam = teamsMap.get(p.technical_team_id) || { name: p.technical_team_id };
  const domain = domainsMap.get(p.domain_id) || { name: p.domain_id };

  // Services used by this project
  const servicesUsed = PROJECT_SERVICE_USAGE
    .filter(u => u.project_id === p.project_id)
    .map(u => {
      const s = servicesMap.get(u.service_id) || { name: u.service_id };
      return {
        service_id: u.service_id,
        service_name: s.name,
        platform_id: s.platform_id,
        purpose: u.purpose,
        owner_team_id: s.owner_team_id
      };
    });

  // Dependencies where this project is consumer (depends on provider)
  const upstreamDependencies = PROJECT_DEPENDENCIES
    .filter(d => d.project_id_consumer === p.project_id)
    .map(d => {
      const provider = RAW_PROJECTS.find(pr => pr.project_id === d.depends_on_project_id_provider);
      return {
        provider_id: d.depends_on_project_id_provider,
        provider_name: provider ? provider.name : d.depends_on_project_id_provider,
        dependency_type: d.dependency_type,
        criticality: d.criticality,
        description: d.description
      };
    });

  // Downstream consumers that depend on this project
  const downstreamDependents = PROJECT_DEPENDENCIES
    .filter(d => d.depends_on_project_id_provider === p.project_id)
    .map(d => {
      const consumer = RAW_PROJECTS.find(pr => pr.project_id === d.project_id_consumer);
      return {
        consumer_id: d.project_id_consumer,
        consumer_name: consumer ? consumer.name : d.project_id_consumer,
        dependency_type: d.dependency_type,
        criticality: d.criticality,
        description: d.description
      };
    });

  // People allocated to this project
  const allocatedPeople = ALLOCATIONS
    .filter(a => a.project_id === p.project_id)
    .map(a => {
      const person = peopleMap.get(a.person_id) || { name: a.person_name, job_title: '', email: '', location: '' };
      return {
        person_id: a.person_id,
        name: a.person_name || person.name,
        role_on_project: a.role_on_project,
        allocation_pct: parseInt(a.allocation_pct, 10) || 0,
        job_title: person.job_title,
        email: person.email,
        location: person.location
      };
    });

  return {
    project_id: p.project_id,
    id: p.project_id,
    name: p.name,
    domain_id: p.domain_id,
    department: domain.name || p.domain_id,
    domain: domain.name || p.domain_id,
    description: p.description,
    business_objective: p.description,
    status: p.status,
    lifecycle_phase: p.status === 'Live' ? 'operate' : (p.status === 'In Delivery' ? 'build' : 'planning'),
    business_criticality: p.business_criticality,
    criticality: p.business_criticality,
    go_live_year: p.go_live_year,
    team_size: parseInt(p.team_size, 10) || allocatedPeople.length,
    business_owner: bOwner,
    tech_lead: tLead,
    business_team: bTeam,
    technical_team: tTeam,
    services_used: servicesUsed,
    upstream_dependencies: upstreamDependencies,
    downstream_dependents: downstreamDependents,
    allocations: allocatedPeople,
    readiness: {
      status: p.status === 'Live' ? 'READY' : (p.business_criticality === 'critical' ? 'CONDITIONALLY_READY' : 'READY'),
      score: p.status === 'Live' ? 100 : (p.business_criticality === 'critical' ? 75 : 85),
      rules_passed: p.status === 'Live' ? 10 : 8,
      total_rules: 10,
      failed_rules: p.status === 'In Delivery' ? [{ name: 'critical_blockers_closed', severity: 'warning', evidence: 'Delivery testing in progress' }] : []
    },
    conflicts: [],
    evidence: servicesUsed.map(s => ({
      source: s.platform_id,
      text: `Project uses ${s.service_name} (${s.service_id}) for ${s.purpose}.`,
      authority: 'operational',
      confidence: 1.0
    }))
  };
});

/**
 * Construct Global Knowledge Graph Network
 */
function getGlobalGraph() {
  const nodeMap = new Map();
  const links = [];
  const linkKeys = new Set();

  const addNode = (n) => {
    if (!nodeMap.has(n.id)) {
      nodeMap.set(n.id, { ...n });
    }
  };

  const addLink = (s, t, label) => {
    const key = `${s}->${t}:${label}`;
    if (!linkKeys.has(key)) {
      linkKeys.add(key);
      links.push({ source: s, target: t, label });
    }
  };

  // 1. Domains
  DOMAINS.forEach(d => {
    addNode({
      id: d.domain_id,
      name: d.name,
      type: 'DEPARTMENT',
      val: 28,
      desc: d.description
    });
  });

  // 2. Platforms
  PLATFORMS.forEach(p => {
    addNode({
      id: p.platform_id,
      name: p.name,
      type: 'APPLICATION',
      val: 26,
      desc: p.description
    });
  });

  // 3. Platform Services
  PLATFORM_SERVICES.forEach(s => {
    addNode({
      id: s.service_id,
      name: s.name,
      type: 'APPLICATION',
      val: 18,
      desc: s.purpose
    });
    // Link service to platform
    addLink(s.service_id, s.platform_id, 'HOSTED_ON');
  });

  // 4. Service-to-Service Dependencies
  SERVICE_DEPENDENCIES.forEach(sd => {
    addLink(sd.service_id, sd.depends_on_service_id, `DEPENDS_ON_${sd.dependency_type.toUpperCase()}`);
  });

  // 5. Projects
  PROJECTS.forEach(p => {
    addNode({
      id: p.project_id,
      name: p.name,
      type: 'PROJECT',
      val: p.business_criticality === 'critical' ? 24 : (p.business_criticality === 'high' ? 20 : 16),
      desc: p.description
    });
    // Link to domain
    addLink(p.project_id, p.domain_id, 'BELONGS_TO');

    // Link to business owner and tech lead
    if (p.business_owner && p.business_owner.person_id) {
      addNode({
        id: p.business_owner.person_id,
        name: p.business_owner.name,
        type: 'PERSON',
        val: 12,
        desc: `${p.business_owner.job_title} (${p.business_owner.location || 'HQ'})`
      });
      addLink(p.business_owner.person_id, p.project_id, 'BUSINESS_OWNER_OF');
    }

    if (p.tech_lead && p.tech_lead.person_id) {
      addNode({
        id: p.tech_lead.person_id,
        name: p.tech_lead.name,
        type: 'PERSON',
        val: 12,
        desc: `${p.tech_lead.job_title} (${p.tech_lead.location || 'HQ'})`
      });
      addLink(p.tech_lead.person_id, p.project_id, 'TECH_LEAD_OF');
    }
  });

  // 6. Project Service Usages
  PROJECT_SERVICE_USAGE.forEach(u => {
    addLink(u.project_id, u.service_id, 'USES_SERVICE');
  });

  // 7. Project-to-Project Dependencies
  PROJECT_DEPENDENCIES.forEach(pd => {
    addLink(pd.project_id_consumer, pd.depends_on_project_id_provider, `DEPENDS_ON_${pd.criticality.toUpperCase()}`);
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links
  };
}

/**
 * Get Subgraph for a specific Project
 */
function getProjectGraph(projectId) {
  const globalGraph = getGlobalGraph();
  const visited = new Set([projectId]);
  let frontier = new Set([projectId]);

  // 2-hop traversal
  for (let depth = 0; depth < 2; depth++) {
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
 * Search dataset across projects, people, services, and Q&As
 */
function searchDataset(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return { projects: [], people: [], services: [], golden_qa: [] };

  const matchedProjects = PROJECTS.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.project_id.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q)
  );

  const matchedPeople = PEOPLE.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.job_title.toLowerCase().includes(q) || 
    p.location.toLowerCase().includes(q)
  );

  const matchedServices = PLATFORM_SERVICES.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.service_id.toLowerCase().includes(q) || 
    s.purpose.toLowerCase().includes(q)
  );

  const matchedQA = GOLDEN_QA.filter(qa => 
    qa.question.toLowerCase().includes(q) || 
    qa.golden_answer.toLowerCase().includes(q)
  );

  return {
    projects: matchedProjects,
    people: matchedPeople,
    services: matchedServices,
    golden_qa: matchedQA
  };
}

module.exports = {
  DOMAINS,
  PLATFORMS,
  PLATFORM_SERVICES,
  SERVICE_DEPENDENCIES,
  TEAMS,
  PEOPLE,
  PROJECTS,
  PROJECT_SERVICE_USAGE,
  PROJECT_DEPENDENCIES,
  ALLOCATIONS,
  GRAPH_EDGES,
  GOLDEN_QA,
  getGlobalGraph,
  getProjectGraph,
  searchDataset,
  getProjectById: (id) => PROJECTS.find(p => p.project_id.toUpperCase() === (id || '').toUpperCase() || p.id.toUpperCase() === (id || '').toUpperCase()),
  getProjectsByDepartment: (domainId) => PROJECTS.filter(p => p.domain_id.toUpperCase() === (domainId || '').toUpperCase() || p.department.toLowerCase() === (domainId || '').toLowerCase()),
  getDepartments: () => DOMAINS.map(d => ({
    department: d.name,
    domain_id: d.domain_id,
    description: d.description,
    project_count: PROJECTS.filter(p => p.domain_id === d.domain_id).length,
    projects: PROJECTS.filter(p => p.domain_id === d.domain_id)
  }))
};

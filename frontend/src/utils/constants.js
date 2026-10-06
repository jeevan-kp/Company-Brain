export const ENTITY_COLORS = {
  PROJECT: '#0ea5e9',      // Sky Blue
  DEPARTMENT: '#8b5cf6',   // Purple
  DOMAIN: '#6366f1',       // Indigo
  PERSON: '#f59e0b',       // Amber
  APPLICATION: '#0d9488',  // Teal
  DECISION: '#a855f7',     // Violet
  DOCUMENT: '#3b82f6',     // Blue
  ISSUE: '#ef4444',        // Red
  RELEASE: '#10b981',      // Emerald Green
  MEETING: '#ec4899',      // Pink
  CHANGE: '#f97316',       // Orange
  ACTION: '#eab308'        // Yellow
};

export const RELATIONSHIP_LABELS = {
  HAS_DOCUMENT: 'Has Document',
  HAS_MEETING: 'Has Meeting',
  HAS_CHANGE: 'Has Change',
  HAS_RELEASE: 'Has Release',
  DEPENDS_ON: 'Depends On',
  CONNECTS_VIA: 'Connects Via',
  HAS_INCIDENT: 'Has Incident',
  AFFECTS: 'Affects',
  RECORDED_IN: 'Recorded In',
  DISCUSSED_IN: 'Discussed In',
  BLOCKS: 'Blocks',
  IMPLEMENTS: 'Implements',
  DEPLOYS: 'Deploys',
  APPROVES: 'Approves',
  USED_BY: 'Used By',
  OWNS: 'Owns',
  ASSIGNED_TO: 'Assigned To',
  ARCHITECT_FOR: 'Architect For',
  MANAGES: 'Manages',
  USES_SERVICE: 'Uses Service',
  HOSTED_ON: 'Hosted On'
};

export const PERSONAS = [
  { id: 'management', label: 'Management', icon: 'Briefcase', desc: 'Portfolio view, business value, risks & blockers' },
  { id: 'project_manager', label: 'Project Manager', icon: 'ClipboardList', desc: 'Milestones, blockers, approvals, actions' },
  { id: 'developer', label: 'Developer', icon: 'Code', desc: 'Jira stories, ADRs, GitHub commits, API interfaces' },
  { id: 'support', label: 'Support / Operations', icon: 'Headphones', desc: 'Applications, runbooks, incidents, changes' },
  { id: 'architect', label: 'Architect (Full Access)', icon: 'Layers', desc: 'Full knowledge graph, decision log & conflicts' }
];

export const READINESS_COLORS = {
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CONDITIONALLY_READY: 'bg-amber-100 text-amber-800 border-amber-300',
  NOT_READY: 'bg-red-100 text-red-800 border-red-300'
};

// 6 Core AutoNova Group Domains (Cyber Security, DTFS, Finance, Procurement, Sales, HR)
export const DEPARTMENTS = [
  'Cyber Security',
  'DTFS - Truck Financial Services',
  'Finance',
  'Procurement',
  'Sales & Aftersales',
  'Human Resources (shared function)'
];

// 5 Central Cloud Platforms
export const PLATFORMS = [
  { id: 'AZURE', name: 'Microsoft Azure', services: 10, color: '#008ad7' },
  { id: 'AWS', name: 'Amazon Web Services', services: 6, color: '#ff9900' },
  { id: 'SAP', name: 'SAP Business Technology', services: 7, color: '#0070f2' },
  { id: 'SNOWFLAKE', name: 'Snowflake', services: 3, color: '#29b5e8' },
  { id: 'DATABRICKS', name: 'Databricks', services: 4, color: '#ff3621' }
];

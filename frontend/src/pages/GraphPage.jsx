import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Filter, Maximize2, Minimize2, Search, Info, Shield, Layers, Zap, AlertTriangle, 
  ArrowRight, ExternalLink, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  Folder, Cpu, FileText, Bookmark, Users, RefreshCw, X, Eye, Grid, GitFork, 
  Compass, LayoutGrid, RotateCcw, Send, Sparkle, Globe, EyeOff, Radio, BookOpen,
  Database, Server, CheckCheck, Link as LinkIcon, Palette
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ENTITY_COLORS, DEPARTMENTS, PLATFORMS } from '../utils/constants';
import ArchitectureNarrationView from '../components/ArchitectureNarrationView';
import api from '../utils/api';

const ENTITY_ICONS = {
  PROJECT: '🚀',
  APPLICATION: '💻',
  DECISION: '📋',
  ADR: '📋',
  COMPONENT: '⚙️',
  DATA_OBJECT: '🗄️',
  DOCUMENT: '📄',
  ISSUE: '🚨',
  CHANGE: '🔄',
  PERSON: '👤',
  DEPARTMENT: '🏢',
  PLATFORM: '☁️',
  SERVICE: '⚙️'
};

// Domain spatial cluster anchors for Cluster Mode
const DOMAIN_ANCHORS = {
  'CYB': { x: -380, y: -260, label: '🛡️ Cyber Security Domain' },
  'Cyber Security': { x: -380, y: -260, label: '🛡️ Cyber Security Domain' },
  'FIN': { x: 340, y: -260, label: '📊 Finance Domain' },
  'Finance': { x: 340, y: -260, label: '📊 Finance Domain' },
  'DTFS': { x: 380, y: 260, label: '💰 DTFS Financial Services' },
  'DTFS - Truck Financial Services': { x: 380, y: 260, label: '💰 DTFS Financial Services' },
  'PRO': { x: -360, y: 240, label: '📦 Procurement Domain' },
  'Procurement': { x: -360, y: 240, label: '📦 Procurement Domain' },
  'SAL': { x: 20, y: 380, label: '🚚 Sales & Aftersales' },
  'Sales & Aftersales': { x: 20, y: 380, label: '🚚 Sales & Aftersales' },
  'HR': { x: -10, y: -400, label: '👥 Human Resources' },
  'Human Resources (shared function)': { x: -10, y: -400, label: '👥 Human Resources' },
  'PLATFORMS': { x: 0, y: 0, label: '☁️ Central Cloud Platforms' }
};

const AI_SUGGESTION_CHIPS = [
  { label: '📘 Confluence ADRs & Chosen Tech', query: 'Show architecture decisions and chosen technologies from Confluence ADRs for DTFS and Cyber' },
  { label: '🏢 LeanIX Factsheets & Components', query: 'Which systems run on PostgreSQL and Azure Kubernetes Service according to LeanIX factsheets?' },
  { label: '🔍 SAP S/4HANA & DTFS Lineage', query: 'Explain how Loan Origination connects with SAP S/4HANA Finance and their LeanIX data flows' },
  { label: '🛡️ Cyber Security SIEM Topology', query: 'Show all Cyber Security systems and SIEM log monitoring dependencies across Azure and AWS' },
  { label: '🚨 High-Risk Blockers & CVEs', query: 'Show all projects with high severity blockers, CVE vulnerabilities, and unapproved changes' },
  { label: '🚚 Vehicle CAN-Bus Ingestion', query: 'Where does CAN-bus vehicle diagnostic telemetry stream into?' }
];

const GraphPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [projects, setProjects] = useState([]);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Floating Side Panels toggles
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('narration'); // 'narration' | 'adrs' | 'components' | 'documents' | 'legend'

  // Scope: 'ALL' | 'DOMAIN:<id>' | 'PLATFORM:<id>' | '<projectId>'
  const initialScope = searchParams.get('scope') || searchParams.get('project') || 'ALL';
  const [currentScope, setCurrentScope] = useState(initialScope);
  
  // Layout Mode: 'cluster' | 'tree' | 'force'
  const [layoutMode, setLayoutMode] = useState('cluster');
  
  // Label Density: 'smart' | 'all' | 'minimal'
  const [labelDensity, setLabelDensity] = useState('smart');

  const [rawGraphData, setRawGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [projectArchData, setProjectArchData] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(new Set(Object.keys(ENTITY_COLORS)));
  const [blockersOnly, setBlockersOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Smart AI Graph Query State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFocusActive, setAiFocusActive] = useState(false);
  const [aiFocusData, setAiFocusData] = useState(null);

  // Interactive "What-If" Outage Simulator State
  const [outageSimulation, setOutageSimulation] = useState(null);

  const handleTriggerOutageSimulation = () => {
    // Locate AKS or central platform service
    const targetNode = rawGraphData.nodes.find(n => 
      (n.name && (n.name.includes('Kubernetes') || n.name.includes('AKS'))) ||
      n.id === 'AKS' ||
      (n.id && n.id.toLowerCase().includes('aks'))
    ) || rawGraphData.nodes[0];

    const impactedSet = new Set(['P-CYB-01', 'P-FIN-01', 'P-DTFS-01', 'P-PRO-02']);
    if (targetNode) {
      rawGraphData.links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === targetNode.id) impactedSet.add(t);
        if (t === targetNode.id) impactedSet.add(s);
      });
    }

    setOutageSimulation({
      targetService: 'Azure Kubernetes Service (AKS v1.28 West Europe)',
      targetNodeId: targetNode?.id || 'AKS',
      severity: 'P1 CRITICAL / HIGH BLAST RADIUS',
      impactedNodeIds: impactedSet,
      affectedProjects: [
        { id: 'P-CYB-01', name: 'Security Log Monitoring (SIEM)', domain: 'Cyber Security', impact: 'Real-time telemetry ingestion pipeline blocked', owner: 'Claudia Lang', lead: 'Rahul Verma' },
        { id: 'P-FIN-01', name: 'SAP S/4HANA Finance Core', domain: 'Finance', impact: 'General Ledger ingestion microservices suspended', owner: 'Stefan Brandt', lead: 'Markus Bauer' },
        { id: 'P-DTFS-01', name: 'Loan Origination Platform', domain: 'DTFS', impact: 'Dealer credit decisioning API latency spike', owner: 'Marcus Vance', lead: 'David Chen' },
        { id: 'P-PRO-02', name: 'Supplier Portal & EDI Gateway', domain: 'Procurement', impact: 'Purchase order dispatch message backlog', owner: 'Dirk Meier', lead: 'Kavita Patel' }
      ],
      hourlyRiskEur: 185000,
      sopRunbook: [
        { step: 1, action: 'Trigger Auto-Failover to Azure Frankfurt Landing Zone (Secondary AZ Cluster)', time: '0-5 min' },
        { step: 2, action: 'Verify Kafka Event Hubs consumer lag queue buffering (12,000 eps burst capacity)', time: '5-10 min' },
        { step: 3, action: 'Notify Incident Commander & Domain Leads on Microsoft Teams #incident-bridge-p1', time: '10-15 min' },
        { step: 4, action: 'Check APIM Edge Gateway circuit breaker status & reroute synthetic health probes', time: '15-25 min' }
      ]
    });

    setRightPanelTab('outage');
    setShowRightPanel(true);

    if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
      fgRef.current?.centerAt(targetNode.x, targetNode.y, 800);
      fgRef.current?.zoom(2.8, 800);
    }
  };

  const handleResetOutage = () => {
    setOutageSimulation(null);
    setRightPanelTab('narration');
    fgRef.current?.zoomToFit(800);
  };

  // Fetch projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to load projects list:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch global graph
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const res = await api.get('/graph/global');
        setRawGraphData(res.data);
        setSelectedNode(null);
        setNodeDetails(null);
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  // Fetch deep entity details and architecture when a node is selected
  useEffect(() => {
    if (!selectedNode) {
      setNodeDetails(null);
      setProjectArchData(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await api.get(`/graph/entity/${encodeURIComponent(selectedNode.id)}`);
        setNodeDetails(res.data);
      } catch (err) {
        console.error('Failed to load entity details:', err);
      }
    };
    fetchDetails();

    if (selectedNode.type === 'PROJECT' || selectedNode.id.startsWith('P-')) {
      const fetchArch = async () => {
        try {
          const res = await api.get(`/graph/project-architecture/${encodeURIComponent(selectedNode.id)}`);
          setProjectArchData(res.data);
          setShowRightPanel(true);
          setRightPanelTab('narration');
        } catch (err) {
          console.error('Failed to load project architecture:', err);
        }
      };
      fetchArch();
    } else {
      setShowRightPanel(true);
      setRightPanelTab('narration');
    }
  }, [selectedNode]);

  // Handle responsive sizing
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth || window.innerWidth,
        height: containerRef.current.offsetHeight || window.innerHeight
      });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timer = setTimeout(updateDimensions, 150);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
    };
  }, [isFullscreen, updateDimensions]);

  // Auto-align camera
  const autoAlignAndFit = useCallback((duration = 600, padding = 80) => {
    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(duration, padding);
      }
    }, 150);
  }, []);

  useEffect(() => {
    autoAlignAndFit(700, 80);
  }, [currentScope, layoutMode, blockersOnly, autoAlignAndFit]);

  // Configure D3 physics forces
  useEffect(() => {
    if (!fgRef.current) return;
    const fg = fgRef.current;
    
    if (fg.d3Force('charge')) {
      fg.d3Force('charge').strength(layoutMode === 'tree' ? -380 : -550);
    }
    if (fg.d3Force('link')) {
      fg.d3Force('link').distance(layoutMode === 'tree' ? 100 : 130).strength(0.4);
    }
    if (fg.d3Force('collide')) {
      fg.d3Force('collide').radius(node => {
        if (node.type === 'DEPARTMENT') return 45;
        if (node.type === 'PROJECT') return 30;
        return 20;
      }).iterations(2);
    }
  }, [layoutMode]);

  // Filtered Graph Data
  const filteredGraphData = useMemo(() => {
    if (!rawGraphData.nodes || rawGraphData.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    let nodes = [...rawGraphData.nodes];

    // 1. Filter by Scope
    if (currentScope !== 'ALL') {
      if (currentScope.startsWith('DOMAIN:')) {
        const domainPrefix = currentScope.replace('DOMAIN:', '');
        const domainProjectIds = new Set(
          projects.filter(p => p.domain_id === domainPrefix || p.department.toLowerCase().includes(domainPrefix.toLowerCase()))
                  .map(p => p.project_id)
        );
        domainProjectIds.add(domainPrefix);

        const connectedNodeIds = new Set(domainProjectIds);
        rawGraphData.links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (domainProjectIds.has(s)) connectedNodeIds.add(t);
          if (domainProjectIds.has(t)) connectedNodeIds.add(s);
        });

        nodes = nodes.filter(n => connectedNodeIds.has(n.id));
      } else if (currentScope.startsWith('PLATFORM:')) {
        const platformId = currentScope.replace('PLATFORM:', '');
        const platformNodeIds = new Set([platformId]);

        rawGraphData.links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s === platformId || t === platformId) {
            platformNodeIds.add(s);
            platformNodeIds.add(t);
          }
        });

        nodes = nodes.filter(n => platformNodeIds.has(n.id));
      } else {
        const projId = currentScope;
        const projectNodeIds = new Set([projId]);
        rawGraphData.links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s === projId) projectNodeIds.add(t);
          if (t === projId) projectNodeIds.add(s);
        });
        nodes = nodes.filter(n => projectNodeIds.has(n.id));
      }
    }

    // 2. Filter by Node Types
    nodes = nodes.filter(n => selectedTypes.has(n.type) || !n.type);

    // 3. Filter by Blockers Only
    if (blockersOnly) {
      const blockerProjectIds = new Set(
        projects.filter(p => p.rag_status === 'RED' || p.readiness?.status === 'NOT_READY' || (p.conflicts && p.conflicts.length > 0))
                .map(p => p.project_id)
      );
      const connectedNodeIds = new Set(blockerProjectIds);

      rawGraphData.links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (blockerProjectIds.has(s)) connectedNodeIds.add(t);
        if (blockerProjectIds.has(t)) connectedNodeIds.add(s);
      });
      nodes = nodes.filter(n => connectedNodeIds.has(n.id));
    }

    // Domain Clusters Layout Anchor assignment
    if (layoutMode === 'cluster') {
      nodes.forEach(n => {
        let anchor = null;
        if (n.type === 'DEPARTMENT' && DOMAIN_ANCHORS[n.id]) {
          anchor = DOMAIN_ANCHORS[n.id];
        } else if (n.id.startsWith('P-')) {
          const domainPrefix = n.id.split('-')[1];
          if (DOMAIN_ANCHORS[domainPrefix]) anchor = DOMAIN_ANCHORS[domainPrefix];
        } else if (n.id.startsWith('AZ-') || n.id.startsWith('AWS-') || n.id.startsWith('SAP-') || n.id.startsWith('SNF-') || n.id.startsWith('DBX-') || n.type === 'APPLICATION' || n.type === 'PLATFORM') {
          anchor = DOMAIN_ANCHORS['PLATFORMS'];
        }

        if (anchor && (n.fx === undefined || n.fx === null)) {
          n.x = (n.x || 0) * 0.4 + anchor.x * 0.6 + (Math.random() - 0.5) * 80;
          n.y = (n.y || 0) * 0.4 + anchor.y * 0.6 + (Math.random() - 0.5) * 80;
        }
      });
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = rawGraphData.links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    return { nodes, links };
  }, [rawGraphData, currentScope, projects, selectedTypes, blockersOnly, layoutMode]);

  // AI Relevant Nodes set
  const aiRelevantNodeIds = useMemo(() => {
    if (!aiFocusActive || !aiFocusData?.relevant_node_ids) return null;
    return new Set(aiFocusData.relevant_node_ids);
  }, [aiFocusActive, aiFocusData]);

  // Highlight graph neighbors
  const highlightNodes = useMemo(() => {
    const set = new Set();
    const activeNode = selectedNode || hoverNode;
    if (activeNode) {
      set.add(activeNode.id);
      filteredGraphData.links.forEach(link => {
        const s = typeof link.source === 'object' ? link.source.id : link.source;
        const t = typeof link.target === 'object' ? link.target.id : link.target;
        if (s === activeNode.id) set.add(t);
        if (t === activeNode.id) set.add(s);
      });
    }
    return set;
  }, [selectedNode, hoverNode, filteredGraphData]);

  // AI Focus Execution
  const handleAiFocus = async (queryText) => {
    const query = (queryText || aiPrompt).trim();
    if (!query) return;
    setIsAiLoading(true);
    try {
      const res = await api.post('/graph/ai-focus', { query });
      const data = res.data;
      setAiFocusData(data);
      setAiFocusActive(true);
      setShowRightPanel(true);
      setRightPanelTab('narration');

      // Smooth camera glide to the bounding center of matching nodes
      const relevantIds = new Set(data.relevant_node_ids || []);
      const matchingNodes = rawGraphData.nodes.filter(n => relevantIds.has(n.id) && n.x !== undefined && n.y !== undefined);
      
      if (matchingNodes.length > 0) {
        const avgX = matchingNodes.reduce((sum, n) => sum + n.x, 0) / matchingNodes.length;
        const avgY = matchingNodes.reduce((sum, n) => sum + n.y, 0) / matchingNodes.length;
        fgRef.current?.centerAt(avgX, avgY, 800);
        fgRef.current?.zoom(2.0, 800);
      }

      if (data.primary_node_id) {
        const primary = rawGraphData.nodes.find(n => n.id === data.primary_node_id);
        if (primary) setSelectedNode(primary);
      }
    } catch (err) {
      console.error('Failed to run AI graph focus:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Complete clean reset of all AI focus, selected node, and camera view
  const handleResetAiFocus = () => {
    setAiFocusActive(false);
    setAiFocusData(null);
    setSelectedNode(null);
    setNodeDetails(null);
    setProjectArchData(null);
    setHoverNode(null);
    setAiPrompt('');
    autoAlignAndFit(700, 80);
  };

  // Color logic for links with subtle, elegant executive tones (avoid blinding neon brightness)
  const getLinkColor = useCallback((link) => {
    const sId = typeof link.source === 'object' ? link.source.id : link.source;
    const tId = typeof link.target === 'object' ? link.target.id : link.target;

    // Outage Simulation Active
    if (outageSimulation) {
      const isTarget = sId === outageSimulation.targetNodeId || tId === outageSimulation.targetNodeId;
      const isImpacted = outageSimulation.impactedNodeIds?.has(sId) || outageSimulation.impactedNodeIds?.has(tId);
      if (isTarget) return 'rgba(244, 63, 94, 0.85)'; // Crimson alert beam
      if (isImpacted) return 'rgba(245, 158, 11, 0.65)'; // Amber warning beam
      return 'rgba(71, 85, 105, 0.10)'; // Rest of network fades to dark background
    }

    // AI Focus Active
    if (aiFocusActive) {
      if (aiRelevantNodeIds?.has(sId) && aiRelevantNodeIds?.has(tId)) {
        return 'rgba(56, 189, 248, 0.85)'; // Focused soft sky blue
      }
      return 'rgba(51, 65, 85, 0.08)'; // Quiet background
    }

    // Interactive Hover or Node Selection Active
    const activeNode = selectedNode || hoverNode;
    if (activeNode) {
      const isConnected = sId === activeNode.id || tId === activeNode.id;
      if (isConnected) {
        return 'rgba(56, 189, 248, 0.90)'; // Sky blue highlight for direct neighbors
      }
      return 'rgba(51, 65, 85, 0.06)'; // All other links fade completely into the background
    }

    // Default Idle View: Subtle, muted, elegant transparency (no blinding glare)
    const lbl = (link.label || '').toLowerCase();
    if (lbl.includes('critical') || lbl.includes('block') || lbl.includes('cve') || lbl.includes('risk')) {
      return 'rgba(244, 63, 94, 0.45)'; // Soft crimson
    }
    if (lbl.includes('event') || lbl.includes('kafka') || lbl.includes('telemetry') || lbl.includes('feeds') || lbl.includes('stream')) {
      return 'rgba(14, 165, 233, 0.35)'; // Soft sky blue
    }
    if (lbl.includes('component') || lbl.includes('runs on') || lbl.includes('hosted')) {
      return 'rgba(16, 185, 129, 0.30)'; // Soft emerald
    }
    if (lbl.includes('adr') || lbl.includes('govern') || lbl.includes('decision')) {
      return 'rgba(168, 85, 247, 0.30)'; // Soft purple
    }
    if (lbl.includes('owner') || lbl.includes('lead') || lbl.includes('person')) {
      return 'rgba(245, 158, 11, 0.30)'; // Soft amber
    }
    if (lbl.includes('charter') || lbl.includes('document')) {
      return 'rgba(59, 130, 246, 0.28)'; // Soft blue
    }
    if (lbl.includes('domain')) {
      return 'rgba(99, 102, 241, 0.28)'; // Soft indigo
    }
    return 'rgba(100, 116, 139, 0.20)'; // Subtle slate gray
  }, [aiFocusActive, aiRelevantNodeIds, outageSimulation, selectedNode, hoverNode]);

  // Canvas Node Renderer with Clear Size Hierarchy & Glowing Neon Halo
  const drawNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoverNode && hoverNode.id === node.id;
    const isSearched = searchQuery.trim() && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const isAiTarget = aiRelevantNodeIds && aiRelevantNodeIds.has(node.id);
    const isNeighbor = highlightNodes.size === 0 || highlightNodes.has(node.id) || isSearched;
    const isIssue = node.type === 'ISSUE' || (node.name && node.name.includes('Defect'));

    // Balanced Alpha: non-target nodes remain visible in the background at 0.35 alpha
    let alpha = 1.0;
    if (aiFocusActive) {
      alpha = isAiTarget ? 1.0 : 0.35;
    } else if (highlightNodes.size > 0 && !isNeighbor) {
      alpha = 0.28;
    }

    // Node Sizing Visual Hierarchy
    let baseRadius = 12;
    switch (node.type) {
      case 'DEPARTMENT':
        baseRadius = 26; // BIGGEST central anchors!
        break;
      case 'PROJECT':
        baseRadius = 18; // PROMINENT primary project hubs!
        break;
      case 'APPLICATION':
      case 'PLATFORM':
        baseRadius = 18; // Major platform hubs
        break;
      case 'SERVICE':
        baseRadius = 13;
        break;
      case 'COMPONENT':
        baseRadius = 11; // LeanIX components
        break;
      case 'DATA_OBJECT':
        baseRadius = 10;
        break;
      case 'ADR':
      case 'DECISION':
        baseRadius = 10;
        break;
      case 'DOCUMENT':
        baseRadius = 10;
        break;
      case 'PERSON':
        baseRadius = 11;
        break;
      default:
        baseRadius = 12;
    }

    const radius = isSelected ? baseRadius * 1.35 : (isAiTarget ? baseRadius * 1.25 : (isHovered ? baseRadius * 1.15 : baseRadius));
    const color = ENTITY_COLORS[node.type] || '#38bdf8';

    ctx.save();
    ctx.globalAlpha = alpha;

    const isOutageTarget = outageSimulation && (node.id === outageSimulation.targetNodeId || (node.name && node.name.includes('Kubernetes')));
    const isOutageImpacted = outageSimulation && outageSimulation.impactedNodeIds?.has(node.id);

    // Glowing Neon Concentric Halos for Outage, AI Targets, or Selected
    if (isOutageTarget) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 16, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)'; // pulsing red blast ring
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.fill();
    } else if (isOutageImpacted) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 10, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)'; // amber hazard ring
      ctx.fill();
    } else if (isAiTarget) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 15, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)'; // neon cyan glow
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.45)'; // neon purple glow
      ctx.fill();
    } else if (isSelected || isSearched || isIssue) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isSelected ? 9 : 6), 0, 2 * Math.PI, false);
      ctx.fillStyle = isIssue ? 'rgba(239, 68, 68, 0.4)' : (isSelected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(234, 179, 8, 0.4)');
      ctx.fill();
    } else if (node.type === 'DEPARTMENT') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.fill();
    }

    // Node Circle Solid Core
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = isOutageTarget 
      ? '#881337' 
      : (isOutageImpacted 
          ? '#78350f' 
          : (isSelected ? color : (isAiTarget ? '#082f49' : (node.type === 'DEPARTMENT' ? '#1e1b4b' : '#0f172a'))));
    ctx.fill();
    ctx.lineWidth = isOutageTarget ? 4 : (isOutageImpacted ? 3.2 : (isSelected ? 3.8 : (isAiTarget ? 3.0 : (node.type === 'DEPARTMENT' ? 3.5 : 2.2))));
    ctx.strokeStyle = isOutageTarget ? '#f43f5e' : (isOutageImpacted ? '#f59e0b' : (isAiTarget ? '#22d3ee' : color));
    ctx.stroke();

    // Node Icon
    const icon = ENTITY_ICONS[node.type] || '•';
    const iconFontSize = Math.max(10, Math.round(radius * 0.95));
    ctx.font = `${iconFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#ffffff' : '#f8fafc';
    ctx.fillText(icon, node.x, node.y + 0.5);

    // Smart Text Label (Avoid overlapping text knot when zoomed out)
    const shouldShowLabel = 
      isAiTarget ||
      node.type === 'DEPARTMENT' ||
      labelDensity === 'all' ||
      isSelected || 
      isHovered || 
      isSearched || 
      (labelDensity === 'smart' && globalScale > 1.5);

    if (shouldShowLabel && labelDensity !== 'minimal' && alpha > 0.25) {
      const label = node.name || node.id;
      const fontSize = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
      ctx.font = `${isSelected || isAiTarget || node.type === 'DEPARTMENT' ? '700' : '600'} ${fontSize}px system-ui, -apple-system, sans-serif`;
      
      const textWidth = ctx.measureText(label).width;
      const paddingX = 6;
      const paddingY = 3;
      const pillHeight = fontSize + paddingY * 2;
      const pillY = node.y + radius + 4;
      const pillX = node.x - textWidth / 2 - paddingX;

      // Label Pill Background
      ctx.fillStyle = isAiTarget 
        ? 'rgba(8, 47, 73, 0.95)' 
        : (isSelected 
            ? 'rgba(15, 23, 42, 0.95)' 
            : (node.type === 'DEPARTMENT' 
                ? 'rgba(30, 27, 75, 0.95)' 
                : 'rgba(15, 23, 42, 0.88)'));
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, textWidth + paddingX * 2, pillHeight, 4);
      ctx.fill();
      ctx.lineWidth = isAiTarget ? 1.5 : 1;
      ctx.strokeStyle = isAiTarget ? '#22d3ee' : (isSelected ? color : (node.type === 'DEPARTMENT' ? '#a855f7' : 'rgba(148, 163, 184, 0.25)'));
      ctx.stroke();

      // Label text
      ctx.fillStyle = isAiTarget ? '#67e8f9' : (isSelected ? '#38bdf8' : (node.type === 'DEPARTMENT' ? '#e9d5ff' : '#e2e8f0'));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, node.x, pillY + pillHeight / 2);
    }

    ctx.restore();
  }, [selectedNode, hoverNode, searchQuery, highlightNodes, labelDensity, aiFocusActive, aiRelevantNodeIds]);

  // Determine DAG mode
  const dagMode = useMemo(() => {
    if (layoutMode === 'tree') return 'td';
    return null;
  }, [layoutMode]);

  return (
    <div className={`relative w-full overflow-hidden font-sans select-none bg-slate-950 ${
      isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'h-[calc(100vh-3.5rem)]'
    }`}>
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full h-full relative overflow-hidden bg-radial from-slate-900/60 via-slate-950 to-slate-950"
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-30 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3 p-6 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <RefreshCw size={28} className="text-cyan-400 animate-spin" />
              <span className="text-xs font-bold text-slate-200 tracking-wide">Synthesizing Multi-Source Architecture Graph...</span>
            </div>
          </div>
        ) : null}

        {/* 2D Canvas */}
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={filteredGraphData}
          dagMode={dagMode}
          dagLevelDistance={115}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const radius = node.type === 'DEPARTMENT' ? 32 : (node.type === 'PROJECT' ? 24 : 16);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkColor={getLinkColor}
          linkWidth={(link) => {
            const sId = typeof link.source === 'object' ? link.source.id : link.source;
            const tId = typeof link.target === 'object' ? link.target.id : link.target;

            if (outageSimulation) {
              if (sId === outageSimulation.targetNodeId || tId === outageSimulation.targetNodeId) return 2.6;
              if (outageSimulation.impactedNodeIds?.has(sId) || outageSimulation.impactedNodeIds?.has(tId)) return 1.6;
              return 0.4;
            }

            if (aiFocusActive) {
              if (aiRelevantNodeIds?.has(sId) && aiRelevantNodeIds?.has(tId)) return 2.4;
              return 0.4;
            }

            const activeNode = selectedNode || hoverNode;
            if (activeNode) {
              if (sId === activeNode.id || tId === activeNode.id) return 2.2;
              return 0.35; // Unfocused links become clean hairline
            }

            const lbl = (link.label || '').toLowerCase();
            if (lbl.includes('critical') || lbl.includes('block')) return 1.4;
            return 0.75; // Clean, fine executive hairline
          }}
          linkDirectionalParticles={(link) => {
            const sId = typeof link.source === 'object' ? link.source.id : link.source;
            const tId = typeof link.target === 'object' ? link.target.id : link.target;

            if (outageSimulation) {
              if (sId === outageSimulation.targetNodeId || tId === outageSimulation.targetNodeId) return 3;
              if (outageSimulation.impactedNodeIds?.has(sId) || outageSimulation.impactedNodeIds?.has(tId)) return 2;
              return 1;
            }

            if (aiFocusActive) {
              if (aiRelevantNodeIds?.has(sId) && aiRelevantNodeIds?.has(tId)) return 3;
              return 1;
            }

            const activeNode = selectedNode || hoverNode;
            if (activeNode) {
              if (sId === activeNode.id || tId === activeNode.id) return 3;
              return 0; // Quiet background when focusing on a specific node
            }

            // In resting mode: 1 subtle, delicate particle per link so the entire graph feels alive and dynamic!
            return 1;
          }}
          linkDirectionalParticleWidth={(link) => {
            const sId = typeof link.source === 'object' ? link.source.id : link.source;
            const tId = typeof link.target === 'object' ? link.target.id : link.target;
            const activeNode = selectedNode || hoverNode;
            if (activeNode && (sId === activeNode.id || tId === activeNode.id)) return 2.2;
            return 1.4; // Delicate fiber-optic pulse (not huge glaring orbs)
          }}
          linkDirectionalParticleSpeed={(link) => {
            const lbl = (link.label || '').toLowerCase();
            if (lbl.includes('event') || lbl.includes('kafka') || lbl.includes('stream')) return 0.007; // faster for live streams
            return 0.0035; // gentle, rhythmic flow
          }}
          linkDirectionalParticleColor={(link) => {
            const lbl = (link.label || '').toLowerCase();
            if (lbl.includes('critical') || lbl.includes('block')) return 'rgba(244, 63, 94, 0.85)';
            if (lbl.includes('event') || lbl.includes('kafka') || lbl.includes('stream')) return 'rgba(56, 189, 248, 0.85)';
            if (lbl.includes('component') || lbl.includes('runs on')) return 'rgba(16, 185, 129, 0.75)';
            if (lbl.includes('adr') || lbl.includes('decision')) return 'rgba(168, 85, 247, 0.75)';
            if (lbl.includes('owner') || lbl.includes('lead')) return 'rgba(245, 158, 11, 0.75)';
            return 'rgba(148, 163, 184, 0.65)'; // Soft starlight pulse
          }}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link) => `${link.label || 'CONNECTS'}`}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.25}
          warmupTicks={25}
          cooldownTicks={90}
          onNodeHover={(node) => setHoverNode(node || null)}
          onBackgroundClick={() => {
            // Clicking empty canvas clears selected node and returns to broad overview
            if (selectedNode) setSelectedNode(null);
          }}
          onNodeClick={(node) => {
            setSelectedNode(node);
            if (node.x !== undefined && node.y !== undefined) {
              fgRef.current?.centerAt(node.x, node.y, 700);
              fgRef.current?.zoom(2.5, 700);
            }
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 1. TOP FLOATING HUD HEADER (TRANSPARENT GLASS & NEON ACCENTS)  */}
      {/* ============================================================== */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-5xl pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-xl bg-slate-950/85 border border-cyan-500/30 rounded-2xl px-4 py-2 shadow-[0_0_25px_rgba(6,182,212,0.18)] flex items-center justify-between flex-wrap gap-2 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Compass size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs tracking-tight text-white">AutoNova Enterprise Architecture Graph</span>
                <span className="text-[10px] font-mono bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-2 py-0.2 rounded-full font-bold">
                  {filteredGraphData.nodes.length} Nodes &bull; {filteredGraphData.links.length} Relations
                </span>
              </div>
            </div>
          </div>

          {/* Quick HUD Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* What-If Outage Simulator Trigger */}
            <button
              onClick={outageSimulation ? handleResetOutage : handleTriggerOutageSimulation}
              className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                outageSimulation
                  ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-400/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
              }`}
              title="Simulate service failure and view cascading blast radius"
            >
              <Zap size={12} className={outageSimulation ? 'text-white' : 'text-rose-400 animate-bounce'} />
              <span>{outageSimulation ? 'Stop Outage Simulation' : '⚡ Simulate Outage (What-If)'}</span>
            </button>

            {/* RESET FOCUS BUTTON (Always visible when AI focus or node is active) */}
            {(aiFocusActive || selectedNode) && (
              <button
                onClick={handleResetAiFocus}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                title="Reset AI focus and show all nodes"
              >
                <RotateCcw size={11} /> Reset Graph
              </button>
            )}

            {/* Layout Mode Buttons */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setLayoutMode('cluster')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  layoutMode === 'cluster'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cluster by Domain territories"
              >
                <Grid size={11} /> Clusters
              </button>
              <button
                onClick={() => setLayoutMode('tree')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  layoutMode === 'tree'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Top-down architecture dependency tree"
              >
                <GitFork size={11} /> Tree
              </button>
              <button
                onClick={() => setLayoutMode('force')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  layoutMode === 'force'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dynamic Force physics network"
              >
                <LayoutGrid size={11} /> Force
              </button>
            </div>

            {/* Auto-Align & Fit */}
            <button
              onClick={() => autoAlignAndFit(500, 70)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center gap-1 transition-all cursor-pointer"
              title="Reset Zoom & Auto-Fit"
            >
              <RefreshCw size={11} className="text-cyan-400" /> Fit
            </button>

            {/* Fullscreen Expand Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Immersive View'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. LEFT FLOATING GLASS PANEL: FILTERS & SCOPE                  */}
      {/* ============================================================== */}
      <div className={`absolute left-3 top-16 z-20 transition-all duration-300 ${
        showLeftPanel ? 'w-64' : 'w-auto'
      }`}>
        {showLeftPanel ? (
          <div className="backdrop-blur-xl bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white space-y-3 max-h-[calc(100vh-8.5rem)] overflow-y-auto no-scrollbar">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Filter size={12} /> Graph Scope & Filters
              </span>
              <button
                onClick={() => setShowLeftPanel(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Collapse Filters"
              >
                <ChevronLeft size={15} />
              </button>
            </div>

            {/* Domain Filter Pills */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Enterprise Domains ({projects.length} Proj)
              </span>
              <div className="grid grid-cols-1 gap-1">
                <button
                  onClick={() => {
                    setCurrentScope('ALL');
                    handleResetAiFocus();
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    currentScope === 'ALL' && !aiFocusActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/70 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>🌟 Entire Enterprise</span>
                  <span className="text-[10px] font-mono opacity-80">{projects.length}</span>
                </button>

                {[
                  { id: 'DOMAIN:CYB', label: '🛡️ Cyber Security', count: 7, color: 'text-purple-300' },
                  { id: 'DOMAIN:DTFS', label: '💰 DTFS Lending', count: 6, color: 'text-sky-300' },
                  { id: 'DOMAIN:FIN', label: '📊 Corporate Finance', count: 6, color: 'text-emerald-300' },
                  { id: 'DOMAIN:PRO', label: '📦 Procurement', count: 5, color: 'text-teal-300' },
                  { id: 'DOMAIN:SAL', label: '🚚 Sales & Aftersales', count: 6, color: 'text-amber-300' },
                  { id: 'DOMAIN:HR', label: '👥 Corporate HR', count: 1, color: 'text-pink-300' },
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setCurrentScope(d.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      currentScope === d.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900/70 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className={d.color}>{d.label}</span>
                    <span className="text-[10px] font-mono opacity-80">{d.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cloud Platforms */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Cloud Platforms
              </span>
              <div className="grid grid-cols-2 gap-1">
                {PLATFORMS.map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => setCurrentScope(`PLATFORM:${pl.id}`)}
                    className={`px-2 py-1 rounded-lg text-left text-[11px] font-bold truncate transition-all cursor-pointer ${
                      currentScope === `PLATFORM:${pl.id}`
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    ☁️ {pl.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Risk Blockers Only Switch */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setBlockersOnly(!blockersOnly)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  blockersOnly
                    ? 'bg-red-500/20 text-red-300 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={13} className={blockersOnly ? 'text-red-400' : 'text-slate-500'} />
                  Blockers & Planted Risks
                </span>
                <span className={`w-2 h-2 rounded-full ${blockersOnly ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`}></span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="backdrop-blur-xl bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/40 text-cyan-400 p-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            title="Expand Filters"
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT FLOATING GLASS PANEL: AI ARCHITECTURE NARRATION & DOCUMENTATION */}
      {/* ========================================================================= */}
      <div className={`absolute right-3 top-16 z-20 transition-all duration-300 ${
        showRightPanel ? 'w-[28rem] max-w-[calc(100vw-2rem)]' : 'w-auto'
      }`}>
        {showRightPanel ? (
          <div className="backdrop-blur-xl bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_35px_rgba(6,182,212,0.25)] text-white space-y-3.5 max-h-[calc(100vh-6.5rem)] overflow-y-auto no-scrollbar">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles size={13} /> Architecture & Documentation
              </span>
              <div className="flex items-center gap-1">
                {(aiFocusActive || selectedNode) && (
                  <button
                    onClick={handleResetAiFocus}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 font-bold transition-colors cursor-pointer"
                    title="Clear focus"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setShowRightPanel(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-bold overflow-x-hidden hover:overflow-x-auto no-scrollbar [scrollbar-width:none]">
              {outageSimulation && (
                <button
                  onClick={() => setRightPanelTab('outage')}
                  className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer animate-pulse ${
                    rightPanelTab === 'outage'
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/60 shadow-sm'
                      : 'text-rose-400 hover:text-rose-200'
                  }`}
                >
                  🚨 Outage Blast Radius
                </button>
              )}
              <button
                onClick={() => setRightPanelTab('narration')}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  rightPanelTab === 'narration'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🧠 AI Narration
              </button>
              <button
                onClick={() => setRightPanelTab('adrs')}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  rightPanelTab === 'adrs'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📘 ADRs ({aiFocusData?.adrs?.length || projectArchData?.adrs?.length || 0})
              </button>
              <button
                onClick={() => setRightPanelTab('components')}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  rightPanelTab === 'components'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🏢 LeanIX ({aiFocusData?.components?.length || projectArchData?.components?.length || 0})
              </button>
              <button
                onClick={() => setRightPanelTab('documents')}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  rightPanelTab === 'documents'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📄 Charters
              </button>
              <button
                onClick={() => setRightPanelTab('legend')}
                className={`px-2 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  rightPanelTab === 'legend'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎨 Legend
              </button>
            </div>

            {/* TAB CONTENT: WHAT-IF OUTAGE BLAST RADIUS COCKPIT */}
            {rightPanelTab === 'outage' && outageSimulation && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-rose-950/80 border border-rose-500/50 rounded-2xl space-y-2 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/60">
                      {outageSimulation.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      Blast Radius: {outageSimulation.affectedProjects.length} Systems
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">
                    {outageSimulation.targetService}
                  </h4>
                  <div className="flex items-center justify-between pt-1 border-t border-rose-900/80 text-xs">
                    <span className="text-rose-300">Est. Downtime Risk:</span>
                    <strong className="text-white font-mono text-sm">€{outageSimulation.hourlyRiskEur.toLocaleString()} / hr</strong>
                  </div>
                </div>

                {/* Cascading Impact Projects */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Cascading Downstream Application Impact ({outageSimulation.affectedProjects.length})
                  </span>
                  <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                    {outageSimulation.affectedProjects.map((p, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-300">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{p.impact}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Owner: <strong className="text-white">{p.owner}</strong></span>
                          <span>Lead: <strong className="text-white">{p.lead}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOP Runbook Procedures */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                    Automated Incident Response Runbook (ServiceNow / Confluence)
                  </span>
                  <div className="space-y-1.5">
                    {outageSimulation.sopRunbook.map((step, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                          {step.step}
                        </span>
                        <div className="flex-1">
                          <span className="text-slate-200 block text-[11px] leading-snug">{step.action}</span>
                          <span className="text-[10px] text-slate-500 font-mono">SLA Target: {step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => alert(`Simulated P1 escalation dispatched to Microsoft Teams #incident-bridge-p1 and 4 Domain Leads.`)}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Radio size={13} /> Dispatch Teams Escalation
                  </button>
                  <button
                    onClick={handleResetOutage}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: AI ARCHITECTURE NARRATION */}
            {rightPanelTab === 'narration' && (
              <div className="space-y-3">
                <ArchitectureNarrationView
                  narrationText={aiFocusData?.ai_narration || projectArchData?.ai_narration || selectedNode?.desc}
                  architecture={projectArchData?.architecture || aiFocusData?.primary_project?.architecture}
                  projectName={selectedNode?.name || aiFocusData?.primary_project?.name}
                  projectId={selectedNode?.id || aiFocusData?.primary_project?.id}
                  department={selectedNode?.department || selectedNode?.domain_id || aiFocusData?.primary_project?.department}
                  adrs={aiFocusData?.adrs || projectArchData?.adrs || []}
                  components={aiFocusData?.components || projectArchData?.components || []}
                  dataObjects={aiFocusData?.data_objects || projectArchData?.data_objects || []}
                  onNavigateToNode={(nodeId) => {
                    const target = rawGraphData.nodes.find(n => n.id === nodeId);
                    if (target) {
                      setSelectedNode(target);
                      if (target.x !== undefined && target.y !== undefined) {
                        fgRef.current?.centerAt(target.x, target.y, 700);
                        fgRef.current?.zoom(2.5, 700);
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* TAB CONTENT 2: CONFLUENCE ARCHITECTURE DECISION RECORDS (ADRs) */}
            {rightPanelTab === 'adrs' && (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                  Confluence Architecture Decisions (ADRs)
                </span>
                {(aiFocusData?.adrs || projectArchData?.adrs || []).length > 0 ? (
                  (aiFocusData?.adrs || projectArchData?.adrs || []).map((adr, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl border border-purple-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300">{adr.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40">
                          {adr.status || 'Accepted'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{adr.decision}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Chosen: <strong className="text-white">{adr.chosen_technology}</strong></span>
                        <span className="font-mono text-purple-400">{adr.id}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 text-center">No Confluence ADRs linked to current view.</p>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: LEANIX IT COMPONENTS & DATA OBJECTS */}
            {rightPanelTab === 'components' && (
              <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">
                    LeanIX IT Components Runtime Stack
                  </span>
                  <div className="space-y-1">
                    {(aiFocusData?.components || projectArchData?.components || []).length > 0 ? (
                      (aiFocusData?.components || projectArchData?.components || []).map((c, idx) => (
                        <div key={idx} className="p-2 bg-slate-900/80 rounded-lg border border-emerald-500/30 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-400">{c.category} v{c.version} &bull; Vendor: {c.vendor}</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 shrink-0">EOL: {c.eol || 'Active'}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No LeanIX components found</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">
                    LeanIX Master Data Objects
                  </span>
                  <div className="space-y-1">
                    {(aiFocusData?.data_objects || projectArchData?.data_objects || []).length > 0 ? (
                      (aiFocusData?.data_objects || projectArchData?.data_objects || []).map((d, idx) => (
                        <div key={idx} className="p-2 bg-slate-900/80 rounded-lg border border-amber-500/30 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-200 block">{d.name}</span>
                            <span className="text-[10px] text-slate-400">Sensitivity: {d.sensitivity}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.contains_pii ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-400'}`}>
                            {d.contains_pii ? 'PII Sensitive' : 'No PII'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No Data Objects found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: SHAREPOINT CHARTERS & RUNBOOKS */}
            {rightPanelTab === 'documents' && (
              <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                  SharePoint Project Charters & Governance
                </span>
                {(aiFocusData?.documents || projectArchData?.documents || []).length > 0 ? (
                  (aiFocusData?.documents || projectArchData?.documents || []).map((doc, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl border border-blue-500/30 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-300 truncate mr-2">{doc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                          {doc.doc_type || 'Charter'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Author: <strong className="text-slate-200">{doc.author}</strong> &bull; Version {doc.version}
                      </div>
                      {doc.charter_budget_capex && (
                        <div className="text-[11px] text-emerald-400 font-mono">
                          Approved Capex: €{doc.charter_budget_capex.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 text-center">No SharePoint documents linked to current selection.</p>
                )}
              </div>
            )}

            {/* TAB CONTENT 5: VISUAL LEGEND & GUIDE */}
            {rightPanelTab === 'legend' && (
              <div className="space-y-3.5 max-h-80 overflow-y-auto no-scrollbar text-xs">
                {/* Node Types & Size Hierarchy */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    Node Hierarchy & Symbols
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { icon: '🏢', name: 'Department / Domain', size: 'Largest (r: 26)', color: '#8b5cf6', desc: 'Central territory anchor' },
                      { icon: '🚀', name: 'Core Project', size: 'Major Hub (r: 18)', color: '#0ea5e9', desc: 'Enterprise business program' },
                      { icon: '☁️', name: 'Cloud Platform', size: 'Major Hub (r: 18)', color: '#6366f1', desc: 'Azure, AWS, SAP RISE' },
                      { icon: '💻', name: 'Platform Service', size: 'Medium (r: 13)', color: '#0d9488', desc: 'AKS, PostgreSQL Flexible' },
                      { icon: '⚙️', name: 'LeanIX IT Component', size: 'Compact (r: 11)', color: '#10b981', desc: 'Runtime framework & database' },
                      { icon: '🗄️', name: 'LeanIX Data Object', size: 'Compact (r: 10)', color: '#f59e0b', desc: 'Master data entity' },
                      { icon: '📋', name: 'Confluence ADR', size: 'Compact (r: 10)', color: '#a855f7', desc: 'Architecture decision record' },
                      { icon: '📄', name: 'SharePoint Charter', size: 'Compact (r: 10)', color: '#3b82f6', desc: 'Approved project charter' },
                      { icon: '👤', name: 'Accountable Lead', size: 'Compact (r: 11)', color: '#f59e0b', desc: 'Owner / Tech Lead' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <div>
                            <span className="font-bold text-slate-200 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.desc}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: item.color, backgroundColor: `${item.color}20` }}>
                          {item.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Link Colors & Meaning */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                    Relationship Link Colors
                  </span>
                  <div className="space-y-1">
                    {[
                      { color: '#06b6d4', label: 'Data Flow & Kafka Event Stream', desc: 'Telemetry, inter-app feeds' },
                      { color: '#10b981', label: 'Runs On Component & Cloud Hosting', desc: 'Kubernetes, PostgreSQL stack' },
                      { color: '#a855f7', label: 'Confluence Architecture Decision', desc: 'Governed by ADR' },
                      { color: '#6366f1', label: 'Domain Membership', desc: 'Part of business domain' },
                      { color: '#f59e0b', label: 'Accountable Ownership', desc: 'Business Owner & Tech Lead' },
                      { color: '#3b82f6', label: 'SharePoint Governance', desc: 'Documented in Charter' },
                      { color: '#ef4444', label: 'High-Risk Blocker & CVE Conflict', desc: 'P1 incident / critical risk' }
                    ].map((l, idx) => (
                      <div key={idx} className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-1 rounded-full shrink-0" style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}` }}></span>
                          <span className="font-medium text-slate-300">{l.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Layout Modes Explained */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                    📐 3 Layout Modes Explained
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-0.5">
                        <Grid size={12} /> Clusters (Domain Territories)
                      </div>
                      <p className="text-slate-400 leading-snug">
                        Spatially anchors projects and systems into 6 business territories (Cyber, Finance, DTFS, Sales, Procurement, HR, and Central Platforms). Ideal for exploring domain boundaries and ecosystem clusters.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-0.5">
                        <GitFork size={12} /> Tree (Hierarchical Architecture DAG)
                      </div>
                      <p className="text-slate-400 leading-snug">
                        Reorganizes nodes top-down in a Directed Acyclic Graph: Domains ➔ Core Projects ➔ Cloud Platforms ➔ IT Components. Shows clean upstream-to-downstream architecture lineage without circular loops.
                      </p>
                    </div>

                    <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-0.5">
                        <LayoutGrid size={12} /> Force (Dynamic Physics Network)
                      </div>
                      <p className="text-slate-400 leading-snug">
                        Real-time D3 physics simulation with charge repulsion, link tension, and collision forces. Great for discovering organic connections and cross-domain bridges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deep Entity Connected Dependencies */}
            {selectedNode && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Direct Topology Links ({nodeDetails?.connections?.length || 0})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                  {nodeDetails?.connections && nodeDetails.connections.length > 0 ? (
                    nodeDetails.connections.map((conn, idx) => {
                      const isOut = conn.direction === 'OUTGOING';
                      const targetId = isOut ? conn.targetId : conn.sourceId;
                      const targetName = isOut ? conn.targetName : conn.sourceName;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            const target = rawGraphData.nodes.find(n => n.id === targetId);
                            if (target) {
                              setSelectedNode(target);
                              if (target.x !== undefined && target.y !== undefined) {
                                fgRef.current?.centerAt(target.x, target.y, 700);
                                fgRef.current?.zoom(2.5, 700);
                              }
                            }
                          }}
                          className="p-1.5 bg-slate-900/60 hover:bg-slate-800 rounded-lg border border-slate-800 flex items-center justify-between text-xs cursor-pointer group"
                        >
                          <span className="font-medium text-slate-200 group-hover:text-cyan-400 truncate mr-1">
                            {targetName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {isOut ? `→ ${conn.label}` : `← ${conn.label}`}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 italic">No direct connections in view</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowRightPanel(true)}
            className="backdrop-blur-xl bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/40 text-cyan-400 p-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            title="Expand Architecture & Narration Drawer"
          >
            <Sparkles size={14} />
            <span>Architecture</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. BOTTOM FLOATING AI PROMPT BAR & SMART GRAPH REORGANIZER     */}
      {/* ============================================================== */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-4xl space-y-1.5 pointer-events-none">
        {/* Floating AI Insight Banner (when AI focus is active) */}
        {aiFocusActive && aiFocusData && (
          <div className="pointer-events-auto backdrop-blur-xl bg-slate-950/90 border border-cyan-400/60 rounded-2xl p-2.5 shadow-[0_0_35px_rgba(6,182,212,0.35)] text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">
                    AI Subgraph &bull; {aiFocusData.category}
                  </span>
                  <span className="text-[10px] font-mono bg-cyan-900/60 text-cyan-200 px-1.5 py-0.2 rounded font-bold">
                    {aiFocusData.relevant_node_ids?.length || 0} Nodes Highlighted
                  </span>
                </div>
                <p className="text-slate-300 mt-0.5 leading-snug line-clamp-1">{aiFocusData.explanation}</p>
              </div>
            </div>

            <button
              onClick={handleResetAiFocus}
              className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold border border-cyan-400/50 transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <RotateCcw size={11} /> Reset Graph
            </button>
          </div>
        )}

        {/* Suggestion Prompt Chips (NO horizontal scrollbar) */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-hidden hover:overflow-x-auto no-scrollbar py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {AI_SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setAiPrompt(chip.query);
                handleAiFocus(chip.query);
              }}
              className="px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-slate-950/80 hover:bg-cyan-950/90 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-400/60 shadow-[0_0_12px_rgba(0,0,0,0.5)] transition-all shrink-0 cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Floating Glass AI Prompt Capsule */}
        <div className="pointer-events-auto backdrop-blur-xl bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-1.5 shadow-[0_0_35px_rgba(6,182,212,0.25)] flex items-center gap-2">
          <div className="pl-2.5 text-cyan-400">
            <Sparkles size={16} className={isAiLoading ? 'animate-spin' : 'animate-pulse'} />
          </div>

          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiFocus()}
            placeholder="Ask AI anything about architecture, Confluence ADRs, LeanIX factsheets, or system relations..."
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-0 px-2 font-medium"
          />

          <button
            onClick={() => handleAiFocus()}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer shrink-0"
          >
            {isAiLoading ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Analyzing Architecture...</span>
              </>
            ) : (
              <>
                <Send size={12} />
                <span>Ask AI & Focus</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphPage;

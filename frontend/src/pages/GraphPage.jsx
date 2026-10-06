import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Filter, Maximize2, Search, Info, Shield, Layers, Zap, AlertTriangle, 
  ArrowRight, ExternalLink, Sparkles, CheckCircle2, ChevronRight, Share2,
  Folder, Cpu, FileText, Bookmark, Users, RefreshCw, X, Eye, Grid, GitFork, 
  Compass, LayoutGrid, RotateCcw
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ENTITY_COLORS, DEPARTMENTS, PLATFORMS } from '../utils/constants';
import api from '../utils/api';

const ENTITY_ICONS = {
  PROJECT: '🚀',
  APPLICATION: '💻',
  DECISION: '📋',
  DOCUMENT: '📄',
  ISSUE: '🚨',
  CHANGE: '🔄',
  PERSON: '👤',
  DEPARTMENT: '🏢',
  PLATFORM: '☁️',
  SERVICE: '⚙️'
};

// Distinct domain spatial anchor coordinates for Cluster Mode
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

const DOMAIN_COLORS = {
  'CYB': '#a855f7',
  'Cyber Security': '#a855f7',
  'FIN': '#10b981',
  'Finance': '#10b981',
  'DTFS': '#0ea5e9',
  'DTFS - Truck Financial Services': '#0ea5e9',
  'PRO': '#14b8a6',
  'Procurement': '#14b8a6',
  'SAL': '#f59e0b',
  'Sales & Aftersales': '#f59e0b',
  'HR': '#ec4899',
  'Human Resources (shared function)': '#ec4899'
};

const GraphPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [projects, setProjects] = useState([]);
  
  // Scope: 'ALL' | 'DOMAIN:<id>' | 'PLATFORM:<id>' | '<projectId>'
  const initialScope = searchParams.get('scope') || searchParams.get('project') || 'ALL';
  const [currentScope, setCurrentScope] = useState(initialScope);
  
  // Layout Mode: 'cluster' (Domain Clusters) | 'tree' (DAG Top-Down) | 'force' (Anti-Collision Force) | 'radial' (Radial DAG)
  const [layoutMode, setLayoutMode] = useState('cluster');
  
  // Label Density: 'smart' (hover + key nodes) | 'all' (all nodes) | 'minimal' (badges only)
  const [labelDensity, setLabelDensity] = useState('smart');

  const [rawGraphData, setRawGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(new Set(Object.keys(ENTITY_COLORS)));
  const [blockersOnly, setBlockersOnly] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Fetch graph based on currentScope
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

  // Fetch deep entity details when a node is selected
  useEffect(() => {
    if (!selectedNode) {
      setNodeDetails(null);
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
  }, [selectedNode]);

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Auto-align and smooth camera fit whenever scope, layoutMode, or filtered data changes
  const autoAlignAndFit = useCallback((duration = 600, padding = 70) => {
    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(duration, padding);
      }
    }, 150);
  }, []);

  useEffect(() => {
    autoAlignAndFit(700, 80);
  }, [currentScope, layoutMode, blockersOnly, autoAlignAndFit]);

  // Configure D3 physics forces for anti-collision and clean cluster separation
  useEffect(() => {
    if (!fgRef.current) return;

    // Configure strong repulsion and collision radius to eliminate overlapping bubbles
    const fg = fgRef.current;
    
    // 1. Repulsion (Charge) - strong push to spread nodes wide
    if (fg.d3Force('charge')) {
      fg.d3Force('charge').strength(layoutMode === 'tree' ? -350 : -600);
    }

    // 2. Link distance - generous spacing
    if (fg.d3Force('link')) {
      fg.d3Force('link').distance(layoutMode === 'tree' ? 100 : 130).strength(0.4);
    }

    // 3. Collision avoidance - prevent overlapping badges
    if (fg.d3Force('collide')) {
      fg.d3Force('collide').radius(45).iterations(3);
    }

    // Re-heat simulation smoothly
    fg.d3ReheatSimulation();
  }, [layoutMode, currentScope, rawGraphData]);

  // Filtered graph data based on scope, search, and type toggles
  const filteredGraphData = useMemo(() => {
    if (!rawGraphData.nodes || rawGraphData.nodes.length === 0) return { nodes: [], links: [] };

    let nodes = [...rawGraphData.nodes];

    // Filter by Scope
    if (currentScope !== 'ALL') {
      if (currentScope.startsWith('DOMAIN:')) {
        const domainId = currentScope.replace('DOMAIN:', '');
        const matchingProjects = projects.filter(p => p.domain_id === domainId || p.department === domainId).map(p => p.project_id);
        const domainNodeIds = new Set(matchingProjects);
        domainNodeIds.add(domainId);

        // Include 1-hop connected services and people
        rawGraphData.links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (domainNodeIds.has(s)) domainNodeIds.add(t);
          if (domainNodeIds.has(t)) domainNodeIds.add(s);
        });
        nodes = nodes.filter(n => domainNodeIds.has(n.id));
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

        // 2-hop to include projects using those services
        rawGraphData.links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (platformNodeIds.has(s)) platformNodeIds.add(t);
          if (platformNodeIds.has(t)) platformNodeIds.add(s);
        });

        nodes = nodes.filter(n => platformNodeIds.has(n.id));
      } else {
        // Single Project Subgraph (2-hop neighborhood)
        const targetId = currentScope;
        const projectNodeIds = new Set([targetId]);
        
        rawGraphData.links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source;
          const t = typeof l.target === 'object' ? l.target.id : l.target;
          if (s === targetId || t === targetId) {
            projectNodeIds.add(s);
            projectNodeIds.add(t);
          }
        });

        nodes = nodes.filter(n => projectNodeIds.has(n.id));
      }
    }

    // Filter by Entity Type
    nodes = nodes.filter(n => selectedTypes.has(n.type));

    // Filter by Blockers
    if (blockersOnly) {
      const blockerIds = new Set();
      nodes.forEach(n => {
        if (n.type === 'ISSUE' || (n.name && (n.name.toLowerCase().includes('defect') || n.name.toLowerCase().includes('blocker') || n.name.toLowerCase().includes('siem') || n.name.toLowerCase().includes('outage')))) {
          blockerIds.add(n.id);
        }
      });
      rawGraphData.links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (blockerIds.has(s)) blockerIds.add(t);
        if (blockerIds.has(t)) blockerIds.add(s);
      });
      nodes = nodes.filter(n => blockerIds.has(n.id));
    }

    // Spatial clustering positions if in 'cluster' mode
    if (layoutMode === 'cluster') {
      nodes.forEach(n => {
        // Find domain for node
        let anchor = null;
        if (n.type === 'DEPARTMENT' && DOMAIN_ANCHORS[n.id]) {
          anchor = DOMAIN_ANCHORS[n.id];
        } else if (n.id.startsWith('P-')) {
          const domainPrefix = n.id.split('-')[1]; // e.g. CYB, FIN, DTFS, PRO, SAL, HR
          if (DOMAIN_ANCHORS[domainPrefix]) anchor = DOMAIN_ANCHORS[domainPrefix];
        } else if (n.id.startsWith('AZ-') || n.id.startsWith('AWS-') || n.id.startsWith('SAP-') || n.id.startsWith('SNF-') || n.id.startsWith('DBX-') || n.type === 'APPLICATION') {
          anchor = DOMAIN_ANCHORS['PLATFORMS'];
        }

        if (anchor && (n.fx === undefined || n.fx === null)) {
          // Softly guide node towards domain cluster anchor
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

  // Custom Supermemory / Obsidian Canvas Renderer with zero clutter
  const drawNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoverNode && hoverNode.id === node.id;
    const isSearched = searchQuery.trim() && (
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      node.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id) || isSearched;
    const isIssue = node.type === 'ISSUE' || (node.name && node.name.includes('Defect'));

    const color = ENTITY_COLORS[node.type] || '#38bdf8';
    const baseRadius = node.val ? Math.sqrt(node.val) * 3.2 : 11;
    const radius = isSelected ? baseRadius * 1.35 : (isHovered ? baseRadius * 1.2 : baseRadius);

    ctx.save();
    ctx.globalAlpha = isHighlighted ? 1 : 0.12;

    // Glowing Neon Ring for selected / searched / blocker nodes
    if (isSelected || isSearched || isIssue) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isSelected ? 9 : 6), 0, 2 * Math.PI, false);
      ctx.fillStyle = isIssue ? 'rgba(239, 68, 68, 0.3)' : (isSelected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(234, 179, 8, 0.35)');
      ctx.fill();
    }

    // Node Circle Solid Badge
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = isSelected ? color : '#0f172a';
    ctx.fill();
    ctx.lineWidth = isSelected ? 3.5 : 2.2;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Node Icon
    const icon = ENTITY_ICONS[node.type] || '•';
    const iconFontSize = Math.max(10, Math.round(radius * 0.95));
    ctx.font = `${iconFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#ffffff' : '#f8fafc';
    ctx.fillText(icon, node.x, node.y + 0.5);

    // Smart Text Label Rendering:
    // Avoid clutter by showing labels when:
    // 1. labelDensity === 'all'
    // 2. Or node is hovered / selected / searched
    // 3. Or zoomed in (globalScale > 1.3)
    // 4. Or node is a major hub (Domain / Platform / Project) in 'smart' mode
    const shouldShowLabel = 
      labelDensity === 'all' ||
      isSelected || 
      isHovered || 
      isSearched || 
      (labelDensity === 'smart' && (globalScale > 1.25 || node.type === 'PROJECT' || node.type === 'DEPARTMENT' || node.type === 'APPLICATION'));

    if (shouldShowLabel && labelDensity !== 'minimal') {
      const label = node.name || node.id;
      const fontSize = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
      ctx.font = `${isSelected ? '700' : '600'} ${fontSize}px system-ui, -apple-system, sans-serif`;
      
      const textWidth = ctx.measureText(label).width;
      const paddingX = 6;
      const paddingY = 3;
      const pillHeight = fontSize + paddingY * 2;
      const pillY = node.y + radius + 3.5;
      const pillX = node.x - textWidth / 2 - paddingX;

      // Contrast label pill background
      ctx.fillStyle = isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, textWidth + paddingX * 2, pillHeight, 4);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isSelected ? color : 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();

      // Label text
      ctx.fillStyle = isSelected ? '#38bdf8' : (isHovered ? '#ffffff' : '#e2e8f0');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, node.x, pillY + pillHeight / 2);
    }

    ctx.restore();
  }, [selectedNode, hoverNode, searchQuery, highlightNodes, labelDensity]);

  // Determine DAG mode based on layoutMode
  const dagMode = useMemo(() => {
    if (layoutMode === 'tree') return 'td'; // Top-Down DAG
    if (layoutMode === 'radial') return 'radialout'; // Radial outward
    return null; // Standard physics force
  }, [layoutMode]);

  return (
    <div className="h-full flex flex-col space-y-3 max-w-7xl mx-auto">
      {/* Top Controls Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 shrink-0">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                <Compass size={18} />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">AutoNova Semantic Knowledge Graph</h1>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                {filteredGraphData.nodes.length} entities • {filteredGraphData.links.length} connections
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Clean visual architecture mapping dependencies across Cyber Security, DTFS, Finance, Procurement, Sales, HR & Platforms
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search entities, systems, leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:w-56 transition-all focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                  ✕
                </button>
              )}
            </div>

            {/* Layout Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setLayoutMode('cluster')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  layoutMode === 'cluster' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Organize into regional domain territories"
              >
                <Grid size={13} /> Domain Clusters
              </button>
              <button
                onClick={() => setLayoutMode('tree')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  layoutMode === 'tree' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Top-down hierarchical dependency tree"
              >
                <GitFork size={13} /> Architecture Tree
              </button>
              <button
                onClick={() => setLayoutMode('force')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  layoutMode === 'force' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Dynamic anti-collision network"
              >
                <LayoutGrid size={13} /> Force Network
              </button>
            </div>

            {/* Label Density Toggle */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <Eye size={13} className="text-slate-400" />
              <select
                value={labelDensity}
                onChange={(e) => setLabelDensity(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-2"
              >
                <option value="smart">Smart Labels</option>
                <option value="all">Show All Labels</option>
                <option value="minimal">Badges Only</option>
              </select>
            </div>

            {/* Blockers Only Toggle */}
            <button
              onClick={() => setBlockersOnly(!blockersOnly)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                blockersOnly 
                  ? 'bg-red-50 text-red-700 border-red-300 shadow-sm' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle size={13} className={blockersOnly ? 'text-red-600 animate-pulse' : 'text-slate-400'} />
              Blockers
            </button>

            {/* Auto Align & Reset View */}
            <button 
              onClick={() => autoAlignAndFit(500, 70)}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold shadow-sm transition-colors"
              title="Auto-align and center graph"
            >
              <RotateCcw size={13} /> Auto-Align & Fit
            </button>
          </div>
        </div>

        {/* Domain Scope Quick Filters Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          <button
            onClick={() => setCurrentScope('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🌟 Entire Enterprise (31 Projects)
          </button>

          {/* 6 Business Domains */}
          <button
            onClick={() => setCurrentScope('DOMAIN:CYB')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'DOMAIN:CYB' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            🛡️ Cyber Security (7)
          </button>

          <button
            onClick={() => setCurrentScope('DOMAIN:DTFS')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'DOMAIN:DTFS' ? 'bg-sky-600 text-white shadow-sm' : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
            }`}
          >
            💰 DTFS (6)
          </button>

          <button
            onClick={() => setCurrentScope('DOMAIN:FIN')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'DOMAIN:FIN' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            📊 Finance (6)
          </button>

          <button
            onClick={() => setCurrentScope('DOMAIN:PRO')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'DOMAIN:PRO' ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            📦 Procurement (5)
          </button>

          <button
            onClick={() => setCurrentScope('DOMAIN:SAL')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'DOMAIN:SAL' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            🚚 Sales & Aftersales (6)
          </button>

          <button
            onClick={() => setCurrentScope('DOMAIN:HR')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              currentScope === 'DOMAIN:HR' ? 'bg-pink-600 text-white shadow-sm' : 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100'
            }`}
          >
            👥 HR (1)
          </button>

          <span className="text-slate-300">|</span>

          {/* 5 Cloud Platforms */}
          {PLATFORMS.map(pl => (
            <button
              key={pl.id}
              onClick={() => setCurrentScope(`PLATFORM:${pl.id}`)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                currentScope === `PLATFORM:${pl.id}` ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              ☁️ {pl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        <div 
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl" 
          ref={containerRef}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw size={24} className="text-sky-400 animate-spin" />
                <span className="text-xs font-bold text-slate-300">Auto-Aligning Knowledge Graph...</span>
              </div>
            </div>
          ) : null}

          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredGraphData}
            dagMode={dagMode}
            dagLevelDistance={110}
            nodeCanvasObject={drawNode}
            nodePointerAreaPaint={(node, color, ctx) => {
              const radius = node.val ? Math.sqrt(node.val) * 3.5 : 12;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            linkColor={(link) => {
              const lbl = link.label || '';
              if (lbl.includes('CRITICAL') || lbl === 'BLOCKS') return '#ef4444';
              if (lbl.includes('HIGH')) return '#f97316';
              if (lbl.includes('MEDIUM')) return '#eab308';
              if (lbl.includes('APPROVES') || lbl === 'GOVERNS') return '#10b981';
              return 'rgba(100, 116, 139, 0.4)';
            }}
            linkWidth={(link) => {
              const lbl = link.label || '';
              if (lbl.includes('CRITICAL') || lbl === 'BLOCKS') return 2.8;
              if (lbl.includes('HIGH')) return 2.0;
              return 1.4;
            }}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={(link) => {
              const lbl = link.label || '';
              if (lbl.includes('CRITICAL')) return 3.2;
              return 2;
            }}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={(link) => {
              const lbl = link.label || '';
              if (lbl.includes('CRITICAL')) return '#ef4444';
              if (lbl.includes('HIGH')) return '#f97316';
              return '#38bdf8';
            }}
            linkDirectionalArrowLength={5}
            linkDirectionalArrowRelPos={1}
            linkLabel={(link) => `${link.label || 'CONNECTS'}`}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.25}
            warmupTicks={30}
            cooldownTicks={100}
            onNodeHover={(node) => setHoverNode(node || null)}
            onNodeClick={(node) => {
              setSelectedNode(node);
              if (node.x !== undefined && node.y !== undefined) {
                fgRef.current?.centerAt(node.x, node.y, 700);
                fgRef.current?.zoom(2.5, 700);
              }
            }}
          />
          
          {/* Quick HUD Navigation Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-2 rounded-lg shadow-lg text-[11px] text-slate-300 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">Mode: {layoutMode === 'cluster' ? '🧬 Domain Clusters' : (layoutMode === 'tree' ? '🌳 Architecture Tree' : '🌌 Force Network')}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Click any entity to inspect full context & dependencies</span>
          </div>
        </div>

        {/* Slite / Supermemory Standard Deep Node Inspector Drawer */}
        {selectedNode && (
          <div className="w-96 bg-white border border-slate-200 rounded-xl p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200 z-10">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl p-1 bg-slate-100 rounded-lg">{ENTITY_ICONS[selectedNode.type] || '📌'}</span>
                  <div>
                    <span 
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${ENTITY_COLORS[selectedNode.type]}20`,
                        color: ENTITY_COLORS[selectedNode.type]
                      }}
                    >
                      {selectedNode.type}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 leading-tight mt-1">{selectedNode.name}</h3>
                    <p className="font-mono text-[11px] text-slate-400">{selectedNode.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Semantic Description */}
              {selectedNode.desc && (
                <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-3">
                  <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider block mb-1">
                    Semantic Purpose
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedNode.desc}</p>
                </div>
              )}

              {/* Connected Relationships (Clickable Graph Traversal!) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Connected Dependencies ({nodeDetails?.connections?.length || 0})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-hop neighborhood</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {nodeDetails?.connections && nodeDetails.connections.length > 0 ? (
                    nodeDetails.connections.map((conn, idx) => {
                      const isOut = conn.direction === 'OUTGOING';
                      const targetId = isOut ? conn.targetId : conn.sourceId;
                      const targetName = isOut ? conn.targetName : conn.sourceName;
                      const targetType = isOut ? conn.targetType : conn.sourceType;

                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            const targetNode = filteredGraphData.nodes.find(n => n.id === targetId);
                            if (targetNode) {
                              setSelectedNode(targetNode);
                              if (targetNode.x !== undefined && targetNode.y !== undefined) {
                                fgRef.current?.centerAt(targetNode.x, targetNode.y, 700);
                                fgRef.current?.zoom(2.5, 700);
                              }
                            }
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-colors cursor-pointer group text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs">{ENTITY_ICONS[targetType] || '•'}</span>
                            <div className="truncate">
                              <span className="font-bold text-slate-800 group-hover:text-sky-700 block truncate">
                                {targetName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {isOut ? `→ ${conn.label}` : `← ${conn.label}`}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-600 shrink-0" />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded">No direct links in current view</p>
                  )}
                </div>
              </div>

              {/* Citations & Evidence */}
              {nodeDetails?.evidence && nodeDetails.evidence.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                    Verified Ground Truth
                  </span>
                  <div className="space-y-2">
                    {nodeDetails.evidence.map((ev, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Bookmark size={12} className="text-sky-600" /> {ev.source}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold">
                            Confidence 100%
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-snug">{ev.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  navigate(`/chat?query=${encodeURIComponent(`Explain ${selectedNode.name} (${selectedNode.id}) and all its upstream and downstream dependencies in AutoNova Group`)}`);
                }}
                className="w-full py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles size={14} /> Ask Gemini About This Entity
              </button>
              
              <button 
                onClick={() => autoAlignAndFit(500, 70)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
              >
                Reset Zoom & Focus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphPage;

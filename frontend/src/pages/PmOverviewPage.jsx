import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, User, DollarSign, Target, ShieldAlert, CheckCircle2, 
  AlertTriangle, ChevronRight, Layers, ArrowRight, Activity, 
  Clock, Shield, Sparkles, Filter, Users, Briefcase, Award, ChevronDown,
  GitBranch, Network, GitCommit, FolderKanban, ArrowDown, Cpu, Search,
  X, ExternalLink, Info, Check, Table, ListTree
} from 'lucide-react';
import api from '../utils/api';

const LEVEL_CONFIG = {
  E1: { 
    code: 'E1',
    label: 'E1 • Executive Board & C-Level (CEO, CTO, CIO, CFO)', 
    sub: 'Strategic mandate, group enterprise governance, capital envelope authorization (€75M+)',
    color: 'border-purple-500 bg-purple-50/50',
    headerBg: 'bg-purple-900 text-purple-100',
    badge: 'bg-purple-600 text-white'
  },
  E2: { 
    code: 'E2',
    label: 'E2 • Functional & Domain Directors', 
    sub: 'Directorial governance across Cyber Security, Group Accounting, Treasury, Retail Lending, and Aftersales',
    color: 'border-blue-500 bg-blue-50/50',
    headerBg: 'bg-blue-900 text-blue-100',
    badge: 'bg-blue-600 text-white'
  },
  E3: { 
    code: 'E3',
    label: 'E3 • Vice Presidents (VPs)', 
    sub: 'Domain P&L ownership, multi-project strategic roadmaps, strategic sourcing & global sales',
    color: 'border-emerald-500 bg-emerald-50/50',
    headerBg: 'bg-emerald-900 text-emerald-100',
    badge: 'bg-emerald-600 text-white'
  },
  E4: { 
    code: 'E4',
    label: 'E4 • General Managers & Platform Leads (GMs & Lead Architects)', 
    sub: 'Core platform engineering, shared cloud landing zones (Azure, AWS, SAP, Snowflake), and ADR governance',
    color: 'border-amber-500 bg-amber-50/50',
    headerBg: 'bg-amber-900 text-amber-100',
    badge: 'bg-amber-600 text-white'
  },
  E5: { 
    code: 'E5',
    label: 'E5 • Engineering Managers & Product Owners (Managers & POs)', 
    sub: 'Sprint delivery ownership, backlog prioritization, operational readiness gates, and team execution',
    color: 'border-slate-400 bg-slate-50',
    headerBg: 'bg-slate-800 text-slate-100',
    badge: 'bg-slate-600 text-white'
  }
};

const PmOverviewPage = () => {
  const navigate = useNavigate();
  const [hierarchyData, setHierarchyData] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'grid'
  const [treeSubMode, setTreeSubMode] = useState('flow'); // 'flow' | 'matrix'
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  
  // Default to Thomas Keller (CFO) - no more confusing "All Leadership" option!
  const [selectedLeader, setSelectedLeader] = useState('E0998');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Inspector modal for person details
  const [inspectedPerson, setInspectedPerson] = useState(null);

  useEffect(() => {
    api.get('/enterprise/hierarchy')
      .then(res => {
        setHierarchyData(res.data);
      })
      .catch(err => {
        console.error('Failed to load hierarchy:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Loading Executive Project Management & Org Map...</span>
      </div>
    );
  }

  const levels = hierarchyData?.levels || {};
  const summary = hierarchyData?.summary || {};
  const trees = hierarchyData?.trees || [];
  const currentTree = trees.find(t => t.person_id === selectedLeader) || trees[0];

  const isMatchSearch = (item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.job_title || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q) ||
      (item.assigned_domain || '').toLowerCase().includes(q) ||
      (item.role_focus || '').toLowerCase().includes(q) ||
      (item.roles_and_responsibilities || '').toLowerCase().includes(q) ||
      (item.projects || []).some(pr => (pr.name || '').toLowerCase().includes(q) || (pr.project_id || '').toLowerCase().includes(q))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Building size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block">Enterprise Governance</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Project Management & Executive Org Hierarchy</h1>
            </div>
          </div>
          
          {/* View Mode Toggle: Tree vs Grid */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tree' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch size={13} /> Visual Org Tree Flow
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={13} /> Tiered Grid Cards
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Executive leadership hierarchy mapping <strong>E1 (C-Level Board)</strong> directly to <strong>E2 (Directors)</strong>, 
          <strong> E4 (Platform Leads)</strong>, and <strong>E5 (Managers & POs)</strong> with assigned enterprise domains and active delivery projects.
        </p>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">E1 C-Level Board</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{summary.e1_count || 3} Officers</span>
            <span className="text-[10px] text-slate-400">CEO, CTO/CIO, CFO</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">E2 Directors</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{summary.e2_count || 7} Directors</span>
            <span className="text-[10px] text-slate-400">Domain & Functional</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">E3 Vice Presidents</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{summary.e3_count || 2} VPs</span>
            <span className="text-[10px] text-slate-400">Strategic Sourcing & Sales</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">E4 General Managers</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{summary.e4_count || 11} GMs / Leads</span>
            <span className="text-[10px] text-slate-400">Platform Leads & Architects</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">E5 Managers & POs</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{summary.e5_count || 27} Managers</span>
            <span className="text-[10px] text-slate-400">Agile Sprint Delivery</span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: COMPACT VISUAL ORG TREE FLOW (NO NESTED BOXES!) */}
      {viewMode === 'tree' && currentTree && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
          {/* Top Control Bar: 3 Leader Branch Tabs & Search */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
            {/* 3 Executive Branch Tabs (NO "All Leadership" option!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
              {/* Thomas Keller CFO Tab */}
              <button
                onClick={() => setSelectedLeader('E0998')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedLeader === 'E0998'
                    ? 'bg-emerald-950 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-900 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedLeader === 'E0998' ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    CFO Branch
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${selectedLeader === 'E0998' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200 text-emerald-800'}`}>
                    E0998
                  </span>
                </div>
                <span className="text-xs font-bold block mt-1">Thomas Keller (CFO)</span>
                <span className={`text-[10px] block truncate ${selectedLeader === 'E0998' ? 'text-emerald-200' : 'text-emerald-600'}`}>
                  Finance & DTFS &bull; 12 Projects
                </span>
              </button>

              {/* Dr. Elena Rostova CTO/CIO Tab */}
              <button
                onClick={() => setSelectedLeader('E1000')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedLeader === 'E1000'
                    ? 'bg-purple-950 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/30'
                    : 'bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedLeader === 'E1000' ? 'text-purple-300' : 'text-purple-700'}`}>
                    CTO & CIO Branch
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${selectedLeader === 'E1000' ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-800'}`}>
                    E1000
                  </span>
                </div>
                <span className="text-xs font-bold block mt-1">Dr. Elena Rostova (CTO)</span>
                <span className={`text-[10px] block truncate ${selectedLeader === 'E1000' ? 'text-purple-200' : 'text-purple-600'}`}>
                  Cyber, Platforms & IoT &bull; 7 Projects
                </span>
              </button>

              {/* Markus Weber CEO Tab */}
              <button
                onClick={() => setSelectedLeader('E0999')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedLeader === 'E0999'
                    ? 'bg-indigo-950 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/30'
                    : 'bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-900 border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${selectedLeader === 'E0999' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    CEO Branch
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${selectedLeader === 'E0999' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-200 text-indigo-800'}`}>
                    E0999
                  </span>
                </div>
                <span className="text-xs font-bold block mt-1">Markus Weber (CEO)</span>
                <span className={`text-[10px] block truncate ${selectedLeader === 'E0999' ? 'text-indigo-200' : 'text-indigo-600'}`}>
                  Procurement, Sales, HR &bull; 12 Projects
                </span>
              </button>
            </div>

            {/* Sub-Mode Switcher & Search */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setTreeSubMode('flow')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    treeSubMode === 'flow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Visual Compact Branching Flow"
                >
                  <ListTree size={12} /> Visual Tree
                </button>
                <button
                  onClick={() => setTreeSubMode('matrix')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    treeSubMode === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Single Screen Compact Lineage Matrix"
                >
                  <Table size={12} /> Matrix View
                </button>
              </div>

              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Filter leader, team, or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 1. COMPACT E1 EXECUTIVE HEADER NODE (Clean & Non-Bloated) */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0">
                {currentTree.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{currentTree.name}</h3>
                  <span className="text-[10px] font-mono bg-purple-400/20 text-purple-300 border border-purple-400/30 px-1.5 py-0.2 rounded font-bold">
                    {currentTree.person_id}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded">
                    E1 Board Member
                  </span>
                </div>
                <span className="text-xs text-purple-200 block">{currentTree.job_title} &bull; {currentTree.department}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-left md:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Capital Oversight</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  €{(currentTree.budget_oversight || 0).toLocaleString()}
                </span>
              </div>
              <div className="text-left md:text-right border-l border-slate-700 pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Headcount</span>
                <span className="text-sm font-bold font-mono text-cyan-300">
                  {currentTree.headcount_oversight} Staff
                </span>
              </div>
              <button
                onClick={() => setInspectedPerson(currentTree)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                Inspect Mandate
              </button>
            </div>
          </div>

          {/* 2. SUB-MODE A: VISUAL COMPACT TREE FLOW (NO NESTED BOXES!) */}
          {treeSubMode === 'flow' && (
            <div className="space-y-6 pt-2">
              {(currentTree.direct_reports || []).map((dir, dirIdx) => {
                if (!isMatchSearch(dir) && searchQuery) return null;

                const leads = dir.direct_reports || [];
                const totalProjects = leads.reduce((acc, l) => {
                  const leadProjects = l.projects || [];
                  const subProjects = (l.direct_reports || []).flatMap(e5 => e5.projects || []);
                  return acc + leadProjects.length + subProjects.length;
                }, 0);

                return (
                  <div key={dirIdx} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3.5">
                    {/* Director Header Strip */}
                    <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {dir.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{dir.name}</h4>
                            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-bold">
                              {dir.person_id}
                            </span>
                            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded">
                              {dir.executive_grade} Director
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 block">{dir.job_title}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          {dir.assigned_domain}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          €{(dir.budget_oversight || 15000000).toLocaleString()} &bull; {totalProjects} Projects
                        </span>
                        <button
                          onClick={() => setInspectedPerson(dir)}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded transition-colors cursor-pointer"
                          title="View Director Mandate & Responsibilities"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Compact Teams & Project Lineage (Horizontal Flow Nodes) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {leads.map((lead, leadIdx) => {
                        const directProjects = lead.projects || [];
                        const e5Reports = lead.direct_reports || [];

                        return (
                          <div 
                            key={leadIdx}
                            className="bg-white rounded-xl border border-slate-200 hover:border-sky-300 shadow-2xs p-3 space-y-2.5 transition-all text-xs flex flex-col justify-between"
                          >
                            {/* Lead Info */}
                            <div>
                              <div className="flex items-start justify-between gap-1.5 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs">{lead.name}</span>
                                  <span className="text-[9px] font-bold bg-amber-500 text-white px-1 py-0.2 rounded">
                                    {lead.executive_grade}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-400">{lead.person_id}</span>
                              </div>
                              <span className="text-[11px] text-amber-900 font-medium block leading-tight">{lead.job_title}</span>
                              {lead.role_focus && (
                                <span className="text-[10px] text-slate-400 italic block mt-0.5 line-clamp-1">{lead.role_focus}</span>
                              )}
                            </div>

                            {/* Directly Owned Projects (Clean Clickable Pills) */}
                            {directProjects.length > 0 && (
                              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                                  Projects ({directProjects.length}):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {directProjects.map((pr, pIdx) => (
                                    <button
                                      key={pIdx}
                                      onClick={() => navigate(`/project/${pr.project_id}`)}
                                      className="px-2 py-0.5 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer group"
                                      title={pr.name}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        pr.rag_status === 'GREEN' ? 'bg-emerald-500' :
                                        pr.rag_status === 'AMBER' ? 'bg-amber-500' : 'bg-red-500'
                                      }`}></span>
                                      <span className="font-mono text-[9px] text-slate-500 group-hover:text-sky-600">{pr.project_id}</span>
                                      <span className="truncate max-w-[110px]">{pr.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Subordinate E5 POs / Managers */}
                            {e5Reports.length > 0 && (
                              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                                  E5 Product Owners ({e5Reports.length}):
                                </span>
                                <div className="space-y-1">
                                  {e5Reports.map((e5, e5Idx) => (
                                    <div key={e5Idx} className="bg-slate-50/70 p-1.5 rounded-lg border border-slate-200/80 text-[10px] space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800">{e5.name}</span>
                                        <span className="text-[9px] text-slate-400 font-mono">{e5.executive_grade}</span>
                                      </div>
                                      {e5.projects && e5.projects.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {e5.projects.map((pr, prIdx) => (
                                            <button
                                              key={prIdx}
                                              onClick={() => navigate(`/project/${pr.project_id}`)}
                                              className="px-1.5 py-0.2 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded text-[9px] flex items-center gap-1 cursor-pointer"
                                            >
                                              <span className={`w-1 h-1 rounded-full ${
                                                pr.rag_status === 'GREEN' ? 'bg-emerald-500' :
                                                pr.rag_status === 'AMBER' ? 'bg-amber-500' : 'bg-red-500'
                                              }`}></span>
                                              <span className="font-mono">{pr.project_id}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. SUB-MODE B: SINGLE-SCREEN LINEAGE MATRIX VIEW (ZERO SCROLLING) */}
          {treeSubMode === 'matrix' && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-3">E2/E3 Director</th>
                    <th className="py-2.5 px-3">Assigned Domain</th>
                    <th className="py-2.5 px-3">Platform Leads (E4)</th>
                    <th className="py-2.5 px-3">Sprint POs (E5)</th>
                    <th className="py-2.5 px-3">Portfolio Projects & Status</th>
                    <th className="py-2.5 px-3 text-right">Budget Envelope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(currentTree.direct_reports || []).map((dir, dirIdx) => {
                    const leads = dir.direct_reports || [];
                    const allProjects = leads.flatMap(l => [
                      ...(l.projects || []),
                      ...(l.direct_reports || []).flatMap(e5 => e5.projects || [])
                    ]);
                    const allE5 = leads.flatMap(l => l.direct_reports || []);

                    return (
                      <tr key={dirIdx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 align-top font-bold text-slate-900">
                          <div>{dir.name}</div>
                          <span className="text-[10px] text-blue-700 font-mono font-medium block">
                            {dir.job_title}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-mono text-[10px] font-bold">
                            {dir.assigned_domain}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="space-y-1">
                            {leads.map((l, lIdx) => (
                              <div key={lIdx} className="text-[11px]">
                                <span className="font-semibold text-slate-800">{l.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono ml-1">({l.person_id})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="space-y-1">
                            {allE5.map((e5, eIdx) => (
                              <div key={eIdx} className="text-[10px] text-slate-600">
                                <span>{e5.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {allProjects.map((pr, prIdx) => (
                              <button
                                key={prIdx}
                                onClick={() => navigate(`/project/${pr.project_id}`)}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-sky-50 text-slate-800 hover:text-sky-700 rounded text-[10px] border border-slate-200 flex items-center gap-1 cursor-pointer"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  pr.rag_status === 'GREEN' ? 'bg-emerald-500' :
                                  pr.rag_status === 'AMBER' ? 'bg-amber-500' : 'bg-red-500'
                                }`}></span>
                                <span className="font-mono">{pr.project_id}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top text-right font-mono font-bold text-slate-900">
                          €{(dir.budget_oversight || 15000000).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TIERED GRID CARDS (Alternative Tiered View) */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter size={13} /> Level:
              </span>
              {['ALL', 'E1', 'E2', 'E3', 'E4', 'E5'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedLevel === lvl 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl === 'ALL' ? 'All Tiers' : lvl}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Filter by person name, initiative, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Level Cards */}
          {['E1', 'E2', 'E3', 'E4', 'E5']
            .filter(lvlKey => selectedLevel === 'ALL' || selectedLevel === lvlKey)
            .map(lvlKey => {
              const levelInfo = levels[lvlKey];
              const config = LEVEL_CONFIG[lvlKey] || LEVEL_CONFIG.E5;
              if (!levelInfo) return null;

              const filteredMembers = (levelInfo.members || []).filter(m => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                  m.name.toLowerCase().includes(q) ||
                  m.job_title.toLowerCase().includes(q) ||
                  m.department.toLowerCase().includes(q) ||
                  (m.projects || []).some(pr => pr.name.toLowerCase().includes(q))
                );
              });

              if (filteredMembers.length === 0 && searchQuery) return null;

              return (
                <div key={lvlKey} className="card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase ${config.badge}`}>
                          {lvlKey}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {config.label}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        {config.sub}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                      {filteredMembers.length} Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((member, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900 text-sm block group-hover:text-sky-600 transition-colors">
                                {member.name}
                              </span>
                              <span className="text-[11px] font-medium text-slate-600 block">
                                {member.job_title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono bg-white text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                              {member.person_id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span>{member.department}</span>
                            <span>&bull;</span>
                            <span>{member.location || 'Stuttgart HQ'}</span>
                          </div>

                          {/* Direct Initiatives / Owned Projects */}
                          {member.direct_initiatives && member.direct_initiatives.length > 0 ? (
                            <div className="mt-3 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mandates:</span>
                              <div className="flex flex-wrap gap-1">
                                {member.direct_initiatives.map((init, i) => (
                                  <span key={i} className="text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">
                                    {init}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Managed Initiatives ({member.projects?.length || 0}):
                              </span>
                              <div className="space-y-1">
                                {(member.projects || []).slice(0, 3).map((pr, pIdx) => (
                                  <button
                                    key={pIdx}
                                    onClick={() => navigate(`/project/${pr.project_id}`)}
                                    className="w-full text-left p-1.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-md transition-all flex items-center justify-between group/p cursor-pointer"
                                  >
                                    <div className="truncate mr-1">
                                      <span className="font-mono text-[9px] font-bold text-slate-400 mr-1">{pr.project_id}</span>
                                      <span className="text-[11px] font-semibold text-slate-800 group-hover/p:text-sky-600 truncate">{pr.name}</span>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                      pr.rag_status === 'GREEN' ? 'bg-emerald-500' :
                                      pr.rag_status === 'AMBER' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}></span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            {member.headcount_oversight ? `Oversight: ${member.headcount_oversight} Staff` : `Projects: ${member.projects_count || 0}`}
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            €{(member.budget_oversight || member.total_budget_oversight || 2500000).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* INSPECTOR MODAL: PERSON DETAILS & GOVERNANCE MANDATE */}
      {inspectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{inspectedPerson.name}</h3>
                  <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {inspectedPerson.person_id}
                  </span>
                  <span className="text-xs font-bold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                    {inspectedPerson.executive_grade}
                  </span>
                </div>
                <span className="text-xs text-slate-600 block mt-0.5 font-medium">{inspectedPerson.job_title}</span>
                <span className="text-[11px] text-slate-400 block">{inspectedPerson.department} &bull; {inspectedPerson.location || 'Stuttgart HQ'}</span>
              </div>
              <button
                onClick={() => setInspectedPerson(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mandate & Scope */}
            {(inspectedPerson.mandate || inspectedPerson.roles_and_responsibilities) && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Governance Mandate & Assigned Domain:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {inspectedPerson.mandate || inspectedPerson.roles_and_responsibilities}
                </p>
              </div>
            )}

            {/* Oversight Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Capital Oversight</span>
                <span className="text-sm font-bold font-mono text-emerald-700 mt-0.5 block">
                  €{(inspectedPerson.budget_oversight || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff / Direct Reports</span>
                <span className="text-sm font-bold font-mono text-cyan-700 mt-0.5 block">
                  {inspectedPerson.headcount_oversight || inspectedPerson.direct_reports?.length || 0} Members
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedPerson(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PmOverviewPage;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Layers, 
  FileText, Database, GitBranch, MessageSquare, Bot, ExternalLink, 
  RefreshCw, Cloud, Users, Shield, Cpu, Play, Bookmark, Clock, Bug,
  DollarSign, ArrowRight, ArrowDownRight, Tag, HelpCircle, Activity,
  Server, Lock, Info, Trello, CheckSquare, ShieldCheck, AlertCircle, Zap, Code, LayoutDashboard,
  Maximize2, ZoomIn, ZoomOut, Download, Image as ImageIcon, X,
  Trash2, ChevronUp, ChevronDown, Sparkles
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../utils/api';
import { READINESS_COLORS, ENTITY_COLORS } from '../utils/constants';
import { usePersona } from '../hooks/usePersona';
import MarkdownViewer from '../components/MarkdownViewer';

// Semantic entity icons for project data flow graph nodes
const getProjectNodeIcon = (node) => {
  if (!node) return '•';
  if (node.is_center) return '🎯';
  if (node.flow_role === 'PRODUCER') return '📥';
  if (node.flow_role === 'CONSUMER') return '📤';
  if (node.flow_role === 'SERVICE' || node.type === 'APPLICATION' || node.type === 'SERVICE') return '☁️';
  if (node.flow_role === 'OWNER' || node.flow_role === 'LEAD' || node.type === 'PERSON') return '👤';
  if (node.type === 'PROJECT') return '🚀';
  return '📦';
};

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { persona } = usePersona();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 850, height: 480 });
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [diagramZoom, setDiagramZoom] = useState(1);
  const graphContainerRef = useRef(null);
  const fgRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projRes, graphRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/graph`)
        ]);
        setProject(projRes.data);
        setGraphData(graphRes.data);
      } catch (err) {
        console.error('Failed to load project details:', err);
      }
    };
    fetchProject();
  }, [projectId, persona]);

  // Handle responsive sizing & auto-centering when Knowledge Graph tab is activated
  useEffect(() => {
    if (activeTab === 'graph') {
      const timer = setTimeout(() => {
        if (graphContainerRef.current) {
          const w = graphContainerRef.current.offsetWidth || 850;
          const h = graphContainerRef.current.offsetHeight || 480;
          setDimensions({ width: w, height: h });
        }
        if (fgRef.current) {
          fgRef.current.d3Force('charge')?.strength(-420);
          fgRef.current.d3Force('link')?.distance(110);
          fgRef.current.zoomToFit(500, 60);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, graphData]);

  // Auto-scroll chat history when new messages or loading states arrive
  useEffect(() => {
    if (chatHistory.length > 0 || chatLoading) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  const handleProjectChat = async (presetText = null) => {
    const q = presetText || chatInput;
    if (!q || !q.trim() || chatLoading) return;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);

    try {
      const res = await api.post('/chat', {
        query: `${q} (Project Context: ${projectId})`,
        role: persona
      }, {
        headers: { 'x-user-role': persona }
      });
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: res.data.answer,
        citations: res.data.citations,
        intent: res.data.intent
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: 'Sorry, I encountered an error analyzing the knowledge graph for this project.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!project) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading project deep-dive...</div>;
  }

  const readiness = project.readiness || { status: 'READY', score: 85, rules: [], failed_rules: [] };
  const conflicts = project.conflicts || [];
  const evidence = project.evidence || [];
  const sourceFreshness = project.source_freshness || [];
  const unstr = project.unstructured_knowledge || {};
  const dataFlow = project.data_flow || { data_ingested: [], data_produced: [] };
  const readinessColor = READINESS_COLORS[readiness.status] || READINESS_COLORS.READY;

  const isFinancialRole = ['Management', 'PM', 'Architect'].includes(persona);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-28">
      {/* Top Breadcrumb & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate(`/department/${encodeURIComponent(project.domain_id || project.department)}`)} 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to {project.domain || project.department} Domain
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Cost Center: {project.budget?.cost_center || 'CC-GEN-01'}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
            project.rag_status === 'GREEN' ? 'bg-emerald-100 text-emerald-800' :
            project.rag_status === 'AMBER' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            RAG: {project.rag_status || 'GREEN'}
          </span>
        </div>
      </div>

      {/* Project Banner */}
      <div className="card p-6 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              {project.project_id}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${readinessColor}`}>
              {readiness.status.replace(/_/g, ' ')} ({readiness.score}%)
            </span>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded">
              {project.lifecycle_phase || 'Live (Operate)'}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
              project.business_criticality === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
              project.business_criticality === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              {project.business_criticality} Criticality
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {project.description || project.business_objective}
          </p>
          
          {/* Strategic Initiative Tags */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strategic Tags:</span>
            {(project.strategic_initiatives || []).map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Ownership Summary Badge */}
        <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs shadow-xs">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Business Owner</span>
            <span className="font-bold text-slate-800 block">{project.business_owner?.name}</span>
            <span className="text-[10px] text-slate-500">{project.business_owner?.job_title}</span>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Tech Lead</span>
            <span className="font-bold text-slate-800 block">{project.tech_lead?.name}</span>
            <span className="text-[10px] text-slate-500">{project.tech_lead?.job_title}</span>
          </div>
        </div>
      </div>

      {/* Freshness & Per-Source Connector Strip */}
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs overflow-x-auto gap-4 shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
          <Clock size={14} className="text-sky-400" />
          <span className="font-bold text-slate-200">7 Connected Systems:</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {sourceFreshness.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-md">
              <span className={`w-1.5 h-1.5 rounded-full ${s.is_live ? 'bg-emerald-400' : 'bg-sky-400'}`}></span>
              <span className="font-bold text-slate-200">{s.system}</span>
              <span className="text-slate-400 text-[10px]">({s.last_synced})</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${s.is_live ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                {s.is_live ? 'LIVE API' : 'MOCK'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white/60 rounded-xl px-2">
        <nav className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          {[
            { id: 'overview', label: 'Overview & Dependencies' },
            { id: 'jira', label: `Jira Delivery (${project.jira?.issues?.length || project.jira?.total_issues || 0})` },
            { id: 'leanix', label: `LeanIX Architecture (${project.leanix?.data_quality_pct || 94}%)` },
            { id: 'dataflow', label: 'Automobile Data Flow' },
            { id: 'readiness', label: `Readiness Gates (${readiness.rules_passed || 10}/${readiness.total_rules || 10})` },
            { id: 'conflicts', label: `Conflicts (${conflicts.length})` },
            { id: 'unstructured', label: 'ADRs & Runbooks' },
            { id: 'graph', label: 'Knowledge Graph' },
            { id: 'evidence', label: `Evidence (${evidence.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 pt-1 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${activeTab === tab.id ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Readiness Explanation Callout */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              readiness.status === 'READY' ? 'bg-emerald-50/70 border-emerald-200' :
              readiness.status === 'CONDITIONALLY_READY' ? 'bg-amber-50/70 border-amber-200' :
              'bg-red-50/70 border-red-200'
            }`}>
              <div className="mt-0.5">
                {readiness.status === 'READY' ? <CheckCircle2 className="text-emerald-600" size={20} /> : <AlertTriangle className={readiness.status === 'CONDITIONALLY_READY' ? 'text-amber-600' : 'text-red-600'} size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Executive Production Readiness Assessment
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    Score: {readiness.score}% ({readiness.rules_passed}/{readiness.total_rules} Gates)
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  {readiness.summary}
                </p>
              </div>
            </div>

            {/* Financial & Governance Baseline */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DollarSign size={15} className="text-sky-600" /> Financial Envelope & Cost Center Allocation
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  Fiscal Year 2026
                </span>
              </div>

              {isFinancialRole ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cost Center</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{project.budget?.cost_center}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Approved Capex</span>
                    <span className="text-sm font-bold text-slate-900">€{(project.budget?.capex_planned || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Opex Baseline</span>
                    <span className="text-sm font-bold text-slate-900">€{(project.budget?.opex_planned || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Budget Variance</span>
                    <span className="text-sm font-bold text-emerald-600">0.0% (On Budget)</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                  <Lock size={14} className="text-slate-400" />
                  <span>Financial budget details are restricted for active role (<strong>{persona}</strong>). Switch persona to Management or PM to view full Capex/Opex figures.</span>
                </div>
              )}
            </div>

            {/* Architecture Blueprint Preview Banner */}
            <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => setActiveTab('leanix')}
                  className="w-28 h-16 bg-slate-950 rounded-lg border border-slate-200 overflow-hidden shrink-0 hidden sm:block cursor-pointer hover:border-sky-500 transition-colors group relative"
                >
                  <img
                    src={`/architecture/${project.project_id}.svg`}
                    alt="Blueprint Preview"
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 size={13} className="text-sky-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-bold">
                      VERIFIED SYSTEM ARCHITECTURE
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Multi-Tier Cloud Topology ({project.project_id}.svg)
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1 flex items-center gap-2">
                    <Zap size={15} className="text-sky-600" />
                    {project.name} Cloud Architecture Blueprint
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                    Client Tier &bull; Azure API Gateway &bull; AKS Microservices Mesh &bull; Kafka Streaming &bull; PostgreSQL / Redis Persistence.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('leanix')}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Inspect Architecture Blueprint <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Downstream Impact & Upstream Dependencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Downstream Impact: Who Depends on Me? */}
              <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3 border-t-4 border-t-purple-600">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ArrowDownRight className="text-purple-600" size={18} />
                    Downstream Impact: Who Depends on Me?
                  </h3>
                  <span className="font-mono text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                    {project.downstream_dependents?.length || 0} Consumer Systems
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  If this system suffers an outage or breaks backward compatibility, these downstream systems will be impacted:
                </p>

                <div className="space-y-2">
                  {(project.downstream_dependents || []).length > 0 ? (
                    project.downstream_dependents.map((d, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-start gap-3 hover:bg-purple-50/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{d.consumer_name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({d.consumer_id})</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{d.description}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                          d.criticality === 'critical' ? 'bg-red-100 text-red-700' :
                          d.criticality === 'high' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {d.criticality}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                      No downstream consumer dependencies currently registered in enterprise matrix.
                    </p>
                  )}
                </div>
              </div>

              {/* Upstream Dependencies: What Do I Depend On? */}
              <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3 border-t-4 border-t-blue-600">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ArrowRight className="text-blue-600" size={18} />
                    Upstream Dependencies: What Do I Rely On?
                  </h3>
                  <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {project.upstream_dependencies?.length || 0} Provider Systems
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This project requires uninterrupted availability and data feeds from the following providers:
                </p>

                <div className="space-y-2">
                  {(project.upstream_dependencies || []).length > 0 ? (
                    project.upstream_dependencies.map((u, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-start gap-3 hover:bg-blue-50/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{u.provider_name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({u.provider_id})</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{u.description}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                          u.criticality === 'critical' ? 'bg-red-100 text-red-700' :
                          u.criticality === 'high' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {u.criticality}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">
                      No upstream provider dependencies declared.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* People & Allocations */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="text-sky-600" size={18} />
                  Allocated Staff & Engineering Capacity ({project.allocations?.length || 0} Members)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(project.allocations || []).map((a, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 block">{a.name}</span>
                        <span className="text-[10px] text-slate-500">{a.job_title}</span>
                      </div>
                      <span className="font-mono text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {a.allocation_pct}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">Role: {a.role_on_project}</div>
                    <div className="text-[10px] text-slate-400">{a.email} &bull; {a.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* JIRA DELIVERY & SPRINTS TAB */}
        {activeTab === 'jira' && (
          <div className="space-y-6">
            {/* Jira Banner with Direct Link */}
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded">
                    Key: {project.jira?.project_key}
                  </span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-bold">
                    Atlassian Jira Cloud
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Trello size={20} className="text-blue-400" />
                  {project.jira?.name || `${project.name} Delivery Board`}
                </h3>
                <p className="text-xs text-blue-200/80 mt-1">
                  Connected agile board tracking active sprints, epics, release velocity, and operational blockers.
                </p>
              </div>

              <a 
                href={project.jira?.board_url || `https://autonova.atlassian.net/jira/software/projects/${project.jira?.project_key}/boards/101`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Trello size={15} /> Open Live Jira Board <ExternalLink size={13} />
              </a>
            </div>

            {/* Jira Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tracked Issues</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{project.jira?.total_issues || 0}</span>
                <span className="text-[11px] text-slate-500">Across all sprint cycles</span>
              </div>
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed (Done)</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{project.jira?.done_issues || 0}</span>
                <span className="text-[11px] text-emerald-700 font-medium">Shipped & accepted</span>
              </div>
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">In Progress / Review</span>
                <span className="text-2xl font-bold text-blue-600 mt-1 block">{project.jira?.in_progress_issues || 0}</span>
                <span className="text-[11px] text-blue-700 font-medium">Active development</span>
              </div>
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Critical Blockers</span>
                <span className={`text-2xl font-bold mt-1 block ${project.jira?.blockers_count > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {project.jira?.blockers_count || 0}
                </span>
                <span className="text-[11px] text-slate-500">Highest priority impediments</span>
              </div>
            </div>

            {/* Active Sprint Spotlight */}
            {project.jira?.active_sprint && (
              <div className="card p-5 bg-blue-50/50 border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-900">Current Active Sprint</span>
                    <span className="text-xs font-mono font-bold bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {project.jira.active_sprint.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded">
                    Target Velocity: {project.jira.active_sprint.velocity_points || 42} Points
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  <strong>Sprint Goal:</strong> {project.jira.active_sprint.goal}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                  <span>Start: <strong>{project.jira.active_sprint.start_date ? project.jira.active_sprint.start_date.split('T')[0] : '2026-09-01'}</strong></span>
                  <span>End: <strong>{project.jira.active_sprint.end_date ? project.jira.active_sprint.end_date.split('T')[0] : '2026-09-15'}</strong></span>
                  <span>State: <strong className="uppercase text-emerald-700 font-bold">{project.jira.active_sprint.state}</strong></span>
                </div>
              </div>
            )}

            {/* Sprints & Delivery History */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                Sprint Release Cadence ({project.jira?.sprints?.length || 0} Sprints)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5 font-bold">Sprint Name</th>
                      <th className="p-2.5 font-bold">State</th>
                      <th className="p-2.5 font-bold">Goal</th>
                      <th className="p-2.5 font-bold">Velocity (Points)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(project.jira?.sprints || []).map((sp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{sp.name}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sp.state === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {sp.state}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-md truncate">{sp.goal}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{sp.velocity_points || 38} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jira Issues Table */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckSquare size={16} className="text-blue-600" />
                  Jira Epics, Stories & Bugs ({project.jira?.issues?.length || 0} Issues)
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Click any issue to inspect in Atlassian</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5 font-bold">Key</th>
                      <th className="p-2.5 font-bold">Type</th>
                      <th className="p-2.5 font-bold">Summary</th>
                      <th className="p-2.5 font-bold">Priority</th>
                      <th className="p-2.5 font-bold">Status</th>
                      <th className="p-2.5 font-bold">Story Points</th>
                      <th className="p-2.5 font-bold">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(project.jira?.issues || []).slice(0, 15).map((iss, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-blue-600">
                          <a href={`https://autonova.atlassian.net/browse/${iss.key}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {iss.key}
                          </a>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            iss.issue_type === 'Epic' ? 'bg-purple-100 text-purple-800' :
                            iss.issue_type === 'Bug' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {iss.issue_type}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-800 max-w-sm truncate">{iss.summary}</td>
                        <td className="p-2.5">
                          <span className={`text-[10px] font-bold ${iss.priority === 'Critical' || iss.priority === 'Highest' ? 'text-red-600 font-extrabold' : 'text-slate-600'}`}>
                            {iss.priority}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            iss.status === 'Done' ? 'bg-emerald-100 text-emerald-800' :
                            iss.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {iss.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{iss.story_points || '-'}</td>
                        <td className="p-2.5 font-medium text-slate-700">{iss.assignee_name || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LEANIX ARCHITECTURE & VULNERABILITIES TAB */}
        {activeTab === 'leanix' && (
          <div className="space-y-6">
            {/* LeanIX Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">
                    FactSheet: {project.leanix?.id}
                  </span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-bold">
                    SAP LeanIX Enterprise Architecture
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Layers size={20} className="text-indigo-400" />
                  LeanIX FactSheet & Architecture Baseline
                </h3>
                <p className="text-xs text-indigo-200/80 mt-1">
                  Enterprise portfolio repository tracking architectural fit, compliance gates, IT components, and technical debt vulnerabilities.
                </p>
              </div>

              <a 
                href={project.leanix?.factsheet_url || `https://autonova.leanix.net/autonova/factsheet/Application/${project.leanix?.id}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Layers size={15} /> Open LeanIX FactSheet <ExternalLink size={13} />
              </a>
            </div>

            {/* FactSheet Completion & Quality Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FactSheet Completeness</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-indigo-600">{project.leanix?.data_quality_pct || 94}%</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Verified</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${project.leanix?.data_quality_pct || 94}%` }}></div>
                </div>
              </div>
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technical Fit</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{project.leanix?.technical_fit || 4} / 5</span>
                <span className="text-[11px] text-slate-500">Cloud-native architectural alignment</span>
              </div>
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Functional Fit</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{project.leanix?.functional_fit || 4} / 5</span>
                <span className="text-[11px] text-slate-500">Business capability coverage</span>
              </div>
              <div className="card p-4 bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Annual Run Cost (Opex)</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">€{(project.leanix?.annual_run_cost || 145000).toLocaleString()}</span>
                <span className="text-[11px] text-slate-500">Hosting, licenses & maintenance</span>
              </div>
            </div>

            {/* Compliance & Regulatory Posture */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Compliance & Automotive Regulatory Gates
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">TISAX Level 3 (Automotive)</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Compliant</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">GDPR Data Privacy</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Passed</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">ISO 27001 ISMS</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Certified</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">SOX Financial Audit</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">Exempt</span>
                </div>
              </div>
            </div>

            {/* Vulnerabilities & Technical Debt Alert */}
            {project.leanix?.vulnerabilities && project.leanix.vulnerabilities.length > 0 && (
              <div className="card p-5 bg-red-50/70 border border-red-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600" />
                  <h4 className="font-bold text-sm text-red-950">
                    Detected Vulnerabilities & EOL Technical Debt ({project.leanix.vulnerabilities.length} Findings)
                  </h4>
                </div>
                <div className="space-y-2">
                  {project.leanix.vulnerabilities.map((v, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-red-200 text-xs flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{v.component}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">v{v.version}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{v.description}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase shrink-0">
                        {v.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISUAL ARCHITECTURE BLUEPRINT DIAGRAM */}
            <div className="card p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                      GENERATED CLOUD BLUEPRINT
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                      /architecture/{project.project_id}.svg
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-2 mt-1">
                    <Zap size={18} className="text-sky-600" />
                    Multi-Tier Enterprise Architecture Blueprint
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Live system topology mapped across presentation, edge API gateway, microservices, streaming, persistence, and cloud landing zone.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/architecture/${project.project_id}.svg`}
                    download={`${project.project_id}-architecture-diagram.svg`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download size={14} /> Download Diagram (SVG)
                  </a>
                  <button
                    onClick={() => { setDiagramZoom(1); setIsDiagramModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Maximize2 size={14} /> Expand Fullscreen
                  </button>
                </div>
              </div>

              {/* High-Resolution Diagram Preview */}
              <div 
                onClick={() => { setDiagramZoom(1); setIsDiagramModalOpen(true); }}
                className="relative rounded-xl border border-slate-200 bg-slate-950 overflow-hidden group cursor-pointer hover:border-sky-500 transition-all shadow-inner"
              >
                <img 
                  src={`/architecture/${project.project_id}.svg`} 
                  alt={`${project.name} Architecture Diagram`}
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                  <span className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 text-sky-400 font-bold text-xs rounded-xl border border-sky-400/40 shadow-lg">
                    <Maximize2 size={15} /> Click to Inspect &amp; Zoom High-Res Blueprint
                  </span>
                </div>
              </div>

              {/* Architecture Layers Canvas */}
              <div className="space-y-3 pt-2">
                {/* 1. Presentation Tier */}
                <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                      <LayoutDashboard size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tier 1 &bull; Presentation & Client Layer</span>
                      <span className="font-bold text-xs text-slate-900">{project.architecture?.client_layer || 'React 18 Single-Page Application (Vite)'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">HTTPS / WSS</span>
                </div>

                {/* Flow Connector Arrow */}
                <div className="flex justify-center text-slate-400">
                  <ArrowDownRight size={16} className="text-sky-500 animate-bounce" />
                </div>

                {/* 2. API Gateway & Security */}
                <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Lock size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tier 2 &bull; API Management & Edge Security</span>
                      <span className="font-bold text-xs text-slate-900">{project.architecture?.api_gateway || 'Azure API Management (OAuth2, MTLS, WAF)'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-mono font-medium">Zero Trust / Entra ID</span>
                </div>

                {/* Flow Connector Arrow */}
                <div className="flex justify-center text-slate-400">
                  <ArrowDownRight size={16} className="text-sky-500 animate-bounce" />
                </div>

                {/* 3. Microservices Services Tier */}
                <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tier 3 &bull; Business Services & Microservices Compute</span>
                      <span className="font-bold text-xs text-slate-900">{project.architecture?.services_layer || 'Azure Kubernetes Service (AKS v1.28) / Spring Boot 3'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded font-mono font-medium">gRPC / REST</span>
                </div>

                {/* Flow Connector Arrow */}
                <div className="flex justify-center text-slate-400">
                  <ArrowDownRight size={16} className="text-sky-500 animate-bounce" />
                </div>

                {/* 4. Event Streaming & Persistence Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                        <Activity size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Tier 4 &bull; Event Streaming</span>
                        <span className="font-bold text-xs text-slate-900">{project.architecture?.messaging_layer || 'Apache Kafka / Event Hubs'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Database size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Tier 5 &bull; Data Cloud & Persistence</span>
                        <span className="font-bold text-xs text-slate-900">{project.architecture?.data_layer || 'Azure Database for PostgreSQL Flexible'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Cloud Landing Zone Infrastructure */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs mt-2">
                  <div className="flex items-center gap-2">
                    <Cloud size={16} className="text-sky-600" />
                    <span className="text-slate-500 font-medium">Host Cloud Infrastructure:</span>
                    <strong className="text-slate-900 font-semibold">{project.architecture?.cloud_infra || 'Microsoft Azure Central EU Landing Zone (TISAX AL3)'}</strong>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    Multi-AZ High Availability
                  </span>
                </div>
              </div>
            </div>

            {/* IT Components Table */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Server size={16} className="text-indigo-600" />
                Underlying IT Components & Software Stack ({project.leanix?.components?.length || 0} Components)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <th className="p-2.5 font-bold">Component Name</th>
                      <th className="p-2.5 font-bold">Category</th>
                      <th className="p-2.5 font-bold">Vendor</th>
                      <th className="p-2.5 font-bold">Version</th>
                      <th className="p-2.5 font-bold">Environment</th>
                      <th className="p-2.5 font-bold">EOL Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(project.leanix?.components || []).map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium capitalize">
                            {c.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{c.vendor}</td>
                        <td className="p-2.5 font-mono text-slate-700">{c.version}</td>
                        <td className="p-2.5 font-medium text-slate-700">{c.environment}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">{c.eol || 'Active'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AUTOMOBILE DATA FLOW TAB */}
        {activeTab === 'dataflow' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-2">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Activity className="text-sky-400" size={20} />
                Automobile Data Flow & Event Pipeline
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                In AutoNova Group, projects act as data producers and consumers in a living event pipeline.
                This view traces where raw automotive and master data enters, how it is processed, and which business consumers ingest the output.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Ingested */}
              <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3 border-l-4 border-l-sky-500">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Database size={16} className="text-sky-600" />
                  Data Ingested & Consumed
                </h4>
                <div className="space-y-2.5">
                  {dataFlow.data_ingested.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{item.source_project}</span>
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">{item.data_type}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Produced */}
              <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3 border-l-4 border-l-emerald-500">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Server size={16} className="text-emerald-600" />
                  Data Published & Exported
                </h4>
                <div className="space-y-2.5">
                  {dataFlow.data_produced.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{item.consumer_project}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">{item.data_product}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* READINESS GATES TAB */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <div className="card bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">10 Deterministic Production Readiness Quality Gates</h3>
                  <p className="text-xs text-slate-500">Evaluated deterministically across Architecture, Operations, Security, Governance & Finance</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${readinessColor}`}>
                    {readiness.status.replace(/_/g, ' ')} ({readiness.score}%)
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-1">{readiness.rules_passed}/10 Cleared</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Gate / Rule Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Automated Evidence Tracing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(readiness.rules || []).map((rule, idx) => (
                      <tr key={idx} className={rule.passed ? 'hover:bg-slate-50/60' : 'bg-red-50/40 hover:bg-red-50/60'}>
                        <td className="p-3.5 font-semibold text-slate-900">{rule.name}</td>
                        <td className="p-3.5 text-slate-500 font-medium">{rule.category}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rule.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {rule.severity}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {rule.passed ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 size={14} /> Passed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 font-bold">
                              <ShieldAlert size={14} /> Blocker
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-700 leading-relaxed font-medium">{rule.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CROSS-SOURCE CONFLICTS TAB */}
        {activeTab === 'conflicts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={16} />
                  Detected Cross-Source Architecture & Compliance Conflicts ({conflicts.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated discrepancies caught across siloed enterprise systems</p>
              </div>
            </div>

            {conflicts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conflicts.map((c, i) => (
                  <div key={i} className="card p-5 bg-white border border-amber-200 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                        {c.id || `CONF-0${i+1}`}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.severity} &bull; {c.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-900 font-semibold leading-relaxed">
                      {c.description}
                    </p>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
                      <div className="text-slate-500">
                        <strong className="text-slate-700">How Detected:</strong> {c.detection_method}
                      </div>
                      <div className="text-slate-500">
                        <strong className="text-slate-700">Business Impact:</strong> {c.impact}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex gap-1">
                        {(c.sources || []).map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleProjectChat(`Explain conflict ${c.id}: ${c.description}. What are the remediation steps?`)}
                        className="flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold border border-sky-200"
                      >
                        <Play size={11} /> Investigate in Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Cross-Source Conflicts Detected</h4>
                <p className="text-xs text-slate-500 mt-1">LeanIX, Confluence, SharePoint, GitHub, Jira, Teams & ServiceNow data are in full harmony.</p>
              </div>
            )}
          </div>
        )}

        {/* UNSTRUCTURED KNOWLEDGE TAB */}
        {activeTab === 'unstructured' && (
          <div className="space-y-6">
            {/* Confluence ADRs */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="text-blue-600" size={16} />
                  Confluence Architecture Decision Records (ADRs) ({unstr.adrs?.length || 0})
                </h3>
              </div>
              <div className="space-y-3">
                {(unstr.adrs || []).map((adr, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{adr.title}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">{adr.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                      <div><strong>Context:</strong> {adr.context}</div>
                      <div><strong>Decision:</strong> {adr.decision}</div>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <strong>Consequences:</strong> {adr.consequences} &bull; <strong>Technology:</strong> {adr.chosen_technology}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SharePoint Runbooks & Charters */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Bookmark className="text-teal-600" size={16} />
                  SharePoint Operational Runbooks & Governance Documents ({unstr.documents?.length || 0})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(unstr.documents || []).map((doc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{doc.name}</span>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 font-bold">{doc.doc_type}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-3 leading-relaxed whitespace-pre-line">
                      {doc.content_text ? doc.content_text.slice(0, 220) + '...' : 'Operational documentation approved.'}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Updated: {doc.updated_at ? doc.updated_at.split('T')[0] : '2026-09-15'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ServiceNow Incident History */}
            <div className="card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Shield className="text-red-600" size={16} />
                  ServiceNow ITSM Recent Incidents & Root Cause History ({unstr.incidents?.length || 0})
                </h3>
              </div>
              <div className="space-y-2.5">
                {(unstr.incidents || []).slice(0, 5).map((inc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{inc.id}</span>
                        <span className="font-semibold text-slate-800">{inc.short_description}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <strong>Root Cause:</strong> {inc.root_cause || 'Under investigation'} &bull; <strong>Resolution:</strong> {inc.resolution_notes || 'Patch deployed'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inc.priority === 'P1' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {inc.priority} &bull; {inc.state}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">{inc.opened_at ? inc.opened_at.split('T')[0] : '2026-07-14'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KNOWLEDGE GRAPH TAB (Blank Canvas Bug Fixed!) */}
        {activeTab === 'graph' && (
          <div className="card bg-white border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Project-Centered Data Flow Knowledge Graph</h3>
                <p className="text-xs text-slate-500">
                  Left: Upstream Data Producers &bull; Center: {project.name} &bull; Right: Downstream Data Consumers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentZoom = fgRef.current?.zoom();
                    if (currentZoom) fgRef.current.zoom(currentZoom * 1.3, 300);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={() => {
                    const currentZoom = fgRef.current?.zoom();
                    if (currentZoom) fgRef.current.zoom(currentZoom / 1.3, 300);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <button
                  onClick={() => fgRef.current?.zoomToFit(400, 50)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Center View
                </button>
                <button
                  onClick={() => navigate(`/graph?project=${project.project_id}`)}
                  className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-sky-200"
                >
                  <Layers size={13} /> Full Graph Explorer
                </button>
              </div>
            </div>

            <div 
              className="h-[480px] w-full border border-slate-800 rounded-xl overflow-hidden relative bg-slate-950 shadow-inner" 
              ref={graphContainerRef}
            >
              {graphData && graphData.nodes && graphData.nodes.length > 0 ? (
                <ForceGraph2D
                  ref={fgRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={graphData}
                  cooldownTicks={120}
                  onEngineStop={() => {
                    fgRef.current?.zoomToFit(400, 60);
                  }}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const isCenter = node.is_center;
                    const isProducer = node.flow_role === 'PRODUCER';
                    const isConsumer = node.flow_role === 'CONSUMER';
                    const isPerson = node.flow_role === 'OWNER' || node.flow_role === 'LEAD' || node.type === 'PERSON';
                    const isService = node.flow_role === 'SERVICE' || node.type === 'APPLICATION' || node.type === 'SERVICE';
                    
                    const color = isCenter ? '#38bdf8' : (isProducer ? '#34d399' : (isConsumer ? '#c084fc' : (isPerson ? '#f59e0b' : (isService ? '#06b6d4' : (ENTITY_COLORS[node.type] || '#94a3b8')))));
                    const radius = isCenter ? 18 : (isProducer || isConsumer ? 15 : 13);

                    // Glowing center aura
                    if (isCenter) {
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
                      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
                      ctx.fill();
                    }

                    // Circle core
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                    ctx.fillStyle = isCenter ? '#082f49' : '#0f172a';
                    ctx.fill();
                    ctx.lineWidth = isCenter ? 3.5 : 2.2;
                    ctx.strokeStyle = color;
                    ctx.stroke();

                    // Icon inside circle
                    const icon = getProjectNodeIcon(node);
                    const iconSize = Math.max(10, Math.round(radius * 0.95));
                    ctx.font = `${iconSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(icon, node.x, node.y + 0.5);

                    // Label pill below node
                    const rawLabel = node.name || node.id;
                    const cleanLabel = rawLabel.startsWith(icon) ? rawLabel.slice(icon.length).trim() : rawLabel;
                    const label = `${icon} ${cleanLabel.length > 28 ? cleanLabel.slice(0, 26) + '...' : cleanLabel}`;
                    const fontSize = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
                    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
                    const textWidth = ctx.measureText(label).width;
                    const pillHeight = fontSize + 6;
                    const pillY = node.y + radius + 4;
                    const pillX = node.x - textWidth / 2 - 5;

                    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
                    ctx.beginPath();
                    ctx.roundRect(pillX, pillY, textWidth + 10, pillHeight, 3);
                    ctx.fill();
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = isCenter ? '#38bdf8' : '#e2e8f0';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, node.x, pillY + pillHeight / 2);
                  }}
                  linkColor={() => 'rgba(148, 163, 184, 0.5)'}
                  linkWidth={1.8}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleSpeed={0.006}
                  linkDirectionalParticleColor={() => '#38bdf8'}
                  linkDirectionalArrowLength={5}
                  linkDirectionalArrowRelPos={1}
                  linkLabel={link => link.label}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <Database size={36} className="text-slate-600 mb-2 animate-pulse" />
                  <div className="font-semibold text-sm text-slate-300">Loading Knowledge Graph...</div>
                  <div className="text-xs text-slate-500 max-w-sm mt-1">Connecting cross-system upstream feeds and downstream dependencies for {project.name}.</div>
                </div>
              )}
              
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur text-white p-2.5 rounded-lg border border-slate-700 text-[10px] flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-300 uppercase">Data Flow Legend:</span>
                <div className="flex items-center gap-1.5"><span className="text-emerald-400">📥</span> Producer (Feeds In)</div>
                <div className="flex items-center gap-1.5"><span className="text-sky-400">🎯</span> Target Project</div>
                <div className="flex items-center gap-1.5"><span className="text-purple-400">📤</span> Consumer (Depends On)</div>
                <div className="flex items-center gap-1.5"><span className="text-cyan-400">☁️</span> Cloud Service</div>
                <div className="flex items-center gap-1.5"><span className="text-amber-400">👤</span> Owner / Lead</div>
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE CHAIN TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Documentary Evidence Chain</h3>
            <p className="text-xs text-slate-500">Every assertion is grounded in timestamped enterprise documents across connected repositories</p>
            <div className="space-y-3">
              {evidence.map((ev, idx) => (
                <div key={idx} className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                          {ev.source}
                        </span>
                        <span className="text-[11px] text-slate-400">&bull; {ev.doc_type}</span>
                        <span className="text-[11px] text-slate-400">&bull; Date: {ev.date}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        {Math.round((ev.confidence || 0.95) * 100)}% Confidence
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold mt-1">{ev.authority}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 italic leading-relaxed">
                    "{ev.excerpt}"
                  </div>

                  {ev.url && (
                    <div className="pt-1 flex justify-end">
                      <a href={ev.url} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline text-xs font-bold flex items-center gap-1">
                        View Underlying Document <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Project Chat Assistant Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl z-20">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Header Bar with Status & Controls */}
          {chatHistory.length > 0 && (
            <div className="flex items-center justify-between pb-1 px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-slate-700">
                  AutoNova Assistant &bull; {project.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({chatHistory.length} messages)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition-colors"
                  title={isChatExpanded ? "Collapse View" : "Expand View"}
                >
                  {isChatExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  {isChatExpanded ? "Collapse" : "Expand"}
                </button>
                <button
                  onClick={() => setChatHistory([])}
                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded flex items-center gap-1 transition-colors"
                  title="Clear Chat History"
                >
                  <Trash2 size={11} /> Clear
                </button>
              </div>
            </div>
          )}

          {/* Quick Suggested Prompt Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-sky-500" /> Suggested:
            </span>
            <button
              onClick={() => handleProjectChat(`Provide a comprehensive overview of ${project.name} (${project.project_id}) including status, cost center, and core purpose.`)}
              disabled={chatLoading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors font-medium disabled:opacity-50 shrink-0 text-[11px]"
            >
              📊 Overview &amp; Readiness
            </button>
            <button
              onClick={() => handleProjectChat(`Who are the business owners, tech leads, and key contacts for ${project.name}?`)}
              disabled={chatLoading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors font-medium disabled:opacity-50 shrink-0 text-[11px]"
            >
              👥 Owners &amp; Tech Leads
            </button>
            <button
              onClick={() => handleProjectChat(`What upstream systems feed into ${project.name} and which downstream consumer systems depend on it?`)}
              disabled={chatLoading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors font-medium disabled:opacity-50 shrink-0 text-[11px]"
            >
              🔄 Upstream/Downstream Flow
            </button>
            <button
              onClick={() => handleProjectChat(`What is the step-by-step P1 incident resolution runbook and troubleshooting procedure for ${project.name}?`)}
              disabled={chatLoading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors font-medium disabled:opacity-50 shrink-0 text-[11px]"
            >
              🚨 Incident Runbook
            </button>
          </div>

          {/* Chat Messages Container */}
          {chatHistory.length > 0 && (
            <div className={`${isChatExpanded ? 'max-h-[500px]' : 'max-h-80'} overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs transition-all shadow-inner`}>
              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3.5 rounded-xl transition-all shadow-xs ${
                    msg.role === 'user' 
                      ? 'bg-sky-600 text-white ml-auto max-w-xl' 
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 opacity-80">
                    <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      {msg.role === 'user' ? (
                        <>You ({persona})</>
                      ) : (
                        <><Bot size={13} className="text-sky-600" /> AutoNova Assistant</>
                      )}
                    </span>
                    {msg.intent && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium font-mono">
                        {msg.intent}
                      </span>
                    )}
                  </div>

                  {msg.role === 'user' ? (
                    <div className="text-xs font-medium leading-relaxed">{msg.text}</div>
                  ) : (
                    <div className="text-xs">
                      <MarkdownViewer content={msg.text} />
                    </div>
                  )}

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Citations:</span>
                      {msg.citations.slice(0, 4).map((cit, cIdx) => (
                        <span 
                          key={cIdx} 
                          className="text-[10px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1 font-medium"
                          title={cit.title}
                        >
                          <FileText size={10} className="text-sky-500" />
                          <span className="max-w-[160px] truncate">{cit.title || cit.id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* In-Flight Reasoning Indicator inside chat history */}
              {chatLoading && (
                <div className="p-3.5 rounded-xl bg-white border border-sky-200 shadow-xs text-slate-800 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin shrink-0"></div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-[11px] text-sky-600 uppercase flex items-center gap-1.5">
                      <Sparkles size={12} className="animate-spin text-sky-500" /> Reasoning across Enterprise Systems
                    </div>
                    <div className="text-xs text-slate-500">
                      Synthesizing facts, dependencies, and operational runbooks for {project.name}...
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}

          {/* When no history yet, show loading card if in flight */}
          {chatHistory.length === 0 && chatLoading && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-sky-200 shadow-xs text-slate-800 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin shrink-0"></div>
              <div className="space-y-0.5">
                <div className="font-bold text-[11px] text-sky-600 uppercase flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-spin text-sky-500" /> Reasoning across Enterprise Systems
                </div>
                <div className="text-xs text-slate-500">
                  Synthesizing facts, dependencies, and operational runbooks for {project.name}...
                </div>
              </div>
            </div>
          )}

          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder={`Ask about ${project.name} (${persona} view) — e.g. "Who depends on this?", "Show P1 runbook"...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProjectChat()}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-12 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            <button 
              onClick={() => handleProjectChat()}
              disabled={!chatInput.trim() || chatLoading}
              className="absolute right-2 p-1.5 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-40 transition-colors flex items-center justify-center"
            >
              {chatLoading ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN ARCHITECTURE BLUEPRINT LIGHTBOX MODAL */}
      {isDiagramModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fadeIn">
          {/* Lightbox Toolbar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white mb-3 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-sky-600 text-white px-2 py-0.5 rounded">
                {project.project_id}
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Zap size={15} className="text-sky-400" />
                  {project.name} &bull; Enterprise Architecture Blueprint
                </h3>
                <span className="text-[11px] text-slate-400">
                  Domain: {project.department} &bull; LeanIX FactSheet Verified &bull; High-Resolution Vector Spec
                </span>
              </div>
            </div>

            {/* Zoom & Action Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                <button
                  onClick={() => setDiagramZoom(prev => Math.max(0.5, prev - 0.25))}
                  title="Zoom Out"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="font-mono text-xs px-2.5 text-slate-200 font-bold min-w-[50px] text-center">
                  {Math.round(diagramZoom * 100)}%
                </span>
                <button
                  onClick={() => setDiagramZoom(prev => Math.min(2.5, prev + 0.25))}
                  title="Zoom In"
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setDiagramZoom(1)}
                  title="Reset Zoom"
                  className="text-[10px] font-bold px-2 py-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer border-l border-slate-700 ml-1"
                >
                  Reset
                </button>
              </div>

              <a
                href={`/architecture/${project.project_id}.svg`}
                download={`${project.project_id}-architecture-diagram.svg`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download size={14} /> Download SVG
              </a>

              <button
                onClick={() => setIsDiagramModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 border border-slate-700 transition-colors cursor-pointer ml-1"
                title="Close Fullscreen View (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Zoomable Diagram Canvas */}
          <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-auto flex items-center justify-center p-6 shadow-2xl relative">
            <div 
              style={{ transform: `scale(${diagramZoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={`/architecture/${project.project_id}.svg`}
                alt={`${project.name} Architecture Diagram`}
                className="max-w-[1100px] w-full h-auto object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;

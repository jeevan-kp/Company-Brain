import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Layers, FileText, Database, GitBranch, MessageSquare, Bot, ExternalLink, RefreshCw } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../utils/api';
import { READINESS_COLORS, ENTITY_COLORS } from '../utils/constants';
import { usePersona } from '../hooks/usePersona';
import ConflictCard from '../components/ConflictCard';

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { persona } = usePersona();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 750, height: 480 });
  const graphContainerRef = useRef(null);
  const fgRef = useRef(null);

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

  useEffect(() => {
    if (graphContainerRef.current) {
      setDimensions({
        width: graphContainerRef.current.offsetWidth,
        height: graphContainerRef.current.offsetHeight || 480
      });
    }
  }, [activeTab]);

  const handleProjectChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const q = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);

    try {
      const res = await api.post('/chat', {
        question: q,
        persona,
        project_context: projectId
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
        text: 'Sorry, I encountered an error answering your question for this project.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!project) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading project details...</div>;
  }

  const readiness = project.readiness || { status: 'READY', score: 85, rules: [], failed_rules: [] };
  const conflicts = project.conflicts || [];
  const evidence = project.evidence || [];
  const readinessColor = READINESS_COLORS[readiness.status] || READINESS_COLORS.READY;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Breadcrumb & Actions */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate(`/department/${encodeURIComponent(project.department)}`)} 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-company-teal transition-colors"
        >
          <ArrowLeft size={14} /> Back to {project.department}
        </button>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
          {project.department} &bull; {project.domain}
        </span>
      </div>

      {/* Project Banner */}
      <div className="card p-6 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              {project.project_id}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border ${readinessColor}`}>
              {readiness.status.replace('_', ' ')} ({readiness.score}%)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            {project.business_objective || 'Core enterprise transformation initiative.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Monitoring Owner</span>
            <span className="text-xs font-bold text-slate-700">{project.monitoring_owner || 'Enterprise CoE'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'readiness', label: `Readiness & Conflicts (${conflicts.length})` },
            { id: 'graph', label: 'Knowledge Graph' },
            { id: 'evidence', label: `Evidence (${evidence.length})` },
            { id: 'sources', label: 'Sources & Freshness' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-company-teal text-company-teal' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5 bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Business Value</span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {project.business_value || 'Improves transaction velocity and reduces operational manual bottlenecks.'}
                </p>
              </div>
              <div className="card p-5 bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Architecture Summary</span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Integrates with SAP S/4HANA, Datasphere, and BTP API Gateway with standardized OAuth endpoints.
                </p>
              </div>
              <div className="card p-5 bg-white border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Support & Governance</span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Security Class:</span><span className="font-bold text-slate-800">{project.security_classification || 'Internal'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Support Owner:</span><span className="font-bold text-slate-800">{project.support_owner || 'IT Operations'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Lifecycle Phase:</span><span className="font-bold text-slate-800 capitalize">{project.lifecycle_phase || 'Active'}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* READINESS & CONFLICTS TAB */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            {/* Contradictions / Conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={16} />
                  Detected Cross-Source Conflicts ({conflicts.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {conflicts.map((c, i) => (
                    <ConflictCard key={i} conflict={c} />
                  ))}
                </div>
              </div>
            )}

            {/* 10 Readiness Rules Breakdown Table */}
            <div className="card bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">10 Deterministic Production Readiness Rules</h3>
                  <p className="text-xs text-slate-500">Any critical failure overrides the overall score to NOT READY</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${readinessColor}`}>
                  {readiness.status.replace('_', ' ')} ({readiness.score}%)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Rule Name</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Evidence Tracing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(readiness.rules || []).map((rule, idx) => (
                      <tr key={idx} className={rule.passed ? 'hover:bg-slate-50/60' : 'bg-red-50/30 hover:bg-red-50/50'}>
                        <td className="p-3 font-semibold text-slate-800 capitalize">{rule.name.replace(/_/g, ' ')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rule.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {rule.severity}
                          </span>
                        </td>
                        <td className="p-3">
                          {rule.passed ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 size={14} /> Passed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 font-bold">
                              <ShieldAlert size={14} /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">{rule.evidence || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GRAPH TAB */}
        {activeTab === 'graph' && (
          <div className="card bg-white border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Project Knowledge Graph Subgraph</h3>
                <p className="text-xs text-slate-500">Connected applications, ADRs, documents, and stakeholders for {project.name}</p>
              </div>
              <button
                onClick={() => navigate(`/graph?project=${project.project_id}`)}
                className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-sky-200"
              >
                <Layers size={13} /> Open in Full Graph Explorer
              </button>
            </div>

            <div className="h-[480px] border border-slate-800 rounded-lg overflow-hidden relative bg-slate-950 shadow-inner" ref={graphContainerRef}>
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const color = ENTITY_COLORS[node.type] || '#38bdf8';
                  const baseRadius = node.val ? Math.sqrt(node.val) * 2.8 : 8;
                  const isIssue = node.type === 'ISSUE';

                  if (isIssue) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, baseRadius + 4, 0, 2 * Math.PI, false);
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
                    ctx.fill();
                  }

                  ctx.beginPath();
                  ctx.arc(node.x, node.y, baseRadius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = '#0f172a';
                  ctx.fill();
                  ctx.lineWidth = 2;
                  ctx.strokeStyle = color;
                  ctx.stroke();

                  // Render label
                  const label = node.name || node.id;
                  const fontSize = Math.max(10, Math.min(13, 12 / Math.sqrt(globalScale)));
                  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
                  const textWidth = ctx.measureText(label).width;
                  const pillHeight = fontSize + 6;
                  const pillY = node.y + baseRadius + 4;
                  const pillX = node.x - textWidth / 2 - 4;

                  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                  ctx.beginPath();
                  ctx.roundRect(pillX, pillY, textWidth + 8, pillHeight, 3);
                  ctx.fill();
                  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
                  ctx.stroke();

                  ctx.fillStyle = '#e2e8f0';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(label, node.x, pillY + pillHeight / 2);
                }}
                linkColor={(link) => {
                  if (link.label === 'BLOCKS') return '#ef4444';
                  if (link.label === 'PHASING_OUT') return '#f59e0b';
                  if (link.label === 'APPROVES') return '#10b981';
                  return 'rgba(100, 116, 139, 0.5)';
                }}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleColor={(link) => (link.label === 'BLOCKS' ? '#ef4444' : '#38bdf8')}
                linkDirectionalArrowLength={4.5}
                linkDirectionalArrowRelPos={1}
                linkLabel={link => link.label}
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur text-white p-2.5 rounded-lg border border-slate-700 text-[10px] space-y-1">
                <span className="font-bold block text-slate-300 uppercase tracking-wider text-[9px]">Legend</span>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Project</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Application</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-500"></span> Decision (ADR)</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Document</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Issue (Blocker)</div>
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Verified Evidence Chain</h3>
            <div className="space-y-2.5">
              {evidence.map((ev, idx) => (
                <div key={idx} className="card p-4 bg-white border border-slate-200 shadow-sm flex items-start gap-3.5">
                  <div className="p-2 bg-slate-100 rounded text-slate-700 font-bold text-xs font-mono shrink-0">
                    {ev.source || 'SRC'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-900 font-semibold">{ev.text || ev.statements}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="font-bold text-slate-700 uppercase">{ev.authority} Authority</span>
                      <span>&bull;</span>
                      <span>Confidence: {Math.round((ev.confidence || 1) * 100)}%</span>
                      {ev.url && (
                        <>
                          <span>&bull;</span>
                          <a href={ev.url} target="_blank" rel="noreferrer" className="text-company-teal font-bold hover:underline flex items-center gap-1">
                            Source Link <ExternalLink size={11} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOURCES TAB */}
        {activeTab === 'sources' && (
          <div className="card bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">7 Connected Source Systems for {project.name}</h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { name: 'Jira Cloud', type: 'Real', status: 'Connected', records: 12, freshness: '10 mins ago', binding: 'project_key: ATL' },
                { name: 'Confluence Cloud', type: 'Real', status: 'Connected', records: 5, freshness: '15 mins ago', binding: 'space: ATLAS' },
                { name: 'GitHub', type: 'Real', status: 'Connected', records: 4, freshness: '1 hour ago', binding: 'repo: project-atlas-integration' },
                { name: 'SAP LeanIX', type: 'Mock GraphQL', status: 'Active Sync', records: 8, freshness: '2 hours ago', binding: 'allFactSheets' },
                { name: 'SharePoint Online', type: 'Mock Graph API', status: 'Active Sync', records: 6, freshness: '1 hour ago', binding: 'drive: atlas' },
                { name: 'Microsoft Teams', type: 'Mock Graph API', status: 'Active Sync', records: 14, freshness: '25 mins ago', binding: 'channel: atlas-general' },
                { name: 'ServiceNow', type: 'Mock Table API', status: 'Active Sync', records: 4, freshness: '30 mins ago', binding: 'table: incident/change' }
              ].map((src, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {src.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{src.name}</h4>
                      <p className="text-slate-500 font-mono text-[10px]">{src.binding}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">{src.records} records</span>
                    <span className="text-slate-500">{src.freshness}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 size={13} /> {src.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Project Chat Widget Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3 shadow-lg z-20">
        <div className="max-w-4xl mx-auto space-y-2">
          {chatHistory.length > 0 && (
            <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              {chatHistory.slice(-2).map((msg, i) => (
                <div key={i} className={`p-2 rounded-md ${msg.role === 'user' ? 'bg-company-teal text-white ml-auto max-w-lg' : 'bg-white border border-slate-200 text-slate-800'}`}>
                  <span className="font-bold block text-[10px] uppercase opacity-75 mb-0.5">{msg.role === 'user' ? 'You' : 'Company Brain Assistant'}</span>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder={`Ask Company Brain about ${project.name} (${persona} view)...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProjectChat()}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-12 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-company-teal/20 focus:border-company-teal"
            />
            <button 
              onClick={handleProjectChat}
              disabled={!chatInput.trim() || chatLoading}
              className="absolute right-2 p-1.5 bg-company-teal text-white rounded-md hover:bg-company-teal/90 disabled:opacity-40 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;

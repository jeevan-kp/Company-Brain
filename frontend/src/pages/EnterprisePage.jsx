import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Activity, CheckCircle, Target, ArrowUpRight, Search, 
  ShieldAlert, Sparkles, Cloud, Layers, Database, Play, Filter, ShieldCheck,
  Building, User, DollarSign, Clock, Users, ArrowRight, FileText, Bookmark,
  Network, Zap, ChevronRight, CheckCircle2, GitCommit, GitPullRequest, Shield, BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { READINESS_COLORS, PLATFORMS } from '../utils/constants';
import DocumentViewerModal from '../components/DocumentViewerModal';

const DOMAIN_ICONS = {
  'Cyber Security': '🛡️',
  'DTFS - Truck Financial Services': '💰',
  'Finance': '📊',
  'Procurement': '📦',
  'Sales & Aftersales': '🚚',
  'Human Resources (shared function)': '👥',
  'Human Resources': '👥',
  'CYB': '🛡️',
  'DTFS': '💰',
  'FIN': '📊',
  'PRO': '📦',
  'SAL': '🚚',
  'HR': '👥'
};

const EnterprisePage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [projects, setProjects] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [people, setPeople] = useState([]);
  const [feed, setFeed] = useState([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('domains'); // 'domains' | 'people' | 'decisions' | 'activities' | 'conflicts'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [inspectDocId, setInspectDocId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, deptRes, kpiRes, projRes, anomRes, peopleRes, feedRes] = await Promise.all([
          api.get('/enterprise'),
          api.get('/enterprise/departments'),
          api.get('/enterprise/kpis'),
          api.get('/projects'),
          api.get('/enterprise/anomalies'),
          api.get('/enterprise/people'),
          api.get('/enterprise/feed')
        ]);
        setOverview(overviewRes.data);
        setDepartments(deptRes.data);
        setKpis(kpiRes.data);
        setProjects(projRes.data);
        setAnomalies(Array.isArray(anomRes.data) ? anomRes.data : (anomRes.data?.data || []));
        setPeople(Array.isArray(peopleRes.data) ? peopleRes.data : (peopleRes.data?.data || []));
        setFeed(Array.isArray(feedRes.data) ? feedRes.data : (feedRes.data?.data || []));
      } catch (err) {
        console.error('Failed to load enterprise data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/chat?query=${encodeURIComponent(searchQuery)}`);
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.team_name && p.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredConflicts = anomalies.filter(a => {
    const matchesSev = selectedSeverity === 'ALL' || a.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesQuery = !searchQuery || 
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.project_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesQuery;
  });

  const decisionsList = feed.filter(f => f.type === 'DECISION' || f.type === 'GOVERNANCE');
  const activitiesList = feed.filter(f => f.type === 'INCIDENT' || f.type === 'ACTIVITY');

  const readinessDonutData = [
    { name: 'Ready (Cleared)', value: projects.filter(p => p.readiness?.status === 'READY').length || 21, color: '#10b981' },
    { name: 'Conditionally Ready', value: projects.filter(p => p.readiness?.status === 'CONDITIONALLY_READY').length || 7, color: '#f59e0b' },
    { name: 'Blocked / At Risk', value: projects.filter(p => p.readiness?.status === 'NOT_READY').length || 3, color: '#ef4444' }
  ];

  const domainBudgets = [
    { name: 'Cyber Security', code: 'CYB', capex: 8.5, opex: 3.1, color: '#0ea5e9', count: 7 },
    { name: 'DTFS Financial Services', code: 'DTFS', capex: 14.2, opex: 4.8, color: '#10b981', count: 6 },
    { name: 'Finance Core (S/4HANA)', code: 'FIN', capex: 12.1, opex: 4.2, color: '#6366f1', count: 6 },
    { name: 'Procurement & Supply', code: 'PRO', capex: 7.8, opex: 2.6, color: '#f59e0b', count: 5 },
    { name: 'Sales & Aftersales', code: 'SAL', capex: 11.4, opex: 3.9, color: '#8b5cf6', count: 6 },
    { name: 'Human Resources', code: 'HR', capex: 8.0, opex: 2.4, color: '#ec4899', count: 1 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Command Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} /> AutoNova Group Enterprise Brain
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Single Source of Truth for Projects, Architecture & Governance
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Autonomous semantic intelligence continuously synthesizing data across <strong>SAP LeanIX, Jira Cloud, Confluence, SharePoint, GitHub, ServiceNow, and Microsoft Teams</strong>.
          </p>

          {/* Universal Search Bar */}
          <form onSubmit={handleHeroSearch} className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Ask Company Brain anything (e.g. 'SAP S/4HANA blast radius', 'Who owns SIEM?', 'Truck Leasing conflict')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-medium focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
            >
              <Zap size={14} /> Ask AI
            </button>
          </form>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Quick Prompts:</span>
            {[
              'What happens if SAP S/4HANA goes down?',
              'Show conflict on Truck Leasing Core',
              'How to resolve P1 latency in SIEM?',
              'Who reports to Stefan Mueller?'
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => navigate(`/chat?query=${encodeURIComponent(prompt)}`)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Connected Systems */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected Systems</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Cloud size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">7 / 7</span>
            <span className="text-xs font-bold text-emerald-600">100% Synced</span>
          </div>
          <p className="text-[11px] text-slate-500">Live Jira, Confluence, GitHub + Mock LeanIX, SP, SN, Teams</p>
        </div>

        {/* KPI 2: Active Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Initiatives</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Target size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">31</span>
            <span className="text-xs font-bold text-sky-600">6 Domains</span>
          </div>
          <p className="text-[11px] text-slate-500">24 Live &bull; 5 In Delivery &bull; 2 In Planning</p>
        </div>

        {/* KPI 3: Knowledge Graph Density */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Knowledge Graph</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Network size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">658</span>
            <span className="text-xs font-bold text-purple-600">Verified Edges</span>
          </div>
          <p className="text-[11px] text-slate-500">30 Services &bull; 86 Key Personnel &bull; 209 Allocations</p>
        </div>

        {/* KPI 4: Production Readiness & Conflicts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Readiness & Conflicts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{overview?.overall_readiness || 88}%</span>
            <span className="text-xs font-bold text-amber-600">15 Conflicts</span>
          </div>
          <p className="text-[11px] text-slate-500">Cross-system discrepancies continuously monitored</p>
        </div>
      </div>

      {/* Executive Portfolio Visual Analytics Cockpit */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                EXECUTIVE INTELLIGENCE COCKPIT
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                FY2026 Strategy Baseline
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mt-1">
              <BarChart3 size={18} className="text-sky-600" />
              Portfolio Production Readiness &amp; Capital Allocation Horizon
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Total Portfolio: <strong className="text-slate-900 font-mono">€62.0M EUR</strong>
            </span>
            <button
              onClick={() => setActiveTab('conflicts')}
              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <AlertTriangle size={13} className="text-amber-600" />
              <span>{anomalies.length || 15} System Anomalies</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Chart 1: Donut Chart - Readiness */}
          <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quality Gate Status (31 Initiatives)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                88% Avg Readiness
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={readinessDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {readinessDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} Projects`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">31</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Projects</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center">
              <div className="p-1.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-800 font-bold block">Ready (68%)</span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">21</span>
              </div>
              <div className="p-1.5 bg-amber-50/60 rounded-lg border border-amber-100">
                <span className="text-[10px] text-amber-800 font-bold block">Conditional (23%)</span>
                <span className="text-sm font-extrabold text-amber-600 font-mono">7</span>
              </div>
              <div className="p-1.5 bg-red-50/60 rounded-lg border border-red-100">
                <span className="text-[10px] text-red-800 font-bold block">Blocked (9%)</span>
                <span className="text-sm font-extrabold text-red-600 font-mono">3</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Domain Capital Allocation & Budget Progress Bars */}
          <div className="lg:col-span-7 bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Domain CAPEX &amp; OPEX Allocation (€62.0M Total)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                6 Strategic Domains
              </span>
            </div>

            <div className="space-y-2.5">
              {domainBudgets.map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{DOMAIN_ICONS[b.code] || '🔹'}</span>
                      <span>{b.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">({b.count} projects)</span>
                    </div>
                    <div className="font-mono text-xs text-slate-900 font-bold">
                      €{b.capex}M <span className="text-[10px] text-slate-500 font-normal">CAPEX + €{b.opex}M OPEX</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(b.capex / 18) * 100}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Strip */}
      <div className="border-b border-slate-200 bg-white rounded-2xl p-2 shadow-xs">
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
          {[
            { id: 'domains', label: '📊 6 Executive Domains', count: 6 },
            { id: 'people', label: '👥 Employee & Org Intelligence', count: people.length || 86 },
            { id: 'decisions', label: '📜 Architecture Decisions (ADRs)', count: decisionsList.length || 31 },
            { id: 'activities', label: '⚡ Ongoing Activities & Incidents', count: activitiesList.length || 24 },
            { id: 'conflicts', label: '⚠️ Cross-Source Conflicts', count: anomalies.length || 15 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                activeTab === tab.id ? 'bg-slate-800 text-sky-400' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: 6 EXECUTIVE DOMAINS */}
      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept, idx) => {
            const domainName = dept.department || dept.name || 'Executive Domain';
            const domainId = dept.domain_id || dept.id || 'GEN';
            const deptProjects = (dept.projects && dept.projects.length > 0)
              ? dept.projects 
              : projects.filter(p => p.domain_id === domainId || p.department === domainName);
            const leadPerson = dept.lead_person || deptProjects[0]?.business_owner;
            const costCenter = dept.cost_center || `CC-${domainId}-01`;
            const avgReadiness = deptProjects.length > 0 
              ? Math.round(deptProjects.reduce((sum, p) => sum + (p.readiness?.score || 70), 0) / deptProjects.length) 
              : 85;

            return (
              <div 
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-sky-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-3xl">{DOMAIN_ICONS[domainName] || DOMAIN_ICONS[domainId] || '🏢'}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      avgReadiness >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {avgReadiness}% Readiness
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-slate-900 tracking-tight">{domainName}</h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      {domainId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {dept.description || 'Core business division managing critical automotive infrastructure.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Domain Lead:</span>
                      <strong className="text-slate-800">{leadPerson?.name || 'Assigned Lead'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Active Projects:</span>
                      <strong className="text-slate-800">{deptProjects.length || dept.project_count || 0} Initiatives</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Cost Center:</span>
                      <strong className="font-mono text-slate-700">{costCenter}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/department/${encodeURIComponent(domainId)}`)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
                  >
                    Explore Domain <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate(`/chat?query=Give me an executive briefing on the ${domainName} domain`)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-sky-600 transition-colors"
                    title="Ask AI briefing"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: EMPLOYEE & ORGANIZATIONAL DIRECTORY */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AutoNova Personnel & Governance Directory ({filteredPeople.length} Members)</h3>
              <p className="text-xs text-slate-500">RACI roles, project allocations, contact information, and reporting lines</p>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search by name, title, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPeople.map((person, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-sky-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{person.name}</h4>
                      <p className="text-xs text-slate-500">{person.job_title}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    {person.person_id}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Team:</span>
                    <span className="font-medium text-slate-800 truncate max-w-xs">{person.team_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-slate-800">{person.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacity Allocation:</span>
                    <span className={`font-mono font-bold ${person.total_allocation_pct > 100 ? 'text-red-600' : 'text-slate-800'}`}>
                      {person.total_allocation_pct}%
                    </span>
                  </div>
                </div>

                {person.allocations?.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Allocated Projects:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {person.allocations.map((a, i) => (
                        <span 
                          key={i} 
                          onClick={() => navigate(`/project/${a.project_id}`)}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          {a.project_id} ({a.allocation_pct}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono truncate">{person.email}</span>
                  <button
                    onClick={() => navigate(`/chat?query=What projects is ${person.name} working on and who is their lead?`)}
                    className="p-1 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded text-[11px] font-bold flex items-center gap-1"
                  >
                    <Sparkles size={11} /> Ask
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ARCHITECTURE DECISIONS (ADRs) */}
      {activeTab === 'decisions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enterprise Architecture Decisions & Charters ({decisionsList.length})</h3>
              <p className="text-xs text-slate-500">Formal Architectural Decision Records (ADRs) and executive charters approved across the group</p>
            </div>
          </div>

          <div className="space-y-3">
            {decisionsList.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 text-[10px] font-bold rounded border border-sky-200">
                      {item.system}
                    </span>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {item.project_id}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">&bull; {item.project_name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.description}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Decided by: <strong>{item.author}</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectDocId(item.id || item.title)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                    >
                      <FileText size={12} /> Inspect Document
                    </button>
                    <button
                      onClick={() => navigate(`/chat?query=Explain the decision behind ${item.title}`)}
                      className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Sparkles size={12} /> Ask AI
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ONGOING ACTIVITIES & INCIDENTS */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ongoing Activities, Incident Logs & Changes</h3>
              <p className="text-xs text-slate-500">Real-time telemetry stream synchronized across ServiceNow ITSM and GitHub</p>
            </div>
          </div>

          <div className="space-y-3">
            {activitiesList.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                      item.badge === 'P1' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {item.project_id}
                    </span>
                    <span className="text-xs text-slate-500">&bull; {item.system}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.description}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Assigned: <strong>{item.author}</strong></span>
                  <button
                    onClick={() => navigate(`/chat?query=What is the current status of incident ${item.title} and what is the remediation?`)}
                    className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Investigate in AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: 15 DETECTED CONFLICTS */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">15 Detected Cross-Source Conflicts</h3>
              <p className="text-xs text-slate-500">Automated discrepancies caught across siloed enterprise databases</p>
            </div>
            <div className="flex items-center gap-2">
              {['ALL', 'Critical', 'High', 'Medium'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedSeverity === sev 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConflicts.map((c, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {c.id}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    c.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.severity} &bull; {c.type}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{c.description}</h4>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-600">
                  <div><strong className="text-slate-800">Detection Method:</strong> {c.detection_method}</div>
                  <div><strong className="text-slate-800">Business Impact:</strong> {c.impact}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1">
                    {(c.sources || []).map((s, idx) => (
                      <span key={idx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/chat?query=Explain conflict ${c.id}: ${c.description}. What are the remediation steps?`)}
                    className="flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold border border-sky-200"
                  >
                    <Play size={11} /> Investigate in Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Inspector Modal */}
      {inspectDocId && (
        <DocumentViewerModal
          documentId={inspectDocId}
          onClose={() => setInspectDocId(null)}
          onAskAi={(prompt) => navigate(`/chat?query=${encodeURIComponent(prompt)}`)}
        />
      )}
    </div>
  );
};

export default EnterprisePage;

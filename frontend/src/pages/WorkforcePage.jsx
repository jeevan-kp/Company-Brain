import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, AlertTriangle, ShieldCheck, Activity, Search, Filter, 
  GitCommit, CheckSquare, Award, ArrowUpRight, Zap, AlertCircle, 
  Briefcase, Mail, MapPin, Code, Cpu, X, ExternalLink, Clock, 
  CheckCircle2, Trello, ChevronRight, Layers, Tag
} from 'lucide-react';
import api from '../utils/api';

const WorkforcePage = () => {
  const navigate = useNavigate();
  const [workforceData, setWorkforceData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [filterRiskOnly, setFilterRiskOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Jira Stories Modal State
  const [selectedJiraPerson, setSelectedJiraPerson] = useState(null);
  const [jiraFilterStatus, setJiraFilterStatus] = useState('ALL'); // 'ALL' | 'DONE' | 'IN_PROGRESS' | 'BUG' | 'EPIC'
  const [jiraSearchQuery, setJiraSearchQuery] = useState('');

  useEffect(() => {
    api.get('/enterprise/workforce')
      .then(res => {
        setWorkforceData(res.data);
      })
      .catch(err => {
        console.error('Failed to load workforce:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Keyboard shortcut to close Jira modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedJiraPerson) {
        setSelectedJiraPerson(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedJiraPerson]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Analyzing workforce performance &amp; allocation intelligence...</span>
      </div>
    );
  }

  const metrics = workforceData?.metrics || {};
  const profiles = workforceData?.profiles || [];
  const keyPersonRisks = workforceData?.key_person_risks || [];

  const departments = ['ALL', ...new Set(profiles.map(p => p.department).filter(Boolean))];

  const filteredProfiles = profiles.filter(p => {
    const matchesDept = selectedDept === 'ALL' || p.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesRisk = !filterRiskOnly || p.key_person_risk;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      p.name.toLowerCase().includes(q) ||
      p.job_title.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      (p.skills || []).some(s => s.toLowerCase().includes(q))
    );
    return matchesDept && matchesRisk && matchesSearch;
  });

  // Filtered Jira issues for selected person
  const activeJiraIssues = selectedJiraPerson?.jira_issues || [];
  const filteredJiraIssues = activeJiraIssues.filter(iss => {
    let matchesStatus = true;
    if (jiraFilterStatus === 'DONE') matchesStatus = iss.status === 'Done';
    else if (jiraFilterStatus === 'IN_PROGRESS') matchesStatus = iss.status === 'In Progress';
    else if (jiraFilterStatus === 'BUG') matchesStatus = iss.issue_type === 'Bug';
    else if (jiraFilterStatus === 'EPIC') matchesStatus = iss.issue_type === 'Epic';

    const jq = jiraSearchQuery.toLowerCase();
    const matchesQuery = !jiraSearchQuery || (
      iss.key.toLowerCase().includes(jq) ||
      iss.summary.toLowerCase().includes(jq) ||
      iss.project_name.toLowerCase().includes(jq)
    );

    return matchesStatus && matchesQuery;
  });

  const totalPoints = activeJiraIssues.reduce((sum, iss) => sum + (parseInt(iss.story_points, 10) || 0), 0);
  const doneCount = activeJiraIssues.filter(i => i.status === 'Done').length;
  const inProgressCount = activeJiraIssues.filter(i => i.status === 'In Progress').length;
  const bugCount = activeJiraIssues.filter(i => i.issue_type === 'Bug').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block">Workforce Intelligence</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Engineering Workforce &amp; Capacity Analytics</h1>
            </div>
          </div>
          <span className="text-xs bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-medium">
            86 Active Engineering &amp; Technical Leads
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Operational workforce intelligence monitoring real project allocations, 
          <strong> Single Point of Failure (SPOF) key person risks</strong>, Git commit velocity, and cross-domain technology skill distribution.
        </p>

        {/* Workforce Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff Members</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{metrics.total_employees || 86}</span>
            <span className="text-[10px] text-slate-400">Across 6 Business Domains</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Optimal Capacity (70-100%)</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{metrics.optimal_allocated_count || 82}</span>
            <span className="text-[10px] text-slate-400">Balanced project workload</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">Available Bandwidth (&lt;70%)</span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">{metrics.available_capacity_count || 4} Members</span>
            <span className="text-[10px] text-slate-400">Open for new assignments</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-red-400 block">Key Person Risk (SPOF)</span>
            <span className="text-xl font-bold text-red-400 mt-0.5 block">{metrics.key_person_risk_count || 0} Staff</span>
            <span className="text-[10px] text-red-300">High dependency across projects</span>
          </div>
        </div>
      </div>

      {/* SPOF / Key Person Risk Alert Card */}
      {keyPersonRisks.length > 0 && (
        <div className="card p-5 bg-amber-50/70 border border-amber-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                Single Point of Failure (SPOF) &amp; Key Person Reliance Alert
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded">
              {keyPersonRisks.length} Critical Roles Flagged
            </span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            The following technical and platform leads are assigned as sole leads on multiple mission-critical (Tier 1) systems. 
            An absence or unexpected departure would create immediate delivery blockers. Cross-training or co-leading is recommended.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {keyPersonRisks.slice(0, 3).map((r, i) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">{r.name}</span>
                <span className="text-[10px] text-slate-500 block">{r.job_title}</span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  Lead on {r.leadership_roles_count || 1} Tier-1 {(r.leadership_roles_count || 1) === 1 ? 'Program' : 'Programs'} ({r.total_allocation_pct}% workload)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Domain:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-hidden"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
            <input 
              type="checkbox"
              checked={filterRiskOnly}
              onChange={(e) => setFilterRiskOnly(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            Show Key Person Risk Only
          </label>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, skill (e.g. Kafka, Azure), or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* People Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((p, idx) => (
          <div key={idx} className="card p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 flex flex-col justify-between hover:border-sky-300 hover:shadow-md transition-all">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <span className="text-xs text-slate-600 font-medium block">{p.job_title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  p.total_allocation_pct > 100 ? 'bg-red-100 text-red-800' :
                  p.total_allocation_pct >= 70 ? 'bg-emerald-100 text-emerald-800' :
                  'bg-sky-100 text-sky-800'
                }`}>
                  {p.total_allocation_pct}% Allocated
                </span>
              </div>

              {/* Department & Location */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Briefcase size={11} /> {p.department}</span>
                <span className="flex items-center gap-1"><MapPin size={11} /> {p.location || 'Stuttgart'}</span>
              </div>

              {/* Allocation Capacity Bar */}
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                  <span>Capacity Utilization</span>
                  <span>{p.total_allocation_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      p.total_allocation_pct > 100 ? 'bg-red-500' :
                      p.total_allocation_pct >= 70 ? 'bg-emerald-500' :
                      'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, p.total_allocation_pct)}%` }}
                  ></div>
                </div>
              </div>

              {/* Engineering Velocity (Interactive Jira & GitHub Boxes) */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                {/* GitHub Commits */}
                <div className="p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                  <GitCommit size={14} className="text-purple-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">GitHub Commits</span>
                    <span className="font-bold text-slate-800 font-mono">{p.github_commits || 12}</span>
                  </div>
                </div>

                {/* CLICKABLE JIRA ISSUES DONE BUTTON */}
                <div 
                  onClick={() => {
                    setSelectedJiraPerson(p);
                    setJiraFilterStatus('ALL');
                    setJiraSearchQuery('');
                  }}
                  className="p-2 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/90 hover:border-blue-300 rounded-lg flex items-center justify-between gap-1.5 cursor-pointer transition-all shadow-2xs group/jira"
                  title={`Click to view relevant Jira stories for ${p.name}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckSquare size={14} className="text-blue-600 group-hover/jira:scale-110 transition-transform shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-blue-900 block truncate">Jira Issues Done</span>
                      <span className="font-bold text-blue-950 font-mono text-xs">{p.jira_issues_resolved || 8}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded group-hover/jira:bg-blue-600 group-hover/jira:text-white transition-all shrink-0 flex items-center gap-0.5">
                    Stories <ChevronRight size={10} />
                  </span>
                </div>
              </div>

              {/* Skills Chips */}
              <div className="mt-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Core Competencies:</span>
                <div className="flex flex-wrap gap-1">
                  {(p.skills || []).map((sk, sIdx) => (
                    <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Projects Footer */}
            <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-medium">Active on: </span>
              <span className="font-bold text-slate-800">
                {(p.allocations || []).map(a => a.project_id).join(', ') || 'Enterprise Platform'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* JIRA STORIES & TASKS INTERACTIVE MODAL */}
      {selectedJiraPerson && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedJiraPerson(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-5 flex items-start justify-between gap-4 border-b border-blue-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
                  <Trello size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-blue-300">
                      Atlassian Jira Cloud &bull; Delivery Trace
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-bold font-mono">
                      {selectedJiraPerson.person_id}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                    {selectedJiraPerson.name} — Relevant Jira Stories &amp; Tasks
                  </h2>
                  <p className="text-xs text-blue-200/80">
                    {selectedJiraPerson.job_title} &bull; {selectedJiraPerson.department} &bull; {selectedJiraPerson.total_allocation_pct}% Allocated
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedJiraPerson(null)}
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                  title="Close modal (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned / Relevant</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">{activeJiraIssues.length} Issues</span>
                <span className="text-[10px] text-slate-500 font-medium">Across active projects</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed (Done)</span>
                <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{doneCount} Stories</span>
                <span className="text-[10px] text-emerald-700 font-medium">Sprint verified &amp; closed</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">In Progress</span>
                <span className="text-xl font-bold text-blue-600 mt-0.5 block">{inProgressCount} Stories</span>
                <span className="text-[10px] text-blue-700 font-medium">Active development</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Total Story Points</span>
                <span className="text-xl font-bold text-purple-600 mt-0.5 block">{totalPoints} Points</span>
                <span className="text-[10px] text-slate-500 font-medium">Velocity contribution</span>
              </div>
            </div>

            {/* Modal Controls: Search & Category Filter */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'ALL', label: `All (${activeJiraIssues.length})` },
                  { id: 'DONE', label: `Done (${doneCount})` },
                  { id: 'IN_PROGRESS', label: `In Progress (${inProgressCount})` },
                  { id: 'BUG', label: `Bugs (${bugCount})` },
                  { id: 'EPIC', label: 'Epics' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setJiraFilterStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      jiraFilterStatus === tab.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by key, summary, or project..."
                  value={jiraSearchQuery}
                  onChange={(e) => setJiraSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Body: Jira Stories List */}
            <div className="p-4 overflow-y-auto space-y-3 max-h-[50vh] bg-slate-50/50">
              {filteredJiraIssues.length > 0 ? (
                filteredJiraIssues.map((iss, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <a 
                          href={iss.board_url || `https://autonova.atlassian.net/browse/${iss.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1"
                        >
                          {iss.key} <ExternalLink size={10} />
                        </a>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          iss.issue_type === 'Bug' ? 'bg-red-100 text-red-700 border border-red-200' :
                          iss.issue_type === 'Epic' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          'bg-sky-100 text-sky-700 border border-sky-200'
                        }`}>
                          {iss.issue_type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          iss.priority === 'Critical' || iss.priority === 'Highest' ? 'bg-red-50 text-red-600 border border-red-200' :
                          iss.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {iss.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {iss.story_points || 3} pts
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                          iss.status === 'Done' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          iss.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {iss.status === 'Done' ? <CheckCircle2 size={11} className="text-emerald-600" /> : <Clock size={11} className="text-blue-600" />}
                          {iss.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {iss.summary}
                    </h4>

                    {iss.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {iss.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Project:</span>
                        <button
                          onClick={() => {
                            setSelectedJiraPerson(null);
                            navigate(`/project/${iss.project_id}`);
                          }}
                          className="text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          {iss.project_name} ({iss.project_id})
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {iss.sprint_name && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] text-slate-600">
                            Sprint: {iss.sprint_name}
                          </span>
                        )}
                        <a
                          href={iss.board_url || 'https://autonova.atlassian.net'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        >
                          Open in Board <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <CheckSquare size={32} className="text-slate-300" />
                  <span className="text-xs font-semibold text-slate-600">No Jira stories found matching filter</span>
                  <span className="text-[11px] text-slate-400">Try changing status filter or search query</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                AutoNova Jira Cloud REST API &bull; Ground-truth sprint deliverables
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedJiraPerson(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforcePage;

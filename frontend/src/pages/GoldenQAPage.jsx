import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Sparkles, HelpCircle, 
  Layers, ShieldAlert, Cpu, Server, Network, UserCheck, AlertTriangle, 
  Copy, Check, Lightbulb, BookOpen, Clock, Bot, ExternalLink, ChevronDown, ChevronUp,
  CheckCircle2
} from 'lucide-react';
import api from '../utils/api';

const CATEGORY_ICONS = {
  impact_analysis: '⚡',
  lookup: '🔍',
  cross_domain_people: '👥',
  who_to_contact: '📞',
  dependency_chain: '⛓️',
  approval_and_governance: '📋',
  workload: '📊',
  platform_analytics: '☁️',
  scenario: '🚨',
  architecture_adr: '📐',
  collaboration_decisions: '💬',
  cmdb_ci: '💻',
  initiative_alignment: '🎯',
  anomaly_conflict: '⚠️',
  runbook: '📖',
  budget: '💶',
  security_vulnerability: '🛡️',
  permissions_rbac: '🔐',
  operational_readiness: '🚀',
  incident_sla: '⏱️',
  code_and_repo: '🐙'
};

const CATEGORY_NAMES = {
  impact_analysis: 'Impact Analysis & Outages',
  lookup: 'Entity & Service Lookups',
  cross_domain_people: 'Cross-Domain Staff Allocations',
  who_to_contact: 'Who to Contact & Escalations',
  dependency_chain: 'Dependency Chains (Multi-hop)',
  approval_and_governance: 'Approvals & Governance',
  workload: 'Workload & Capacity',
  platform_analytics: 'Platform Analytics',
  scenario: 'Incident Scenarios',
  architecture_adr: 'Architecture Decisions (ADRs)',
  collaboration_decisions: 'Teams Meeting Decisions',
  cmdb_ci: 'ServiceNow CMDB CIs',
  initiative_alignment: 'Strategic Initiatives',
  anomaly_conflict: 'Anomalies & Conflicts',
  runbook: 'Runbooks & SOPs',
  budget: 'Budget & Cost Centers',
  security_vulnerability: 'Security & CVEs',
  permissions_rbac: 'RBAC & Visibility',
  operational_readiness: 'Operational Readiness',
  incident_sla: 'Incident SLA Analysis',
  code_and_repo: 'GitHub Repos & Workflows'
};

const GoldenQAPage = () => {
  const [qaList, setQaList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Track open prompt insight IDs (can open multiple or one)
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchQA = async () => {
      try {
        setLoading(true);
        const [qaRes, catRes] = await Promise.all([
          api.get('/golden-qa'),
          api.get('/golden-qa/categories')
        ]);
        setQaList(qaRes.data.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Failed to load standard prompts dataset:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQA();
  }, []);

  const handleCopyPrompt = (qaId, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(qaId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleInsight = (qaId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(qaId)) {
        next.delete(qaId);
      } else {
        next.add(qaId);
      }
      return next;
    });
  };

  const filteredList = qaList.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty;
    const matchesRole = selectedRole === 'ALL' || 
      (item.required_role && item.required_role.toLowerCase() === selectedRole.toLowerCase());
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (item.question && item.question.toLowerCase().includes(q)) || 
      (item.golden_answer && item.golden_answer.toLowerCase().includes(q)) || 
      (item.entities_used && item.entities_used.toLowerCase().includes(q)) ||
      (item.qa_id && item.qa_id.toLowerCase().includes(q));
    return matchesCat && matchesDiff && matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700/80 shadow-md text-white">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={16} /> AutoNova Enterprise Intelligence &bull; Standard Prompts Library
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Standard Prompts & Knowledge Insights
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Curated repository of 230 verified standard prompts and architecture query examples across 
            Cyber Security, DTFS, Finance, Procurement, Sales, HR & 5 Cloud Platforms (Azure, AWS, SAP, Snowflake, Databricks).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <span className="text-xl font-bold text-white block">{qaList.length || 230}</span>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Standard Prompts</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search 230 standard prompts, example queries, entities (e.g. SAP S/4HANA, Claudia Lang, P-CYB-01, ADR-003, AKS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Complexity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Complexity:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Complexities</option>
              <option value="easy">Quick Lookup (Direct)</option>
              <option value="medium">Transitive (Joins)</option>
              <option value="hard">Blast Radius (Outage/Multi-hop)</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="Developer">Developer</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Management">Management</option>
              <option value="Architect">Architect</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🌟 All Standard Prompts ({qaList.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat.category
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{CATEGORY_ICONS[cat.category] || '📌'}</span>
            <span>{CATEGORY_NAMES[cat.category] || cat.category}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full ml-1 font-mono font-bold">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Standard Prompt Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-bold bg-white rounded-2xl border border-slate-200">
          Loading 230 verified standard prompts & knowledge insights...
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(item => {
            const isExpanded = expandedIds.has(item.qa_id);
            const isCopied = copiedId === item.qa_id;
            
            const diffLabel = 
              item.difficulty === 'hard' ? 'Advanced Multi-Hop' :
              item.difficulty === 'medium' ? 'Transitive Lineage' :
              'Quick Lookup';

            const diffColor = 
              item.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-200' :
              item.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div 
                key={item.qa_id}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 shadow-2xs transition-all space-y-3"
              >
                {/* Prompt Row: Category Badges, Question Text & Clean Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-cyan-300 px-2 py-1 rounded shrink-0 shadow-2xs border border-slate-800">
                      {item.qa_id}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          {CATEGORY_ICONS[item.category] || '📌'} {CATEGORY_NAMES[item.category] || item.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${diffColor}`}>
                          {diffLabel}
                        </span>
                        {item.required_role && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Role: {item.required_role}
                          </span>
                        )}
                      </div>

                      {/* Prompt Question */}
                      <h3 className="font-bold text-sm text-slate-900 leading-snug tracking-tight">
                        &ldquo;{item.question}&rdquo;
                      </h3>
                    </div>
                  </div>

                  {/* Clean Non-Redundant Action Toolbar: Copy Prompt & View Prompt Insight */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* 1. Copy Prompt Button */}
                    <button
                      onClick={(e) => handleCopyPrompt(item.qa_id, item.question, e)}
                      title="Copy prompt text to clipboard"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="text-slate-500" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>

                    {/* 2. View Prompt Insight Button (Instant, Verified, Zero-Crash) */}
                    <button
                      onClick={() => toggleInsight(item.qa_id)}
                      title="View verified enterprise answer and reasoning insight"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      <Lightbulb size={13} className={isExpanded ? 'text-amber-300' : 'text-indigo-600'} />
                      <span>{isExpanded ? 'Hide Insight' : 'Prompt Insight'}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Instant Prompt Insight Drawer (Pre-Verified Ground-Truth Answer with 0ms Latency) */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                    {/* Verified Company Brain Answer */}
                    <div className="bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-sky-50/30 border border-emerald-200/90 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Verified Company Brain Answer:
                      </div>
                      <p className="text-xs text-slate-900 leading-relaxed font-medium">
                        {item.golden_answer}
                      </p>
                    </div>

                    {/* Context Grid: Reasoning Path & Entities Referenced */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      {/* Traversal Path */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Knowledge Graph Traversal:
                        </span>
                        <p className="font-mono text-[11px] text-slate-700">
                          {item.reasoning_path || 'Direct Entity Lookup'}
                        </p>
                      </div>

                      {/* Entities Used */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Referenced Systems & Entities:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(item.entities_used || '').split(';').map((ent, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-700 font-medium">
                              {ent.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Evidence Source Origin */}
                    {item.evidence_source_items && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <span className="font-bold text-slate-400">Ground-Truth Evidence Source:</span>
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                          {item.evidence_source_items}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoldenQAPage;

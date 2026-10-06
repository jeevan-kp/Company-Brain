import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Search, Filter, Sparkles, ArrowRight, HelpCircle, 
  Layers, ShieldAlert, Cpu, Server, Network, UserCheck, AlertTriangle, Play 
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
  scenario: '🚨'
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
  scenario: 'Incident Scenarios'
};

const GoldenQAPage = () => {
  const navigate = useNavigate();
  const [qaList, setQaList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
        console.error('Failed to load golden Q&A dataset:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQA();
  }, []);

  const filteredList = qaList.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      item.question.toLowerCase().includes(q) || 
      item.golden_answer.toLowerCase().includes(q) || 
      item.entities_used.toLowerCase().includes(q) ||
      item.qa_id.toLowerCase().includes(q);
    return matchesCat && matchesDiff && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={16} /> AutoNova Group Benchmark Suite
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">145 Golden Q&A Benchmarks</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified ground-truth queries across Cyber Security, DTFS, Finance, Procurement, Sales, HR & 5 Cloud Platforms
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-xl font-bold text-slate-900 block">{qaList.length}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Questions</span>
          </div>
          <div className="px-4 py-2 bg-sky-50 border border-sky-100 rounded-xl text-center">
            <span className="text-xl font-bold text-sky-700 block">100%</span>
            <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Reasoning Grounding</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search 145 questions, entities (e.g. SAP RISE, Anna Weber, AKS, SIEM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500">Difficulty:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-0 cursor-pointer"
          >
            <option value="ALL">All Difficulties</option>
            <option value="easy">Easy (Lookups)</option>
            <option value="medium">Medium (Transitive)</option>
            <option value="hard">Hard (Multi-hop Blast Radius)</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🌟 All Categories ({qaList.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === cat.category
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{CATEGORY_ICONS[cat.category] || '📌'}</span>
            <span>{CATEGORY_NAMES[cat.category] || cat.category}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full ml-1">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Question Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-bold">Loading golden questions...</div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(item => {
            const isExpanded = expandedId === item.qa_id;
            const diffColor = 
              item.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-200' :
              item.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div 
                key={item.qa_id}
                className="card bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-5 shadow-sm transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded">
                      {item.qa_id}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          {CATEGORY_ICONS[item.category]} {CATEGORY_NAMES[item.category] || item.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${diffColor}`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.question}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/chat?query=${encodeURIComponent(item.question)}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                    >
                      <Play size={12} /> Test in AI Chat
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.qa_id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      {isExpanded ? 'Hide Answer' : 'Show Ground Truth'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1.5">
                        <CheckCircle2 size={14} /> Verified Golden Answer
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">{item.golden_answer}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Reasoning Path Traversal
                        </span>
                        <p className="font-mono text-[11px] text-slate-700">{item.reasoning_path}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Entities & Services Used
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(item.entities_used || '').split(';').map((ent, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                              {ent.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, Search, Filter, ShieldCheck, Download, 
  ExternalLink, Sparkles, MessageSquare, Clock, User, CheckCircle, 
  FileText, HelpCircle, ArrowRight, X, ChevronRight, Layers, Tag
} from 'lucide-react';
import api from '../utils/api';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [onboardingData, setOnboardingData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enterprise/onboarding')
      .then(res => {
        setOnboardingData(res.data);
      })
      .catch(err => {
        console.error('Failed to load onboarding policies:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Loading AutoNova Employee Onboarding Wiki & 30 Policies...</span>
      </div>
    );
  }

  const documents = onboardingData?.documents || [];
  const categories = ['ALL', ...new Set(documents.map(d => d.category))];

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      doc.title.toLowerCase().includes(q) ||
      doc.id.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      (doc.tags && doc.tags.some(t => t.toLowerCase().includes(q))) ||
      doc.owner.toLowerCase().includes(q)
    );
    return matchesCategory && matchesSearch;
  });

  const handleAskAi = (question) => {
    navigate(`/chat?query=${encodeURIComponent(question)}`, { state: { query: question } });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">AutoNova Group</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  30 Attested Policies &bull; 2026 Edition
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Employee Onboarding Hub &amp; Company Wiki</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAskAi('What is our hybrid 3:2 work from home policy and core hours?')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Sparkles size={14} /> Ask AI About Policies
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Comprehensive onboarding manual and policy registry for new joiners and existing AutoNova staff.
          Review official directives on hybrid working, vacation leave, monthly payroll cut-offs, benefits, IT hardware, and compliance standards.
        </p>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Policy Documents</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{documents.length} Published Directives</span>
            <span className="text-[10px] text-emerald-400">100% Attested &amp; Verified</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">Working Model</span>
            <span className="text-xl font-bold text-indigo-400 mt-0.5 block">3:2 Hybrid Model</span>
            <span className="text-[10px] text-slate-400">Core hours 10:00 - 15:00 CET</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-teal-400 block">Annual Vacation</span>
            <span className="text-xl font-bold text-teal-400 mt-0.5 block">30 Working Days</span>
            <span className="text-[10px] text-slate-400">+ 5 carryover days until Mar 31</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Payroll Disbursement</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">25th of Each Month</span>
            <span className="text-[10px] text-slate-400">Expense cut-off: 18th at 18:00</span>
          </div>
        </div>
      </div>

      {/* Quick AI Question Prompts */}
      <div className="card p-4 bg-white border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-600" />
            Popular Onboarding Questions (Answered Instantly by Company Brain AI):
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Click to ask AI</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(onboardingData?.prompt_chips || []).map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAi(chip)}
              className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-all text-left flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle size={13} className="text-indigo-500 shrink-0" />
              <span>{chip}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Corporate Portals Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <a 
          href="https://workday.autonova.internal" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">Workday HR</span>
            <span className="text-[10px] text-slate-500">Vacation, Time Off &amp; Profile</span>
          </div>
          <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600" />
        </a>

        <a 
          href="https://payroll.autonova.internal" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">Payroll Portal</span>
            <span className="text-[10px] text-slate-500">Monthly Payslips &amp; Tax Forms</span>
          </div>
          <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600" />
        </a>

        <a 
          href="https://travel.autonova.internal" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">Navan Expenses</span>
            <span className="text-[10px] text-slate-500">Business Travel &amp; Per Diem</span>
          </div>
          <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600" />
        </a>

        <a 
          href="https://itsm.autonova.internal" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">ServiceNow IT</span>
            <span className="text-[10px] text-slate-500">MacBook / ThinkPad Hardware</span>
          </div>
          <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600" />
        </a>

        <a 
          href="https://integrity.autonova.internal" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl shadow-xs transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">Ethics Ombudsman</span>
            <span className="text-[10px] text-slate-500">Anonymous Whistleblower</span>
          </div>
          <ExternalLink size={13} className="text-slate-400 group-hover:text-indigo-600" />
        </a>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search all 30 policy documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Policy Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <div 
            key={doc.id}
            className="card p-5 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all rounded-xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {doc.id}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {doc.category}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 leading-snug hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                {doc.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {doc.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {(doc.tags || []).slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 truncate max-w-[170px]" title={doc.owner}>
                  <User size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{doc.owner}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Clock size={11} className="text-slate-400" />
                  {doc.effective_date}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <BookOpen size={13} /> Read Directive
                </button>
                <button
                  onClick={() => handleAskAi(`Regarding ${doc.title}: ${doc.summary}`)}
                  title="Ask AI query regarding this document"
                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Sparkles size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <BookOpen size={32} className="text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700">No policy documents match your criteria</h4>
          <p className="text-xs text-slate-500">Try adjusting your category filter or search keywords.</p>
        </div>
      )}

      {/* FULL DOCUMENT READER MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">
                    {selectedDoc.id}
                  </span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-bold">
                    {selectedDoc.category}
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Effective: {selectedDoc.effective_date}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedDoc.title}</h3>
                <span className="text-xs text-slate-300 block mt-0.5">Governance Owner: {selectedDoc.owner}</span>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Markdown Text */}
            <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm leading-relaxed space-y-4">
              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                <CheckCircle size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-indigo-900 block">Executive Summary</span>
                  <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">{selectedDoc.summary}</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700">
                {selectedDoc.content_text.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('# ')) {
                    return <h2 key={idx} className="text-lg font-bold text-slate-900 mt-3 mb-1 border-b pb-1">{paragraph.replace('# ', '')}</h2>;
                  }
                  if (paragraph.startsWith('## ')) {
                    return <h3 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-1 text-indigo-900">{paragraph.replace('## ', '')}</h3>;
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1 my-2">
                        {paragraph.split('\n').map((item, itemIdx) => (
                          <li key={itemIdx}>{item.replace('- ', '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={idx} className="my-2 leading-relaxed">{paragraph}</p>;
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                AutoNova Group Legal &bull; Verified Directive
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAskAi(`Regarding ${selectedDoc.title}: ${selectedDoc.summary}`)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} /> Ask AI About This Directive
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;

import React, { useState, useEffect } from 'react';
import { 
  Cpu, Server, Database, Cloud, Lock, Sparkles, Send, 
  CheckCircle2, AlertTriangle, Layers, BookOpen, ExternalLink, Zap
} from 'lucide-react';
import api from '../utils/api';
import MarkdownViewer from '../components/MarkdownViewer';

const GUIDED_ARCH_PROMPTS = [
  'Design an event-driven EV battery health and predictive maintenance pipeline with sub-second CAN-bus ingestion and TISAX compliance.',
  'Architect a dealer financial leasing self-service portal integrating with SAP S/4HANA General Ledger and PostgreSQL Flexible.',
  'How should we build a cross-domain security audit logging collector aggregating Azure Sentinel and SAP audit trails?'
];

const ArchitecturePage = () => {
  const [techStack, setTechStack] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enterprise/tech-stack')
      .then(res => {
        setTechStack(res.data);
      })
      .catch(err => {
        console.error('Failed to load tech stack:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRecommend = async (customPrompt = null) => {
    const q = customPrompt || prompt;
    if (!q || !q.trim() || aiLoading) return;

    setAiLoading(true);
    setAiRecommendation(null);

    try {
      const res = await api.post('/enterprise/recommend-solution', {
        requirement: q,
        domain: 'Automotive Digital Services'
      });
      setAiRecommendation(res.data);
    } catch (err) {
      console.error('Failed to get recommendation:', err);
      setAiRecommendation({
        recommendation: 'An error occurred connecting to the Enterprise Architecture Board AI. Please try again.',
        baseline_patterns: []
      });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Scanning enterprise technology stack and architecture baseline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-7 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Cpu size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">Enterprise Architecture Board</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Technology Stack Observatory & AI Recommender</h1>
            </div>
          </div>
          <span className="text-xs bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-medium">
            Standardization Baseline 2026
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Comprehensive inventory of approved runtime frameworks, cloud platforms, persistence layers, and security standards. 
          Use the <strong>AI Solution Recommender</strong> to synthesize approved architectural blueprints grounded in AutoNova's existing ADRs.
        </p>
      </div>

      {/* AI ARCHITECTURAL RECOMMENDER SECTION */}
      <div className="p-6 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-purple-950 text-white rounded-2xl shadow-lg border border-purple-800/40 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h2 className="text-base font-bold text-white">
              AI Solution Architect Recommender
            </h2>
          </div>
          <span className="text-xs font-mono bg-purple-900/60 text-purple-200 border border-purple-700/60 px-2.5 py-1 rounded-md">
            Grounded in AutoNova ADRs & Living Systems
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Describe a new business or technical requirement. The AI will synthesize an optimal architecture blueprint, recommend approved runtimes, and highlight existing internal projects to reuse.
        </p>

        {/* Guided Prompt Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Guided Example Scenarios:</span>
          <div className="flex flex-wrap gap-2">
            {GUIDED_ARCH_PROMPTS.map((gp, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(gp);
                  handleRecommend(gp);
                }}
                disabled={aiLoading}
                className="text-left text-xs bg-slate-800/80 hover:bg-purple-900/80 border border-slate-700 hover:border-purple-400 text-slate-200 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                &bull; {gp.slice(0, 75)}...
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative pt-2">
          <textarea
            rows={2}
            placeholder="E.g. We need a high-volume payment processing service that integrates with SAP S/4HANA and requires TISAX Level 3 compliance..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950/80 border border-purple-700/60 rounded-xl p-3.5 pr-14 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <button
            onClick={() => handleRecommend()}
            disabled={!prompt.trim() || aiLoading}
            className="absolute right-3.5 bottom-3.5 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-40 transition-colors shadow-md"
            title="Generate Architectural Recommendation"
          >
            <Send size={15} />
          </button>
        </div>

        {/* AI Loading Indicator */}
        {aiLoading && (
          <div className="p-4 bg-slate-800/80 rounded-xl border border-purple-700/60 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span className="text-xs text-purple-200 font-medium">
              Consulting Enterprise Architecture Board, analyzing approved ADRs, and synthesizing blueprint...
            </span>
          </div>
        )}

        {/* AI Result Card */}
        {aiRecommendation && (
          <div className="p-5 bg-white text-slate-900 rounded-xl shadow-md border border-slate-200 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Verified Architectural Recommendation
              </span>
              <span className="text-[11px] font-mono text-slate-500">AutoNova Standards Compliant</span>
            </div>

            <div className="text-xs leading-relaxed">
              <MarkdownViewer content={aiRecommendation.recommendation} />
            </div>

            {aiRecommendation.baseline_patterns?.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-purple-900 block text-[11px]">Referenced Approved Architecture Baselines:</span>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                  {aiRecommendation.baseline_patterns.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TECH OBSERVATORY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Cloud & Container Platforms */}
        <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Cloud size={17} className="text-sky-600" />
            Approved Cloud Hosting & Landing Zones
          </h3>
          <div className="space-y-2.5">
            {(techStack?.platforms || []).map((pl, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{pl.name}</span>
                  <span className="text-[10px] text-slate-500">{pl.approved_tier}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">{pl.projects_count} Projects</span>
                  <span className={`text-[10px] font-bold ${pl.status.includes('Legacy') ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {pl.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Runtimes & Frameworks */}
        <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Server size={17} className="text-purple-600" />
            Application Runtimes & Microservices Stacks
          </h3>
          <div className="space-y-2.5">
            {(techStack?.runtimes || []).map((rt, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rt.name}</span>
                    {!rt.standard && (
                      <span className="px-1.5 py-0.2 bg-red-100 text-red-700 font-bold rounded text-[9px]">DEPRECATED</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{rt.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{rt.adoption_count} Projects</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Databases & Persistence */}
        <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Database size={17} className="text-teal-600" />
            Enterprise Persistence & Database Engines
          </h3>
          <div className="space-y-2.5">
            {(techStack?.databases || []).map((db, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{db.name}</span>
                  <span className="text-[10px] text-slate-500">{db.category}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{db.adoption_count} Projects</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Security & Automotive Governance */}
        <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Lock size={17} className="text-indigo-600" />
            Identity, Secrets & Automotive Security
          </h3>
          <div className="space-y-2.5">
            {(techStack?.security || []).map((sec, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{sec.name}</span>
                  <span className="text-[10px] text-slate-500">{sec.category}</span>
                </div>
                <span className="font-mono font-bold text-emerald-600">{sec.adoption_count} Enforced</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePage;

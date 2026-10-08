import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, Bot, User, FileText, ChevronRight, Sparkles, AlertTriangle, 
  ExternalLink, ShieldCheck, CheckCircle, Clock, ShieldAlert, Cpu, 
  Zap, BookOpen, Layers, Info, Network, RotateCcw, Share2, Compass,
  Copy, Check, Activity, DollarSign
} from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import api from '../utils/api';
import MarkdownViewer from '../components/MarkdownViewer';
import DocumentViewerModal from '../components/DocumentViewerModal';
import QueryGraphViewer from '../components/QueryGraphViewer';

const GUIDED_DEMOS = [
  {
    icon: '⚡',
    label: 'Outage Blast Radius (SAP)',
    query: 'What is the downstream business impact and blast radius if SAP S/4HANA goes down?'
  },
  {
    icon: '📖',
    label: 'Incident Resolution Runbook (SIEM)',
    query: 'How do I resolve a P1 telemetry queue latency alert in Security Log Monitoring (SIEM)?'
  },
  {
    icon: '⚠️',
    label: 'LeanIX vs Jira Conflict (DTFS)',
    query: 'Show the cross-source conflict between LeanIX and Jira for Truck Leasing Core (P-DTFS-01).'
  }
];

const DEFAULT_WELCOME = [
  { 
    role: 'ai', 
    text: `# Welcome to AutoNova "Company Brain" AI Assistant\n\nI am your unified enterprise intelligence engine, reasoning across **7 connected enterprise systems** (SAP LeanIX, Jira Cloud, Confluence, SharePoint, GitHub, ServiceNow, and Microsoft Teams).\n\n### What You Can Ask Me:\n* **Outage Impact & Blast Radius:** Trace multi-hop dependencies and affected consumer systems\n* **Operational Runbooks & SOPs:** Extract exact step-by-step incident resolution procedures\n* **Cross-Source Architecture Conflicts:** Detect discrepancies across siloed databases\n* **People & Governance:** Discover business owners, tech leads, RACI matrices, and cost centers\n\nClick any **Quick Scenario** above or type your question below:`, 
    intent: 'greeting',
    activeView: 'answer'
  }
];

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { persona } = usePersona();
  const [messages, setMessages] = useState(DEFAULT_WELCOME);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  // Document Inspector Modal State
  const [inspectDocId, setInspectDocId] = useState(null);
  const [inspectDocData, setInspectDocData] = useState(null);

  const messagesEndRef = useRef(null);
  const lastExecutedQueryRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('query') || params.get('q') || location.state?.query;
    if (queryParam && queryParam !== lastExecutedQueryRef.current) {
      lastExecutedQueryRef.current = queryParam;
      setInput(queryParam);
      handleSend(queryParam);
    }
  }, [location.search, location.state]);

  const handleSend = async (text) => {
    const q = text || input;
    if (!q || !q.trim() || loading) return;
    
    const userMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        query: q,
        role: persona
      }, {
        headers: { 'x-user-role': persona }
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        text: res.data.answer,
        citations: res.data.citations || [],
        query_graph: res.data.query_graph || null,
        intent: res.data.intent,
        evidence: res.data.evidence,
        timings: res.data.timings,
        activeView: 'answer' // 'answer' | 'graph'
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'An error occurred while analyzing the knowledge graph. Please verify your connection to the Company Brain API.',
        activeView: 'answer'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages(DEFAULT_WELCOME);
    setInput('');
    lastExecutedQueryRef.current = null;
  };

  const handleCopyText = (index, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleView = (msgIndex, view) => {
    setMessages(prev => prev.map((msg, idx) => {
      if (idx === msgIndex) {
        return { ...msg, activeView: view };
      }
      return msg;
    }));
  };

  const openDocumentInspector = (docOrId) => {
    if (typeof docOrId === 'object' && docOrId !== null) {
      setInspectDocData(docOrId);
      setInspectDocId(docOrId.id || docOrId.title);
    } else {
      setInspectDocData(null);
      setInspectDocId(docOrId);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden font-sans select-text">
      {/* 1. Sleek Compact Top Bar (No Wasted Space) */}
      <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between bg-white shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-lg shadow-2xs">
            <Sparkles size={15} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
              AutoNova Company Brain Assistant
            </h2>
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
              Connected Intelligence
            </span>
            <span className="hidden md:inline-flex text-[10px] text-slate-400 font-mono">
              7 Tools Connected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button 
            onClick={handleClearChat}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw size={12} /> <span className="hidden sm:inline">New Chat</span>
          </button>
          
          <button 
            onClick={() => navigate('/graph')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <Network size={12} className="text-sky-600" /> <span className="hidden sm:inline">Graph Explorer</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600">
            <span className="text-slate-400">Role:</span>
            <span className="font-bold text-slate-900">{persona}</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Single-Line Quick Prompt Chips Bar (Replaces Huge 160px Banner) */}
      <div className="py-2 px-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 shrink-0 tracking-wider">
          <Zap size={11} className="text-amber-500" /> Quick Prompts:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {GUIDED_DEMOS.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(demo.query)}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs group disabled:opacity-50"
            >
              <span>{demo.icon}</span>
              <span>{demo.label}</span>
            </button>
          ))}
          <button
            onClick={() => navigate('/prompts')}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
          >
            <BookOpen size={11} /> 230 Standard Prompts &bull;
          </button>
        </div>
      </div>

      {/* 3. Messages Scroll Area (Maximized Width & Natural Height) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 bg-slate-50/50">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-4">
              <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-2xs border border-slate-800">
                    CB
                  </div>
                )}
                
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-3xl w-full`}>
                  <div className={`w-full p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-sky-600 text-white rounded-br-xs shadow-xs max-w-xl font-medium' 
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}>
                    {/* AI Metadata & View Switcher Strip */}
                    {msg.intent && msg.role === 'ai' && msg.intent !== 'greeting' && (
                      <div className="mb-2.5 flex items-center justify-between flex-wrap pb-2 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded">
                          Intent: {msg.intent.replace(/_/g, ' ')}
                        </span>
                        {msg.timings?.total_duration && (
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {msg.timings.total_duration}ms
                          </span>
                        )}
                      </div>

                      {/* View Switcher: Answer vs Knowledge Graph */}
                      {msg.query_graph && msg.query_graph.nodes?.length > 0 && (
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => toggleView(idx, 'answer')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              msg.activeView === 'answer' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            💬 Answer
                          </button>
                          <button
                            onClick={() => toggleView(idx, 'graph')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              msg.activeView === 'graph' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Network size={11} /> Query Graph ({msg.query_graph.nodes.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Content Body */}
                  {msg.role === 'user' ? (
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {msg.activeView === 'graph' && msg.query_graph ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                            <span className="font-semibold text-slate-700">Dynamic Knowledge Subgraph for this Query</span>
                            <span className="text-[11px]">Click any node to inspect details</span>
                          </div>
                          <QueryGraphViewer 
                            graphData={msg.query_graph} 
                            onNodeClick={(node) => {
                              if (node.id?.startsWith('P-')) {
                                navigate(`/project/${node.id}`);
                              } else {
                                openDocumentInspector(node.id);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <MarkdownViewer 
                          content={msg.text} 
                          onCitationClick={(citation) => openDocumentInspector(citation)}
                        />
                      )}

                      {/* Evidence Citations Chips */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Verified Ground-Truth Sources ({msg.citations.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => openDocumentInspector(c)}
                                className="px-2 py-1 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-md text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              >
                                <FileText size={10} className="text-sky-600" />
                                <span className="truncate max-w-[180px]">{c.title || c.id || c.source}</span>
                                <ExternalLink size={9} className="text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Toolbar on AI Answer */}
                      {msg.role === 'ai' && msg.intent !== 'greeting' && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <button
                            onClick={() => handleCopyText(idx, msg.text)}
                            className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check size={12} className="text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Answer Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => navigate('/graph')}
                            className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold transition-colors cursor-pointer"
                          >
                            <Network size={12} />
                            <span>View Full Enterprise Graph</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-2xs">
                  <User size={14} />
                </div>
              )}
            </div>
          </div>
          ))}

          {/* Quick Starter Question Cards Grid */}
          {messages.length === 1 && messages[0].intent === 'greeting' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSend("What is the blast radius if Azure AKS West Europe goes down?")}
                className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition-all group shadow-xs cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
                  <Activity size={16} className="text-sky-600 group-hover:scale-110 transition-transform" />
                  <span>Outage Blast Radius Analysis</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  "What is the blast radius if Azure AKS West Europe goes down?"
                </p>
                <span className="text-[10px] text-sky-600 font-bold flex items-center gap-1 pt-1">
                  Run Query &bull; Trace Dependencies &rarr;
                </span>
              </button>

              <button
                onClick={() => handleSend("Identify discrepancies and conflicts between SAP LeanIX and Jira")}
                className="p-4 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-2xl text-left transition-all group shadow-xs cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                  <AlertTriangle size={16} className="text-amber-600 group-hover:scale-110 transition-transform" />
                  <span>Cross-Source Conflict Audit</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  "Identify discrepancies and conflicts between SAP LeanIX and Jira"
                </p>
                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 pt-1">
                  Audit Lifecycle Drift &rarr;
                </span>
              </button>

              <button
                onClick={() => handleSend("What is the capex and opex budget across all 6 business domains?")}
                className="p-4 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition-all group shadow-xs cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <DollarSign size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span>Cloud Capex &amp; Investment</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  "What is the capex and opex budget across all 6 business domains?"
                </p>
                <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 pt-1">
                  Inspect Capital Allocation &rarr;
                </span>
              </button>

              <button
                onClick={() => handleSend("Show emergency SOP runbook for SIEM log ingestion outage (P-CYB-01)")}
                className="p-4 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition-all group shadow-xs cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <ShieldCheck size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>P1 Incident SOP &amp; Runbook</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  "Show emergency SOP runbook for SIEM log ingestion outage (P-CYB-01)"
                </p>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                  Retrieve Operational Procedures &rarr;
                </span>
              </button>
            </div>
          )}

          {loading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-cyan-300 flex items-center justify-center shrink-0 font-bold text-xs border border-slate-800">
                CB
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-2.5 shadow-2xs">
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                <span className="text-xs text-slate-600 font-medium pl-1">
                  Reconciling knowledge graph and generating evidence-backed answer...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 4. Maximized Bottom Input Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 shadow-xs">
        <div className="max-w-4xl mx-auto w-full">
          <div className="relative flex items-center">
            <input 
              type="text"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium placeholder:text-slate-400 shadow-inner"
              placeholder={`Ask Company Brain as ${persona} (e.g. "What happens if SAP S/4HANA goes down?", "Show conflict on Truck Leasing")...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            />
            <button 
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              <Send size={14} />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>Press <strong>Enter</strong> to send &bull; Ground-truth verified across 7 enterprise tools</span>
            <span className="hidden sm:inline">Zero hallucination guarantee</span>
          </div>
        </div>
      </div>

      {/* Document Inspector Modal / Drawer */}
      {inspectDocId && (
        <DocumentViewerModal 
          documentId={inspectDocId}
          documentData={inspectDocData}
          onClose={() => {
            setInspectDocId(null);
            setInspectDocData(null);
          }}
          onAskAi={(prompt) => handleSend(prompt)}
        />
      )}
    </div>
  );
};

export default ChatPage;

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, ChevronRight, Sparkles, AlertTriangle, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';
import { usePersona } from '../hooks/usePersona';
import api from '../utils/api';

const DEFAULT_WELCOME = [
  { 
    role: 'ai', 
    text: 'Hello! I am Company Brain, your connected semantic intelligence assistant. Ask me questions about production readiness, cross-source architecture conflicts, governance evidence, or project dependencies.', 
    intent: 'greeting' 
  }
];

const SUGGESTIONS = [
  "Is Project Atlas ready for production?",
  "Show me architecture conflicts in Project Atlas",
  "What are the open blockers across Procurement?",
  "Which GitHub config implements ADR-001?",
  "Give me an executive portfolio summary for Management"
];

const ChatPage = () => {
  const { persona } = usePersona();
  const [messages, setMessages] = useState(DEFAULT_WELCOME);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;
    
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        question: text,
        persona
      });

      setMessages(prev => [...prev, {
        role: 'ai',
        text: res.data.answer,
        citations: res.data.citations,
        intent: res.data.intent,
        readiness: res.data.readiness,
        conflicts: res.data.conflicts
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'An error occurred while analyzing the knowledge graph. Please verify the API connection.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-w-5xl mx-auto">
      {/* Chat Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-company-teal/10 text-company-teal rounded-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Company Brain AI Query Assistant</h2>
            <p className="text-[11px] text-slate-500">10-step LangGraph reasoning with Google Gemini & verified citations</p>
          </div>
        </div>
        <div className="text-xs font-semibold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-company-teal"></span>
          Viewing as: <span className="text-company-teal font-bold capitalize">{persona}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3.5 max-w-4xl ${msg.role === 'user' ? 'ml-auto' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-company-navy text-company-teal flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-sm">
                CB
              </div>
            )}
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3.5 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-company-teal text-white rounded-tr-sm shadow-sm' : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                {msg.intent && msg.role === 'ai' && (
                  <div className="mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
                      Intent: {msg.intent}
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap font-medium">
                  {msg.text}
                </div>
              </div>
              
              {/* Citations & Evidence Pills */}
              {msg.role === 'ai' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 flex gap-1.5 flex-wrap">
                  {msg.citations.map((cite, i) => (
                    <a 
                      key={i} 
                      href={cite.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 hover:border-company-teal hover:text-company-teal transition-all shadow-xs"
                    >
                      <FileText size={12} className="text-company-teal" />
                      <span className="font-semibold">{cite.source}:</span>
                      <span className="text-slate-500 font-mono">{cite.citationId || cite.record_id || cite.text}</span>
                      <ExternalLink size={10} className="text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 text-xs font-bold shadow-sm">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3.5">
            <div className="w-8 h-8 rounded-full bg-company-navy text-company-teal flex items-center justify-center shrink-0 text-xs font-bold">
              CB
            </div>
            <div className="bg-slate-50 border border-slate-200/80 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-company-teal rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-company-teal rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-company-teal rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              <span className="text-xs text-slate-500 font-medium pl-2">Grounded reasoning via Google Gemini...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-200 shrink-0">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTIONS.map((sug, i) => (
            <button 
              key={i}
              onClick={() => handleSend(sug)}
              className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-company-teal bg-white border border-teal-200 px-3 py-1.5 rounded-full hover:bg-teal-50 shadow-xs transition-colors"
            >
              {sug} <ChevronRight size={13} />
            </button>
          ))}
        </div>
        <div className="relative flex items-center">
          <input 
            type="text"
            className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:border-company-teal focus:ring-2 focus:ring-company-teal/20 transition-all font-medium"
            placeholder={`Ask a question as ${persona}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-company-teal text-white rounded-lg hover:bg-company-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

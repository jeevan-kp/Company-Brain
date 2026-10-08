import React from 'react';
import { 
  Sparkles, Layers, Cpu, Server, Database, Globe, Shield, 
  CheckCircle2, FileText, Bookmark, ExternalLink, Zap, AlertTriangle, Info
} from 'lucide-react';

const LAYER_ICONS = {
  'client layer': '💻',
  'api gateway': '🚪',
  'microservices layer': '⚙️',
  'microservices': '⚙️',
  'messaging layer': '📨',
  'messaging bus': '📨',
  'messaging': '📨',
  'data persistence': '🗄️',
  'data layer': '🗄️',
  'cloud hosting': '☁️',
  'cloud infra': '☁️'
};

/**
 * Rich Architecture & AI Narration Renderer
 * Parses structured markdown and architecture blueprints into clean, professional visual cards
 */
const ArchitectureNarrationView = ({ 
  narrationText, 
  architecture, 
  projectName, 
  projectId, 
  department,
  adrs = [],
  components = [],
  dataObjects = [],
  onNavigateToNode
}) => {
  if (!narrationText && !architecture) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 italic text-center">
        Select any project node or ask a question below to generate an architectural narration and multi-source documentation breakdown.
      </div>
    );
  }

  // Parse lines of markdown text
  const parseNarrationContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let currentBulletGroup = [];

    const flushBullets = (key) => {
      if (currentBulletGroup.length > 0) {
        elements.push(
          <div key={key} className="space-y-1.5 my-2">
            {currentBulletGroup.map((b, bIdx) => (
              <div key={bIdx} className="flex items-start gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                <span className="text-cyan-400 shrink-0 mt-0.5">&bull;</span>
                <div className="text-slate-200 leading-snug">
                  {b}
                </div>
              </div>
            ))}
          </div>
        );
        currentBulletGroup = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushBullets(`flush-${idx}`);
        return;
      }

      // Headers (### or ## or #)
      if (trimmed.startsWith('#')) {
        flushBullets(`flush-h-${idx}`);
        const headerText = trimmed.replace(/^#+\s*/, '');
        elements.push(
          <div key={`h-${idx}`} className="pt-2 pb-1 border-b border-slate-800/80">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" />
              {headerText}
            </h4>
          </div>
        );
      } 
      // Bullets (- or *)
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[-*]\s+/, '');
        // Check if bullet has bold key: e.g. - **Client Layer:** React 18...
        const match = bulletText.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim();
          const lowerKey = key.toLowerCase();
          const icon = LAYER_ICONS[lowerKey] || '📌';

          currentBulletGroup.push(
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <span>{icon}</span> {key}:
              </span>
              <span className="text-cyan-200 font-medium text-right">{val}</span>
            </div>
          );
        } else {
          currentBulletGroup.push(
            <span className="text-slate-300">
              {bulletText.replace(/\*\*/g, '')}
            </span>
          );
        }
      } 
      // Key-Value bold lines: **Business Purpose & Scope:** Group-wide...
      else if (trimmed.startsWith('**') && trimmed.includes(':**')) {
        flushBullets(`flush-kv-${idx}`);
        const parts = trimmed.split(':**');
        const key = parts[0].replace(/\*\*/g, '').trim();
        const val = parts.slice(1).join(':**').replace(/\*\*/g, '').trim();

        elements.push(
          <div key={`kv-${idx}`} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
              {key}
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {val}
            </p>
          </div>
        );
      } 
      // Standard narrative paragraph
      else {
        flushBullets(`flush-p-${idx}`);
        // Strip bold markers for clean presentation
        const cleanText = trimmed.replace(/\*\*/g, '');
        elements.push(
          <p key={`p-${idx}`} className="text-xs text-slate-300 leading-relaxed">
            {cleanText}
          </p>
        );
      }
    });

    flushBullets('final-flush');
    return elements;
  };

  return (
    <div className="space-y-3.5">
      {/* Target Project Card Banner */}
      {(projectName || projectId) && (
        <div className="p-3 bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-slate-900/90 rounded-xl border border-cyan-500/40 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-400/30">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                {department || 'System Focus'}
              </span>
              <h4 className="font-bold text-xs text-white">
                {projectName} <span className="font-mono text-cyan-300 font-normal">({projectId})</span>
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* Structured Technical Layer Grid (if architecture object exists) */}
      {architecture && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Cpu size={12} className="text-cyan-400" />
            Verified Technical Blueprint
          </span>
          <div className="grid grid-cols-1 gap-1 text-[11px]">
            {[
              { layer: 'Client Layer', val: architecture.client_layer, icon: '💻' },
              { layer: 'API Gateway', val: architecture.api_gateway, icon: '🚪' },
              { layer: 'Microservices', val: architecture.services_layer, icon: '⚙️' },
              { layer: 'Messaging Bus', val: architecture.messaging_layer, icon: '📨' },
              { layer: 'Data Layer', val: architecture.data_layer, icon: '🗄️' },
              { layer: 'Cloud Hosting', val: architecture.cloud_infra, icon: '☁️' },
            ].filter(item => item.val).map((item, idx) => (
              <div key={idx} className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/90 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <span>{item.icon}</span> {item.layer}:
                </span>
                <span className="text-cyan-300 font-medium truncate ml-2 text-right">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parsed Narration Body */}
      <div className="space-y-2">
        {parseNarrationContent(narrationText)}
      </div>

      {/* Confluence ADR Summary Pills */}
      {adrs.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
            <Bookmark size={11} /> Confluence Decisions ({adrs.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {adrs.slice(0, 3).map((adr, idx) => (
              <button
                key={idx}
                onClick={() => onNavigateToNode && onNavigateToNode(adr.id)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/40 transition-colors truncate max-w-full cursor-pointer text-left"
                title={`${adr.title}: ${adr.decision}`}
              >
                📋 {adr.id}: {adr.chosen_technology || adr.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LeanIX Runtime Components Summary Pills */}
      {components.length > 0 && (
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
            <Server size={11} /> LeanIX Components ({components.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {components.slice(0, 4).map((c, idx) => (
              <button
                key={idx}
                onClick={() => onNavigateToNode && onNavigateToNode(c.id)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors truncate max-w-full cursor-pointer text-left"
              >
                ⚙️ {c.name} v{c.version}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureNarrationView;

import React, { useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, Info, ExternalLink } from 'lucide-react';
import { ENTITY_COLORS } from '../utils/constants';

// Helper function to resolve semantic icons for AI query subgraph entities
const getNodeIcon = (node) => {
  if (!node) return '•';
  const name = (node.name || '').toLowerCase();
  const id = (node.id || '').toLowerCase();
  const type = (node.type || '').toUpperCase();
  const role = (node.flow_role || '').toUpperCase();

  if (type === 'ISSUE' || name.includes('conflict') || name.includes('alert') || id.includes('conflict')) {
    return '⚠️';
  }
  if (type === 'ACTION' || name.includes('step') || name.includes('verify') || name.includes('action')) {
    if (name.includes('verify') || name.includes('sla') || name.includes('recovered')) return '✅';
    return '⚡';
  }
  if (type === 'PERSON' || role === 'LEAD' || role === 'OWNER' || name.includes('lead') || name.includes('owner') || name.includes('contact') || name.includes('oncall')) {
    return '👤';
  }
  if (name.includes('leanix') || id.includes('leanix')) {
    return '🏛️';
  }
  if (name.includes('jira') || id.includes('jira')) {
    return '🎫';
  }
  if (name.includes('servicenow') || id.includes('servicenow') || name.includes('cmdb')) {
    return '🛠️';
  }
  if (type === 'ADR' || name.includes('adr') || name.includes('confluence')) {
    return '📑';
  }
  if (name.includes('teams') || id.includes('teams')) {
    return '💬';
  }
  if (name.includes('sharepoint') || name.includes('charter') || type === 'DOCUMENT') {
    return '📄';
  }
  if (type === 'APPLICATION' || type === 'SERVICE' || type === 'PLATFORM' || role === 'SERVICE') {
    return '☁️';
  }
  if (type === 'DEPARTMENT') {
    return '🏢';
  }
  if (node.is_center) {
    return '🎯';
  }
  if (role === 'PRODUCER') {
    return '📥';
  }
  if (role === 'CONSUMER') {
    return '📤';
  }
  if (type === 'PROJECT') {
    return '🚀';
  }
  return '📦';
};

const QueryGraphViewer = ({ graphData, onNodeClick }) => {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 750, height: 380 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Resize observer
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({ 
          width: clientWidth || 750, 
          height: isFullscreen ? window.innerHeight - 80 : 380 
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  // Tune D3 repulsive physics so nodes never clump into a tight ball
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current && graphData?.nodes?.length > 0) {
        // Apply strong repulsive charge and spread-out link distance
        fgRef.current.d3Force('charge')?.strength(-520);
        fgRef.current.d3Force('link')?.distance(115);
        fgRef.current.zoomToFit(500, 45);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [graphData, dimensions]);

  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 45);
    }
  };

  const getLinkColor = useCallback((link) => {
    if (link.color) return link.color;
    const lbl = (link.label || '').toLowerCase();
    if (lbl.includes('conflict') || lbl.includes('block') || lbl.includes('contradict') || lbl.includes('interruption')) {
      return '#ef4444'; // Red
    }
    if (lbl.includes('leanix') || lbl.includes('adr') || lbl.includes('govern')) {
      return '#a855f7'; // Purple
    }
    if (lbl.includes('jira') || lbl.includes('sprint') || lbl.includes('cmdb')) {
      return '#3b82f6'; // Blue
    }
    if (lbl.includes('feed') || lbl.includes('stream') || lbl.includes('service') || lbl.includes('procedure')) {
      return '#06b6d4'; // Cyan
    }
    if (lbl.includes('owner') || lbl.includes('lead') || lbl.includes('report') || lbl.includes('escalat')) {
      return '#10b981'; // Emerald
    }
    return 'rgba(148, 163, 184, 0.5)';
  }, []);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl text-slate-400 text-xs border border-slate-800">
        No graph relationships found for this query context.
      </div>
    );
  }

  // Check if current graph has conflict or alert nodes
  const hasConflict = graphData.nodes.some(n => n.type === 'ISSUE' || (n.name && n.name.includes('CONFLICT')));
  const hasAlert = graphData.nodes.some(n => n.type === 'ACTION' || (n.name && n.name.includes('Alert')));

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner font-sans select-none ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] shadow-2xl' : ''
      }`}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 text-xs text-white shadow-md">
        <button
          onClick={handleResetZoom}
          className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Center and Reset Zoom"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Explorer"}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* 2D Canvas with Tuned Force Simulation */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.28}
        warmupTicks={40}
        cooldownTicks={120}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const isCenter = node.is_center;
          const isIssue = node.type === 'ISSUE' || (node.name && node.name.includes('CONFLICT'));
          const isSelected = selectedNode && selectedNode.id === node.id;
          const isHovered = hoverNode && hoverNode.id === node.id;

          const baseColor = node.color || (isCenter ? '#38bdf8' : (isIssue ? '#ef4444' : (ENTITY_COLORS[node.type] || '#94a3b8')));
          const radius = isCenter ? 18 : (isIssue ? 17 : (node.val ? Math.min(16, Math.max(13, Math.sqrt(node.val) * 3.2)) : 13));

          // 1. Concentric Glowing Halos for Conflict, Epicenter, or Selection
          if (isIssue) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'; // Red glow
            ctx.fill();
          } else if (isCenter || isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.3)'; // Cyan glow
            ctx.fill();
          } else if (isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
          }

          // 2. Node Circle Solid Core
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = isIssue ? '#450a0a' : (isCenter ? '#082f49' : '#0f172a');
          ctx.fill();
          ctx.lineWidth = isSelected ? 3 : (isIssue ? 2.5 : (isCenter ? 2.5 : 1.8));
          ctx.strokeStyle = isSelected ? '#ffffff' : baseColor;
          ctx.stroke();

          // 3. Node Icon inside Circle
          const icon = getNodeIcon(node);
          const iconSize = Math.max(10, Math.round(radius * 0.95));
          ctx.font = `${iconSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(icon, node.x, node.y + 0.5);

          // 4. Smart Label Pill (Centered directly below node, with icon & collision protection)
          const rawLabel = node.name || node.id;
          const cleanLabel = rawLabel.startsWith(icon) ? rawLabel.slice(icon.length).trim() : rawLabel;
          const label = `${icon} ${cleanLabel.length > 30 ? cleanLabel.slice(0, 28) + '...' : cleanLabel}`;
          const fontSize = Math.max(9, Math.min(12, 11 / Math.sqrt(globalScale)));
          ctx.font = `${isCenter || isIssue || isSelected ? '700' : '600'} ${fontSize}px system-ui, -apple-system, sans-serif`;
          
          const textWidth = ctx.measureText(label).width;
          const pillPaddingX = 6;
          const pillHeight = fontSize + 6;
          const pillY = node.y + radius + 4;
          const pillX = node.x - textWidth / 2 - pillPaddingX;

          // Pill Background
          ctx.fillStyle = isIssue ? 'rgba(69, 10, 10, 0.92)' : (isCenter ? 'rgba(8, 47, 73, 0.92)' : 'rgba(15, 23, 42, 0.92)');
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, textWidth + pillPaddingX * 2, pillHeight, 4);
          ctx.fill();
          ctx.lineWidth = isIssue ? 1.5 : 1;
          ctx.strokeStyle = isIssue ? '#ef4444' : (isCenter ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)');
          ctx.stroke();

          // Text String
          ctx.fillStyle = isIssue ? '#fca5a5' : (isCenter ? '#67e8f9' : '#f1f5f9');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, node.x, pillY + pillHeight / 2);
        }}
        linkColor={getLinkColor}
        linkWidth={(link) => {
          const lbl = (link.label || '').toLowerCase();
          if (lbl.includes('conflict') || lbl.includes('contradict') || lbl.includes('block')) return 2.6;
          return 1.8;
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2.4}
        linkDirectionalParticleSpeed={0.007}
        linkDirectionalParticleColor={getLinkColor}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkLabel={link => `${link.label || 'CONNECTS'}`}
        onNodeHover={(node) => setHoverNode(node || null)}
        onNodeClick={(node) => {
          setSelectedNode(node);
          if (onNodeClick) onNodeClick(node);
        }}
      />

      {/* Bottom Semantic Legend & Node Details Banner */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-300 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold uppercase tracking-wider text-slate-400">Query Topology:</span>
          {hasConflict ? (
            <>
              <span className="flex items-center gap-1.5">⚠️ <span className="text-red-400 font-semibold">Discrepancy Conflict</span></span>
              <span className="flex items-center gap-1.5">🏛️ <span className="text-purple-300 font-semibold">LeanIX</span></span>
              <span className="flex items-center gap-1.5">🎫 <span className="text-blue-300 font-semibold">Jira Delivery</span></span>
              <span className="flex items-center gap-1.5">🎯 <span className="text-sky-300 font-semibold">Target Project</span></span>
              <span className="flex items-center gap-1.5">👤 <span className="text-emerald-300 font-semibold">Accountable Lead</span></span>
            </>
          ) : hasAlert ? (
            <>
              <span className="flex items-center gap-1.5">🚨 <span className="text-red-400 font-semibold">Active P1 Alert</span></span>
              <span className="flex items-center gap-1.5">📄 <span className="text-purple-300 font-semibold">SharePoint Runbook</span></span>
              <span className="flex items-center gap-1.5">⚡ <span className="text-amber-300 font-semibold">Resolution Action</span></span>
              <span className="flex items-center gap-1.5">✅ <span className="text-emerald-300 font-semibold">Verified SLA</span></span>
              <span className="flex items-center gap-1.5">👤 <span className="text-emerald-300 font-semibold">On-Call Lead</span></span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">🎯 <span className="text-sky-300 font-semibold">Target Center</span></span>
              <span className="flex items-center gap-1.5">📥 <span className="text-emerald-300 font-semibold">Producer Feed</span></span>
              <span className="flex items-center gap-1.5">📤 <span className="text-purple-300 font-semibold">Downstream Consumer</span></span>
              <span className="flex items-center gap-1.5">☁️ <span className="text-cyan-300 font-semibold">Cloud Service</span></span>
              <span className="flex items-center gap-1.5">📑 <span className="text-violet-300 font-semibold">Governing ADR</span></span>
            </>
          )}
        </div>

        {selectedNode && (
          <div className="text-cyan-300 font-semibold truncate max-w-sm shrink-0">
            {selectedNode.name}: <span className="text-slate-300 font-normal">{selectedNode.desc || selectedNode.type}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryGraphViewer;

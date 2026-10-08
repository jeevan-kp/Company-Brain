import React from 'react';
import { 
  FileText, ExternalLink, ShieldCheck, AlertTriangle, 
  CheckCircle2, ArrowRight, Bookmark, Info, HelpCircle
} from 'lucide-react';

/**
 * Enterprise Markdown & Executive Response Viewer
 * Formats LLM markdown into clean, styled UI with clickable inline citations
 */
const MarkdownViewer = ({ content, onCitationClick }) => {
  if (!content) return null;

  // Split lines into structured blocks
  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let currentTable = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2.5 space-y-1.5 pl-2">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
              <div className="flex-1">{renderInlineText(item, onCitationClick)}</div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      const headerRow = currentTable[0];
      const bodyRows = currentTable.slice(1).filter(row => !row.every(cell => cell.includes('---')));

      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {headerRow.map((h, i) => (
                  <th key={i} className="px-3.5 py-2 font-bold text-slate-700">
                    {renderInlineText(h.trim(), onCitationClick)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-700">
                      {renderInlineText(cell.trim(), onCitationClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code block toggle
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-3 p-3 bg-slate-900 text-sky-300 font-mono text-[11px] rounded-xl overflow-x-auto">
            <pre>{codeBlockLines.join('\n')}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty lines
    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // Table rows
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line.split('|').slice(1, -1);
      currentTable.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Heading 1 (# ...)
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-base font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-sky-600 rounded-full inline-block"></span>
          {renderInlineText(line.replace(/^#\s+/, ''), onCitationClick)}
        </h1>
      );
      continue;
    }

    // Heading 2 (## ...)
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-bold text-slate-900 mt-3.5 mb-1.5 flex items-center gap-1.5">
          <span className="w-1 h-3 bg-indigo-500 rounded-full inline-block"></span>
          {renderInlineText(line.replace(/^##\s+/, ''), onCitationClick)}
        </h2>
      );
      continue;
    }

    // Heading 3 (### ...)
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-xs font-bold uppercase tracking-wider text-slate-800 mt-3 mb-1">
          {renderInlineText(line.replace(/^###\s+/, ''), onCitationClick)}
        </h3>
      );
      continue;
    }

    // Bullet lists (* ... or - ...)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      currentList.push(line.replace(/^[\*\-]\s+/, ''));
      continue;
    }

    // Numbered lists (1. ... or 2. ...)
    if (/^\d+\.\s+/.test(line)) {
      flushList();
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${i}`} className="my-1.5 flex items-start gap-2 text-xs text-slate-800 leading-relaxed">
            <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
              {numMatch[1]}
            </span>
            <div className="flex-1 font-medium">
              {renderInlineText(numMatch[2], onCitationClick)}
            </div>
          </div>
        );
        continue;
      }
    }

    // Blockquote (> ...)
    if (line.startsWith('>')) {
      flushList();
      elements.push(
        <div key={`quote-${i}`} className="my-2 p-3 bg-amber-50/70 border-l-4 border-amber-400 rounded-r-lg text-xs text-slate-700 italic">
          {renderInlineText(line.replace(/^>\s*/, ''), onCitationClick)}
        </div>
      );
      continue;
    }

    // Standard Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs text-slate-800 leading-relaxed font-medium">
        {renderInlineText(line, onCitationClick)}
      </p>
    );
  }

  flushList();
  flushTable();

  return (
    <div className="space-y-1 text-slate-800">
      {elements}
    </div>
  );
};

/**
 * Parses inline formatting like bold (**...**), citations ([...]), and code (`...`)
 */
function renderInlineText(text, onCitationClick) {
  if (!text) return null;

  // Regex splitting by bold (**...**), citations ([...]), and inline code (`...`)
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // 1. Bold (**text**)
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // 2. Inline Code (`code`)
    else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c-${match.index}`} className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1 py-0.5 rounded border border-slate-200">
          {token.slice(1, -1)}
        </code>
      );
    }
    // 3. Citation ([Citation ID / Document])
    else if (token.startsWith('[') && token.endsWith(']')) {
      const citeText = token.slice(1, -1);
      
      // Determine if it looks like an enterprise citation
      const isCitation = 
        citeText.startsWith('P-') || 
        citeText.includes('SharePoint') || 
        citeText.includes('Confluence') || 
        citeText.includes('ServiceNow') || 
        citeText.includes('LeanIX') || 
        citeText.includes('GitHub') || 
        citeText.includes('ADR') || 
        citeText.includes('INC') || 
        citeText.includes('CONF-') ||
        citeText.includes('.docx') ||
        citeText.includes('.pdf') ||
        citeText.includes('Guide') ||
        citeText.includes('Runbook') ||
        citeText.includes('Charter');

      if (isCitation && onCitationClick) {
        parts.push(
          <button
            key={`cite-${match.index}`}
            onClick={(e) => {
              e.stopPropagation();
              onCitationClick(citeText);
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 hover:border-sky-400 rounded text-[10px] font-bold font-mono transition-all group align-baseline cursor-pointer"
            title={`Click to view verified source document: ${citeText}`}
          >
            <FileText size={10} className="text-sky-600 group-hover:scale-110 transition-transform" />
            <span>{citeText.length > 32 ? citeText.slice(0, 30) + '...' : citeText}</span>
            <ExternalLink size={9} className="opacity-60 group-hover:opacity-100" />
          </button>
        );
      } else {
        parts.push(
          <span key={`cite-plain-${match.index}`} className="font-semibold text-slate-700">
            [{citeText}]
          </span>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default MarkdownViewer;

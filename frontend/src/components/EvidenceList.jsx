import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

const EvidenceList = ({ evidence = [] }) => {
  if (!evidence.length) return <div className="text-sm text-slate-500 py-4">No evidence found.</div>;

  return (
    <div className="space-y-3">
      {evidence.map((item, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-md p-3 hover:shadow-sm transition-shadow">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500 text-xs">
              {item.sourceType?.substring(0, 2).toUpperCase() || 'SRC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 font-medium mb-1">{item.statement}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className={item.confidence > 0.8 ? 'text-green-500' : 'text-yellow-500'} />
                  {item.authority}
                </span>
                <span>•</span>
                <span>Conf: {Math.round((item.confidence || 0) * 100)}%</span>
                {item.url && (
                  <>
                    <span>•</span>
                    <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-company-teal hover:underline">
                      View Source <ExternalLink size={12} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EvidenceList;

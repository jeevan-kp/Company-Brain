import React from 'react';
import { Database, Clock, CheckCircle2 } from 'lucide-react';

const SourceFreshness = ({ sources = [] }) => {
  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Source System Freshness</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {sources.map((src, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Database size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-700">{src.name}</h4>
                <p className="text-xs text-slate-500">{src.recordCount} records</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 justify-end">
                  <Clock size={14} className="text-slate-400" />
                  {src.lastSync}
                </div>
                <span className="text-xs text-slate-500">Last synchronized</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle2 size={16} />
                Healthy
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceFreshness;

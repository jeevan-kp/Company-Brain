import React from 'react';
import { AlertOctagon, ArrowRight } from 'lucide-react';

const ConflictCard = ({ conflict }) => {
  if (!conflict) return null;
  
  return (
    <div className="card border-l-4 border-l-red-500 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertOctagon size={20} className="text-red-500" />
        <h4 className="font-bold text-slate-800">{conflict.type || 'Knowledge Conflict'}</h4>
        <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded">
          {conflict.severity || 'HIGH'}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">{conflict.description}</p>
      
      <div className="bg-slate-50 rounded p-3 text-sm flex flex-col md:flex-row gap-4 items-center mb-3">
        <div className="flex-1 bg-white border border-slate-200 p-2 rounded shadow-sm w-full">
          <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Source A ({conflict.sourceA?.type})</span>
          <span className="font-medium">{conflict.sourceA?.statement}</span>
        </div>
        <ArrowRight size={16} className="text-slate-400 rotate-90 md:rotate-0 shrink-0" />
        <div className="flex-1 bg-white border border-slate-200 p-2 rounded shadow-sm w-full">
          <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Source B ({conflict.sourceB?.type})</span>
          <span className="font-medium">{conflict.sourceB?.statement}</span>
        </div>
      </div>
      
      <div className="text-sm">
        <span className="font-semibold text-slate-700">Recommendation: </span>
        <span className="text-slate-600">{conflict.recommendation}</span>
      </div>
    </div>
  );
};

export default ConflictCard;

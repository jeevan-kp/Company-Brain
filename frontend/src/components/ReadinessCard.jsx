import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { READINESS_COLORS } from '../utils/constants';

const ReadinessCard = ({ status = 'NOT_READY', score = 0, failedRules = [] }) => {
  const statusColor = READINESS_COLORS[status] || READINESS_COLORS.NOT_READY;
  
  const getIcon = () => {
    if (status === 'READY') return <CheckCircle className="text-green-600" />;
    if (status === 'CONDITIONALLY_READY') return <AlertTriangle className="text-yellow-600" />;
    return <XCircle className="text-red-600" />;
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Project Readiness</h3>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor}`}>
            {status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 border-slate-100 relative">
          {/* Simple circle approximation */}
          <span className="text-lg font-bold text-slate-700">{score}%</span>
        </div>
      </div>
      
      {failedRules.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-3">Failed Rules</h4>
          <ul className="space-y-2">
            {failedRules.map((rule, idx) => (
              <li key={idx} className="flex gap-2 items-start text-sm">
                <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-700">{rule.name}</span>
                  <p className="text-slate-500 text-xs mt-0.5">{rule.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReadinessCard;

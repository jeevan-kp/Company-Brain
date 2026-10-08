import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Users, DollarSign, CheckCircle2, AlertTriangle, 
  Sparkles, ArrowRight, UserCheck, ShieldCheck, Clock, Award, Filter, FileText
} from 'lucide-react';
import api from '../utils/api';

const TalentMarketplacePage = () => {
  const navigate = useNavigate();
  const [marketplaceData, setMarketplaceData] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enterprise/talent-marketplace')
      .then(res => {
        setMarketplaceData(res.data);
        if (res.data.positions?.length > 0) {
          setSelectedPosition(res.data.positions[0]);
        }
      })
      .catch(err => {
        console.error('Failed to load talent marketplace:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Matching open positions to internal employees & available capacity...</span>
      </div>
    );
  }

  const positions = marketplaceData?.positions || [];
  const summary = marketplaceData?.summary || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-7 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Briefcase size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">Strategic Staffing</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Internal Talent Marketplace & Position Matching</h1>
            </div>
          </div>
          <span className="text-xs bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-medium">
            AI Capacity Sharing Engine
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Smart internal talent reallocation matching open strategic project openings directly to existing AutoNova employees 
          with verified skill competencies and available capacity (&lt;100% allocation), avoiding expensive external contractor spend.
        </p>

        {/* Financial Savings Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Open Strategic Openings</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{positions.length} Openings</span>
            <span className="text-[10px] text-slate-400">Cyber, S/4HANA, Telematics, Sourcing</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Potential Contractor Savings</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
              €{(summary.potential_monthly_cost_savings || 55000).toLocaleString()} / month
            </span>
            <span className="text-[10px] text-emerald-300">Via internal capacity sharing</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">Internal Fill Rate</span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">{summary.internal_fillable_rate || '85%'}</span>
            <span className="text-[10px] text-slate-400">High skill match available</span>
          </div>
        </div>
      </div>

      {/* Main Position Matching Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Open Positions List */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Briefcase size={16} className="text-emerald-600" />
            Open Strategic Positions ({positions.length})
          </h3>
          <div className="space-y-2.5">
            {positions.map((pos, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPosition(pos)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedPosition?.id === pos.id 
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{pos.title}</span>
                    <span className="text-[11px] text-slate-500">{pos.department} &bull; {pos.project_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    pos.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                    pos.urgency === 'High' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {pos.urgency}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Need: <strong>{pos.capacity_needed_pct}% Capacity</strong></span>
                  <span className="font-mono font-bold text-emerald-700">€{pos.estimated_contractor_cost_monthly.toLocaleString()}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Matched Internal Candidates Drawer */}
        {selectedPosition && (
          <div className="lg:col-span-2 card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  {selectedPosition.id} &bull; {selectedPosition.project_id}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedPosition.title}
                </h2>
                <span className="text-xs text-slate-500">
                  Assigned Project: <strong>{selectedPosition.project_name}</strong>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">External Rate</span>
                <span className="text-base font-mono font-bold text-red-600">
                  €{selectedPosition.estimated_contractor_cost_monthly.toLocaleString()}/mo
                </span>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mandatory Skill Profile:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPosition.required_skills.map((sk, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md font-semibold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Top Matched Candidates */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-600" />
                  Top Recommended Internal Candidates ({selectedPosition.top_candidates?.length || 0})
                </h3>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {selectedPosition.recommended_action}
                </span>
              </div>

              <div className="space-y-3">
                {(selectedPosition.top_candidates && selectedPosition.top_candidates.length > 0) ? (
                  selectedPosition.top_candidates.map((cand, cIdx) => (
                    <div key={cIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 hover:border-emerald-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{cand.name}</span>
                            <span className="text-[10px] font-mono bg-white text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded">
                              {cand.person_id}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{cand.job_title} &bull; {cand.department}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {cand.match_score}% Skill Match
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {cand.available_bandwidth_pct}% Bandwidth Open
                          </span>
                        </div>
                      </div>

                      {/* Recommendation Callout */}
                      <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        cand.can_accommodate 
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {cand.can_accommodate ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={15} className="text-amber-600 shrink-0" />}
                        <span>{cand.recommendation}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-slate-500">
                          Current Load: <strong>{cand.current_allocation_pct}%</strong>
                        </span>
                        <button 
                          onClick={() => alert(`Requested internal capacity sharing request for ${cand.name} at ${selectedPosition.capacity_needed_pct}% allocation sent to Resource Manager.`)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Request Capacity Sharing
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900">
                          External Vendor Sourcing Mandate Activated
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          All 86 internal engineers with adjacent certifications in {selectedPosition.required_skills.slice(0, 2).join(', ')} are currently 100% committed to active Tier-1 go-lives. 
                          Company Brain recommends routing to approved MSP vendors (SAP Fieldglass) with standardized market rates.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Market Rate</span>
                        <span className="text-base font-bold text-slate-900 font-mono">
                          €{selectedPosition.est_contractor_rate_eur || 125}/hr
                        </span>
                        <span className="text-[10px] text-slate-500 block">€{((selectedPosition.est_contractor_rate_eur || 125) * 160).toLocaleString()}/month</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved Channel</span>
                        <span className="text-xs font-bold text-indigo-700 block mt-0.5">SAP Fieldglass Framework</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">TISAX AL3 Vendor Pool</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => alert(`Generated SOW requisition template for ${selectedPosition.title} with target budget €${((selectedPosition.est_contractor_rate_eur || 125) * 160).toLocaleString()}/mo.`)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                      >
                        <FileText size={14} /> Generate Contractor SOW Requisition
                      </button>
                      <button
                        onClick={() => alert(`Adjacent skill search: Found 2 candidates in DTFS with 75% skill match requiring 2-week upskilling.`)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <UserCheck size={14} /> Expand to Adjacent Skills (75% Match)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentMarketplacePage;

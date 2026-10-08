import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Activity, ArrowRight, ShieldCheck, Lock, Clock, 
  Search, Server, Zap, Layers, RefreshCw, Eye, ExternalLink, Filter,
  Users, Cpu, GitBranch, CheckCircle, Shield, HelpCircle, AlertCircle
} from 'lucide-react';
import api from '../utils/api';

const DataLineagePage = () => {
  const navigate = useNavigate();
  const [dataLineage, setDataLineage] = useState(null);
  const [activeView, setActiveView] = useState('dataflow'); // 'dataflow' | 'teams' | 'raci'
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enterprise/data-lineage')
      .then(res => {
        setDataLineage(res.data);
        if (res.data.datasets?.length > 0) {
          setSelectedDataset(res.data.datasets[0]);
        }
      })
      .catch(err => {
        console.error('Failed to load data lineage:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Tracing cross-application data flow and teams taxonomy...</span>
      </div>
    );
  }

  const datasets = dataLineage?.datasets || [];
  const teamsTaxonomy = dataLineage?.teams_taxonomy || { categories: [], raci_matrix: [] };
  const domains = ['ALL', ...new Set(datasets.map(d => d.domain))];

  const filteredDatasets = datasets.filter(ds => {
    const matchesDomain = selectedDomain === 'ALL' || ds.domain === selectedDomain;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      ds.name.toLowerCase().includes(q) ||
      ds.producer_name.toLowerCase().includes(q) ||
      ds.data_owner.toLowerCase().includes(q) ||
      ds.storage_engine.toLowerCase().includes(q)
    );
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-7 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Database size={22} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">Enterprise Data Fabric</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Application Data Flow &amp; Teams Taxonomy</h1>
            </div>
          </div>
          <span className="text-xs bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-medium">
            {datasets.length} Master Cross-Application Streams &bull; 14 Engineering Teams
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Centralized application data registry mapping producers, storage backends, and multi-hop downstream consumers across 
          Finance, Cyber Security, DTFS, Procurement, Sales &amp; Aftersales, and Human Resources. 
          Defines clear roles and responsibilities for Platform Teams, Application Teams, and Infrastructure Teams.
        </p>

        {/* Lineage Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cross-Domain Streams</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{datasets.length} Active Feeds</span>
            <span className="text-[10px] text-teal-400">All 6 Business Domains</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-teal-400 block">Streaming Frequency</span>
            <span className="text-xl font-bold text-teal-400 mt-0.5 block">Sub-Second Real-Time</span>
            <span className="text-[10px] text-slate-400">12,000 eps Kafka telemetry</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">Engineering Squads</span>
            <span className="text-xl font-bold text-purple-400 mt-0.5 block">14 Dedicated Teams</span>
            <span className="text-[10px] text-slate-400">Platform &bull; App &bull; Infrastructure</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Downstream Consumers</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">26 Connected Nodes</span>
            <span className="text-[10px] text-slate-400">Multi-hop dependency fabric</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveView('dataflow')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeView === 'dataflow'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap size={14} /> Cross-Application Data Flow ({datasets.length})
        </button>
        <button
          onClick={() => setActiveView('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeView === 'teams'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={14} /> Teams Taxonomy (Platform vs App vs Infra)
        </button>
        <button
          onClick={() => setActiveView('raci')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeView === 'raci'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers size={14} /> Project RACI Responsibility Matrix
        </button>
      </div>

      {/* VIEW 1: DATA FLOW & LINEAGE */}
      {activeView === 'dataflow' && (
        <div className="space-y-6">
          {/* INTERACTIVE VISUAL LINEAGE FLOW CANVAS */}
          {selectedDataset && (
            <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-md space-y-4 border border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 block">End-to-End Cross-Application Pipeline</span>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Zap size={17} className="text-teal-400" />
                    Lineage Stream: {selectedDataset.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-800 text-teal-300 border border-slate-700 px-3 py-1 rounded-md">
                    Protocol: {selectedDataset.protocol}
                  </span>
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md">
                    {selectedDataset.domain}
                  </span>
                </div>
              </div>

              {/* Flow Visualizer Grid: Producer -> Dataset Stream -> Consumers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-center">
                {/* 1. Producer Node */}
                <div className="p-5 bg-slate-800/90 border border-slate-700 rounded-xl space-y-2 relative">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Producer Application</span>
                  <h3 className="font-bold text-sm text-slate-100">{selectedDataset.producer_name}</h3>
                  <span className="font-mono text-[10px] text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 inline-block">
                    {selectedDataset.producer_project_id}
                  </span>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Data Owner: <strong>{selectedDataset.data_owner}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Steward: <span className="text-slate-300">{selectedDataset.data_steward}</span>
                  </p>
                  <button
                    onClick={() => navigate(`/project/${selectedDataset.producer_project_id}`)}
                    className="mt-2 text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                  >
                    Inspect Producer Project <ArrowRight size={12} />
                  </button>
                </div>

                {/* 2. Central Data Asset Node */}
                <div className="p-5 bg-teal-950/80 border-2 border-teal-500 rounded-xl space-y-2 relative shadow-lg text-center">
                  <div className="inline-flex p-2 bg-teal-500/20 text-teal-400 rounded-full mb-1">
                    <Database size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-teal-300 block">Enterprise Master Asset</span>
                  <h3 className="font-bold text-xs text-white leading-snug">{selectedDataset.name}</h3>
                  <div className="text-[10px] font-mono text-teal-200 bg-teal-900/60 p-1.5 rounded border border-teal-700/60 mt-1">
                    {selectedDataset.storage_engine}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                      {selectedDataset.classification}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      {selectedDataset.update_frequency}
                    </span>
                  </div>
                </div>

                {/* 3. Consumers List */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Authorized Downstream Consumers ({selectedDataset.consumers?.length || 0}):
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(selectedDataset.consumers || []).map((cons, cIdx) => (
                      <div key={cIdx} className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">{cons.name}</span>
                          <span className="font-mono text-[10px] text-teal-400">{cons.project_id}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          <strong>Consumer Reason:</strong> {cons.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter size={13} /> Domain:
              </span>
              {domains.map(dom => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedDomain === dom 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search datasets or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* Datasets Table */}
          <div className="card bg-white border border-slate-200 shadow-xs overflow-hidden rounded-xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-teal-600" />
                Cross-Application Data Assets Catalog ({filteredDatasets.length} Streams)
              </h3>
              <span className="text-xs text-slate-500 font-medium">Click any row to trace end-to-end data flow</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                    <th className="p-3 font-bold">Data Asset Name</th>
                    <th className="p-3 font-bold">Domain</th>
                    <th className="p-3 font-bold">Producer Application</th>
                    <th className="p-3 font-bold">Data Owner</th>
                    <th className="p-3 font-bold">Classification</th>
                    <th className="p-3 font-bold">Storage Engine</th>
                    <th className="p-3 font-bold">Cadence</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDatasets.map((ds, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedDataset(ds)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedDataset?.id === ds.id ? 'bg-teal-50/60' : ''}`}
                    >
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          <span>{ds.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{ds.domain}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">{ds.producer_name}</span>
                        <span className="block text-[10px] font-mono text-slate-400">{ds.producer_project_id}</span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{ds.data_owner}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {ds.classification}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700">{ds.storage_engine}</td>
                      <td className="p-3 text-slate-600">{ds.update_frequency}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDataset(ds);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 text-teal-700 font-bold rounded text-[11px] transition-colors cursor-pointer"
                        >
                          Trace Flow
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TEAMS TAXONOMY */}
      {activeView === 'teams' && (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-3">
            <Users size={20} className="text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-900">
                Enterprise Engineering Teams Taxonomy &bull; Structure &amp; Project Contributions
              </h4>
              <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                Engineering squads at AutoNova are structured into three distinct disciplines: 
                <strong> Platform Teams</strong> (provide foundation, landing zones, shared Kafka buses), 
                <strong> Application Teams</strong> (build domain microservices and feature backlogs), and 
                <strong> Infrastructure Teams</strong> (guarantee 24/7 uptime, disaster recovery, and database clustering).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(teamsTaxonomy.categories || []).map((cat, idx) => (
              <div 
                key={idx} 
                className="card p-5 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      cat.id === 'PLATFORM_TEAMS' ? 'bg-sky-100 text-sky-800' :
                      cat.id === 'APPLICATION_TEAMS' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {cat.id.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {cat.teams?.length || 0} Squads
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{cat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.role_definition}</p>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Core Responsibilities:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {(cat.key_responsibilities || []).map((resp, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-1.5">
                          <CheckCircle size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Active Squads &amp; Leads:
                  </span>
                  <div className="space-y-2">
                    {(cat.teams || []).map((tm, tIdx) => (
                      <div key={tIdx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{tm.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">{tm.members_count} engineers</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">Lead: {tm.lead}</span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {(tm.primary_tech || []).map((tc, tcIdx) => (
                            <span key={tcIdx} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.2 rounded font-mono text-slate-600">
                              {tc}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: RACI MATRIX */}
      {activeView === 'raci' && (
        <div className="space-y-6">
          <div className="card bg-white border border-slate-200 shadow-xs overflow-hidden rounded-xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  Enterprise Project Lifecycle RACI Responsibility Matrix
                </h3>
                <span className="text-xs text-slate-500">
                  R: Responsible (does work) &bull; A: Accountable (decision maker) &bull; C: Consulted (gives input) &bull; I: Informed (receives updates)
                </span>
              </div>
              <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md font-bold">
                AutoNova Engineering Standard
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                    <th className="p-3.5 font-bold w-1/4">Project Lifecycle Phase</th>
                    <th className="p-3.5 font-bold w-1/4 text-sky-800 bg-sky-50/50">Platform Teams Role</th>
                    <th className="p-3.5 font-bold w-1/4 text-indigo-800 bg-indigo-50/50">Application Teams Role</th>
                    <th className="p-3.5 font-bold w-1/4 text-emerald-800 bg-emerald-50/50">Infrastructure Teams Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(teamsTaxonomy.raci_matrix || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900 align-top">
                        {row.lifecycle_phase}
                      </td>
                      <td className="p-3.5 bg-sky-50/30 align-top space-y-1">
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded text-[10px] inline-block">
                          {row.platform_role}
                        </span>
                        <p className="text-slate-600 leading-snug">{row.platform_desc}</p>
                      </td>
                      <td className="p-3.5 bg-indigo-50/30 align-top space-y-1">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-[10px] inline-block">
                          {row.app_role}
                        </span>
                        <p className="text-slate-600 leading-snug">{row.app_desc}</p>
                      </td>
                      <td className="p-3.5 bg-emerald-50/30 align-top space-y-1">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] inline-block">
                          {row.infra_role}
                        </span>
                        <p className="text-slate-600 leading-snug">{row.infra_desc}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataLineagePage;

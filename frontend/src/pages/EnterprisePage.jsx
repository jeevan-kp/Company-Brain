import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Activity, CheckCircle, Target, ArrowUpRight, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { READINESS_COLORS } from '../utils/constants';

const EnterprisePage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, deptRes, kpiRes, projRes] = await Promise.all([
          api.get('/enterprise'),
          api.get('/enterprise/departments'),
          api.get('/enterprise/kpis'),
          api.get('/projects')
        ]);
        setOverview(overviewRes.data);
        setDepartments(deptRes.data);
        setKpis(kpiRes.data);
        setProjects(projRes.data);
      } catch (err) {
        console.error('Failed to load enterprise data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const readinessPieData = kpis?.readiness_distribution || [
    { name: 'Ready', value: 9, color: '#10b981' },
    { name: 'Conditionally Ready', value: 10, color: '#f59e0b' },
    { name: 'Not Ready', value: 1, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-company-teal font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={14} /> Group Functions & SAP CoE Portfolio
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Overview</h1>
          <p className="text-slate-500 text-xs mt-0.5">Connected semantic knowledge layer across 10 Group Function departments</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search projects or departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-company-teal/20 focus:border-company-teal"
          />
        </div>
      </div>

      {/* Top Portfolio KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3.5 border-l-4 border-l-blue-600">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Target size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Projects</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{overview?.total_projects || 20}</h3>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3.5 border-l-4 border-l-red-500">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Projects at Risk</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{kpis?.projects_at_risk || 3}</h3>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3.5 border-l-4 border-l-amber-500">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Blocking Conflicts</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{kpis?.blocking_conflicts || 3}</h3>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200 shadow-sm flex items-center gap-3.5 border-l-4 border-l-emerald-500">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Portfolio Readiness</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{overview?.overall_readiness || 78}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Department Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Readiness Distribution */}
        <div className="card p-5 bg-white border border-slate-200 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Production Readiness Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Evaluated against 10 deterministic gates</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={readinessPieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={80} 
                    paddingAngle={4} 
                    dataKey="value"
                  >
                    {readinessPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {readinessPieData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value} projects</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 10 Departments Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Group Function Departments ({departments.length})</h3>
            <span className="text-xs text-slate-500 font-medium">Click department to explore domains</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {departments.map((dept) => {
              const avgScore = Math.round(dept.projects?.reduce((a, b) => a + (b.readiness?.score || 70), 0) / (dept.projects?.length || 1));
              return (
                <div 
                  key={dept.department} 
                  onClick={() => navigate(`/department/${encodeURIComponent(dept.department)}`)}
                  className="card p-4 bg-white border border-slate-200 hover:border-company-teal hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-company-teal transition-colors flex items-center gap-1.5">
                        {dept.department}
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-company-teal" />
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {dept.projects?.[0]?.domain || 'Core Platform'}
                      </p>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono">
                      {dept.project_count} {dept.project_count === 1 ? 'Project' : 'Projects'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Avg Readiness</span>
                      <span className="font-bold text-slate-800">{avgScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${avgScore >= 85 ? 'bg-emerald-500' : avgScore >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} 
                        style={{ width: `${avgScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: All 20 Projects Table */}
      <div className="card bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">All Portfolio Projects ({filteredProjects.length})</h3>
            <p className="text-xs text-slate-500">Live projects connected to the semantic knowledge graph</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Project Name</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Domain</th>
                <th className="p-3.5">Phase</th>
                <th className="p-3.5">Readiness</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((proj) => {
                const status = proj.readiness?.status || 'READY';
                const statusColor = READINESS_COLORS[status] || READINESS_COLORS.READY;
                return (
                  <tr 
                    key={proj.project_id} 
                    onClick={() => navigate(`/project/${proj.project_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono font-bold text-slate-700">{proj.project_id}</td>
                    <td className="p-3.5 font-bold text-slate-900">{proj.name}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{proj.department}</td>
                    <td className="p-3.5 text-slate-500">{proj.domain}</td>
                    <td className="p-3.5">
                      <span className="capitalize px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {proj.lifecycle_phase || 'active'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${statusColor}`}>
                        {status.replace('_', ' ')} ({proj.readiness?.score || 85}%)
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-company-teal font-bold hover:underline">View Deep-Dive &rarr;</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePage;

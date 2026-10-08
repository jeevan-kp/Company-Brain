import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../utils/api';
import { READINESS_COLORS } from '../utils/constants';

const DepartmentPage = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeptData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects?department=${encodeURIComponent(departmentId)}`);
        setProjects(res.data);
      } catch (err) {
        console.error('Failed to fetch department projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeptData();
  }, [departmentId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-company-teal transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to Enterprise Overview
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-company-teal/10 text-company-teal rounded-lg">
              <Layers size={24} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Group Function Department</span>
              <h1 className="text-2xl font-bold text-slate-900">
                {projects[0]?.domain || projects[0]?.department || departmentId}
                {departmentId && departmentId !== (projects[0]?.domain || projects[0]?.department) && (
                  <span className="ml-2 text-sm font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {departmentId}
                  </span>
                )}
              </h1>
            </div>
          </div>
          <span className="self-start sm:self-auto bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-md font-mono">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} Connected
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => {
          const readinessStatus = project.readiness?.status || 'READY';
          const readinessColor = READINESS_COLORS[readinessStatus] || READINESS_COLORS.READY;
          const score = project.readiness?.score || 85;
          const blockersCount = project.readiness?.failed_rules?.length || 0;

          return (
            <div 
              key={project.project_id} 
              onClick={() => navigate(`/project/${project.project_id}`)}
              className="card p-5 bg-white border border-slate-200 hover:border-company-teal hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-bold text-company-teal bg-teal-50 px-2 py-0.5 rounded">
                    {project.project_id}
                  </span>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${readinessColor}`}>
                    {readinessStatus.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-company-teal transition-colors mt-2">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {project.business_objective || project.business_theme || 'Core transformation initiative'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs my-4">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Domain</span>
                    <span className="font-bold text-slate-700 truncate block">{project.domain}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <span className="block text-slate-400 text-[10px] uppercase font-bold mb-0.5">Phase</span>
                    <span className="font-bold text-slate-700 capitalize">{project.lifecycle_phase || 'active'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {blockersCount > 0 ? (
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      <ShieldAlert size={14} /> {blockersCount} Blocker{blockersCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 size={14} /> Gates Cleared
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-company-teal group-hover:translate-x-0.5 transition-transform">
                  <span>Deep-Dive</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentPage;

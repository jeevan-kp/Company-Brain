import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  Network, MessageSquare, BarChart2, Settings, BrainCircuit, RefreshCw, 
  CheckCircle, Sparkles, HelpCircle, Building, Users, Database, Cpu, Briefcase, GraduationCap 
} from 'lucide-react';
import PersonaSwitcher from './PersonaSwitcher';
import ErrorBoundary from './ErrorBoundary';
import { DEPARTMENTS } from '../utils/constants';
import api from '../utils/api';

const Layout = () => {
  const location = useLocation();
  const isGraphPage = location.pathname === '/graph';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setRefreshSuccess(false);
    try {
      await api.post('/admin/refresh');
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 3000);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsRefreshing(false);
    }
  };

  const domainCounts = {
    'Cyber Security': 7,
    'DTFS - Truck Financial Services': 6,
    'Finance': 6,
    'Procurement': 5,
    'Sales & Aftersales': 6,
    'Human Resources (shared function)': 1
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${isGraphPage ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
              <BrainCircuit size={22} />
            </div>
            <div>
              <span className="text-white font-bold text-base block tracking-tight">Company Brain</span>
              <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">AutoNova Group</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          <div className="px-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Core Intelligence
          </div>
          <NavLink to="/" end className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-sky-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <BarChart2 size={15} />
            Company Brain Dashboard
          </NavLink>
          <NavLink to="/chat" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-sky-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <MessageSquare size={15} />
            AI Query Assistant
          </NavLink>
          <NavLink to="/graph" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-sky-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Network size={15} />
            Knowledge Graph Explorer
          </NavLink>

          <div className="pt-3 px-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Executive Management
          </div>
          <NavLink to="/pm-overview" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Building size={15} className="text-indigo-400" />
            Project Mgmt & Org Map
          </NavLink>
          <NavLink to="/workforce" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users size={15} className="text-sky-400" />
            Workforce & Capacity
          </NavLink>
          <NavLink to="/data-lineage" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Database size={15} className="text-teal-400" />
            Data Flow & Lineage
          </NavLink>
          <NavLink to="/architecture" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Cpu size={15} className="text-purple-400" />
            Tech Stack & AI Architecture
          </NavLink>
          <NavLink to="/talent-marketplace" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Briefcase size={15} className="text-emerald-400" />
            Talent & Position Filling
          </NavLink>
          <NavLink to="/onboarding" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
            <GraduationCap size={15} className="text-pink-400" />
            Employee Onboarding & Wiki
          </NavLink>

          <div className="pt-3 px-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Prompt Intelligence & Standards
          </div>
          <NavLink to="/qa" className={({isActive}) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-slate-800 text-amber-400 font-bold' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Sparkles size={15} className="text-amber-400" />
            Standard Prompts & Insights (230)
          </NavLink>
          
          <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            6 Business Domains
          </div>
          <div className="space-y-0.5">
            {DEPARTMENTS.map((dept) => (
              <NavLink 
                key={dept}
                to={`/department/${encodeURIComponent(dept)}`} 
                className={({isActive}) => `flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${isActive ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}
              >
                <span className="truncate">{dept}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">
                  {domainCounts[dept] || 1}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
        
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <NavLink to="/admin" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Settings size={15} />
            Data Sources & Live Telemetry
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-14 flex items-center justify-between px-6 shrink-0 z-10 transition-colors ${
          isGraphPage 
            ? 'bg-slate-950 border-b border-slate-800/80 text-white shadow-md' 
            : 'bg-white border-b border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isGraphPage 
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}>
              AutoNova Group • Connected Intelligence Layer
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-60 cursor-pointer ${
                isGraphPage
                  ? 'bg-slate-900 border-slate-700 text-cyan-300 hover:bg-slate-800 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
              {isRefreshing ? 'Syncing...' : 'Sync Graph'}
            </button>
            
            {refreshSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/50">
                <CheckCircle size={13} /> Graph Synchronized
              </span>
            )}

            <div className={`h-4 w-px ${isGraphPage ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

            {/* Persona Switcher Component */}
            <PersonaSwitcher />
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className={`flex-1 min-w-0 ${
          isGraphPage 
            ? 'overflow-hidden p-0 bg-slate-950' 
            : location.pathname === '/chat'
              ? 'overflow-hidden p-0 bg-white' 
              : 'overflow-y-auto p-6 bg-slate-50'
        }`}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;

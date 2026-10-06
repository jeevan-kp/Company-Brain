import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Network, MessageSquare, BarChart2, Settings, BrainCircuit, RefreshCw, CheckCircle, Sparkles, HelpCircle } from 'lucide-react';
import PersonaSwitcher from './PersonaSwitcher';
import { DEPARTMENTS } from '../utils/constants';
import api from '../utils/api';

const Layout = () => {
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
    <div className="flex h-screen bg-company-light overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-company-navy text-slate-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-company-teal/20 rounded-lg">
              <BrainCircuit className="text-company-teal" size={22} />
            </div>
            <div>
              <span className="text-white font-bold text-base block tracking-tight">Company Brain</span>
              <span className="text-[10px] uppercase font-semibold text-company-teal block tracking-wider">AutoNova Group</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          <NavLink to="/" end className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-company-teal text-white shadow-sm' : 'hover:bg-slate-800/80 hover:text-white'}`}>
            <BarChart2 size={17} />
            Enterprise Overview (31 Projects)
          </NavLink>
          <NavLink to="/chat" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-company-teal text-white shadow-sm' : 'hover:bg-slate-800/80 hover:text-white'}`}>
            <MessageSquare size={17} />
            AI Query Assistant
          </NavLink>
          <NavLink to="/graph" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-company-teal text-white shadow-sm' : 'hover:bg-slate-800/80 hover:text-white'}`}>
            <Network size={17} />
            Knowledge Graph (658 Edges)
          </NavLink>
          <NavLink to="/qa" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-company-teal text-white shadow-sm' : 'hover:bg-slate-800/80 hover:text-white'}`}>
            <Sparkles size={17} className="text-amber-400" />
            145 Golden Q&A Benchmarks
          </NavLink>
          
          <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            6 Business Domains
          </div>
          <div className="space-y-0.5">
            {DEPARTMENTS.map((dept) => (
              <NavLink 
                key={dept}
                to={`/department/${encodeURIComponent(dept)}`} 
                className={({isActive}) => `flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors ${isActive ? 'bg-slate-800 text-company-teal font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                <span className="truncate">{dept}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">
                  {domainCounts[dept] || 1}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
        
        <div className="p-3 border-t border-slate-700/60 bg-slate-900/40">
          <NavLink to="/admin" className={({isActive}) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-slate-800 text-company-teal' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Settings size={16} />
            Admin & Data Sources
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              AutoNova Group • Hackathon Edition
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Sync Graph'}
            </button>
            
            {refreshSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <CheckCircle size={13} /> Graph Synchronized
              </span>
            )}

            <div className="h-4 w-px bg-slate-200"></div>

            {/* Persona Switcher Component */}
            <PersonaSwitcher />
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

import React from 'react';
import { usePersona } from '../hooks/usePersona';
import { PERSONAS } from '../utils/constants';
import { UserCheck } from 'lucide-react';

const PersonaSwitcher = () => {
  const { persona, setPersona } = usePersona();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
        <UserCheck size={14} className="text-company-teal" />
        Role:
      </div>
      <select
        id="persona-select"
        value={persona}
        onChange={(e) => setPersona(e.target.value)}
        className="text-xs border border-slate-300 rounded-md py-1 px-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-company-teal focus:border-company-teal text-slate-800 font-semibold cursor-pointer"
      >
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PersonaSwitcher;

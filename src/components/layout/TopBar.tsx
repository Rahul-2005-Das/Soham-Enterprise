import React from 'react';
import { Phone, Clock, AlertCircle } from 'lucide-react';
import { COMPANY_INFO } from '../../data/mockData';

export const TopBar: React.FC = () => {
  return (
    <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span>Support:</span>
            <strong className="text-white font-semibold">{COMPANY_INFO.phone}</strong>
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{COMPANY_INFO.workingHours}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800/50">
            <AlertCircle className="w-3 h-3 text-sky-400" />
            <span>Emergency 2-Hour Service Available</span>
          </span>
          <span className="hidden lg:inline text-slate-400">
            Warranty on all genuine parts & repairs
          </span>
        </div>
      </div>
    </div>
  );
};

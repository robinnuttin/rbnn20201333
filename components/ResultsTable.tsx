
import React from 'react';
import { Lead } from '../types';

interface Props {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const ResultsTable: React.FC<Props> = ({ leads, onLeadClick }) => {
  if (leads.length === 0) return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white mx-6 rounded-2xl border border-slate-200 border-dashed">
        <p className="font-medium text-xs">Geen leads gevonden.</p>
      </div>
  );

  return (
    <div className="mx-6 pb-8 mt-4">
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-4 w-48">Bedrijf</th>
                <th className="p-4">Strategisch Offer</th>
                <th className="p-4">Beslissingsnemer</th>
                <th className="p-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-slate-50">
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => onLeadClick?.(lead)}
                  className="hover:bg-slate-50/50 transition-colors align-top cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{lead.companyName}</div>
                    <div className="text-[9px] text-blue-500 font-bold uppercase mt-1 tracking-tighter">{lead.sector}</div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border mb-1.5 inline-block ${
                        lead.crescoProfile === 'domination' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        lead.crescoProfile === 'multiplier' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                        {lead.crescoProfile || 'Target'}
                    </span>
                    <p className="text-[10px] text-slate-500 italic leading-tight line-clamp-2">"{lead.analysis.offerReason}"</p>
                  </td>
                  <td className="p-4">
                      <div className="font-bold text-slate-800">{lead.ceoName || 'Zoeken...'}</div>
                      <div className="text-slate-400 mt-1">{lead.ceoPhone || lead.phoneCompany || 'Geen nr'}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${lead.confidenceScore}%` }}></div>
                      </div>
                      <span className="font-black text-blue-600">{lead.confidenceScore}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;

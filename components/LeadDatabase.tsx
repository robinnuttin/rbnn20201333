
import React, { useState, useMemo } from 'react';
import { Lead, PipelineStatus } from '../types';
import LeadDetailModal from './LeadDetailModal';

interface Props {
  allLeads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void | Promise<void>;
  onLeadClick?: (lead: Lead) => void;
  onManualImport?: (leads: Partial<Lead>[]) => void;
}

const LeadDatabase: React.FC<Props> = ({ allLeads, onUpdateLeads, onLeadClick, onManualImport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return allLeads.filter(l => {
      return searchTerm === '' || 
        l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.ceoName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.sector.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));
  }, [allLeads, searchTerm]);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newLeadsToEnrich: Partial<Lead>[] = [];
      
      lines.slice(1).forEach(line => {
        const cols = line.split(',');
        if (cols.length < 4) return;
        
        // Minimale data nodig voor de Neural Engine om te starten
        newLeadsToEnrich.push({
          id: `imp-${Math.random().toString(36).substr(2, 9)}`,
          companyName: cols[0].trim(),
          sector: cols[1]?.trim() || 'Unknown',
          city: cols[2]?.trim() || '',
          website: cols[3]?.trim() || '',
          ceoName: cols[4]?.trim() || '',
          scrapedAt: new Date().toISOString(),
          pipelineTag: 'cold',
          interactions: []
        });
      });

      if (onManualImport) {
        onManualImport(newLeadsToEnrich);
        alert(`${newLeadsToEnrich.length} leads toegevoegd aan de Neural Audit wachtrij. De AI verrijkt deze nu in de achtergrond.`);
      }
    };
    reader.readAsText(file);
  };

  const downloadFilteredCSV = () => {
    const headers = ["Bedrijfsnaam", "Sector", "Stad", "Website", "Zaakvoerder", "CEO Email", "CEO Telefoon", "Website Score", "Outbound Kanaal"];
    const rows = filteredLeads.map(l => [
      l.companyName, l.sector, l.city, l.website, l.ceoName, l.ceoEmail, l.ceoPhone, l.analysis.websiteScore, l.outboundChannel
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crescoflow_database_v27_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-10 lg:p-16 bg-white border-b border-slate-200 shadow-xl space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
          <div className="space-y-4">
            <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Global Archive</h2>
            <div className="flex gap-4">
               <label className="bg-slate-900 text-white px-10 py-6 rounded-[40px] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl cursor-pointer hover:bg-blue-600 transition-all active:scale-95">
                 IMPORT CSV FOR AUDIT
                 <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
               </label>
               <button onClick={downloadFilteredCSV} className="bg-blue-600 text-white px-10 py-6 rounded-[40px] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95">EXPORT ASSETS</button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-end w-full lg:w-auto">
             <div className="relative w-full md:w-[500px]">
                <input 
                  type="text" 
                  placeholder="ZOEK IN NEURAL DATABASE..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border-4 border-slate-50 p-6 rounded-[35px] font-black text-[11px] uppercase tracking-widest outline-none focus:border-blue-600 transition-all shadow-inner"
                />
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-16 custom-scrollbar pb-64">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
           {filteredLeads.map(lead => (
             <div 
               key={lead.id} 
               onClick={() => onLeadClick ? onLeadClick(lead) : setSelectedLead(lead)} 
               className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-2xl hover:shadow-blue-600/10 transition-all cursor-pointer group flex flex-col justify-between h-[500px] relative overflow-hidden group ring-0 hover:ring-[12px] hover:ring-blue-50/50"
             >
                {lead.ghlSynced && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-8 py-2 rotate-45 translate-x-6 translate-y-3 shadow-xl">Synced</div>}
                <div className="space-y-8">
                   <div className="flex justify-between items-start">
                      <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md ${lead.outboundChannel === 'coldcall' ? 'bg-red-500 text-white' : lead.outboundChannel === 'coldsms' ? 'bg-amber-500 text-slate-900' : 'bg-blue-600 text-white'}`}>
                        {lead.outboundChannel}
                      </span>
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        {lead.confidenceScore}% Valid
                      </div>
                   </div>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none group-hover:text-blue-600 transition-colors">{lead.companyName}</h3>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lead.city} • {lead.sector}</div>
                   
                   <div className="pt-6 space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <span>Web Integrity</span>
                         <span className="text-blue-600">{lead.analysis?.websiteScore || 0}/10</span>
                      </div>
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                         <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000" style={{ width: `${(lead.analysis?.websiteScore || 0) * 10}%` }}></div>
                      </div>
                   </div>

                   <div className="text-[10px] text-slate-400 font-bold uppercase truncate">
                      🔗 {lead.website || 'Geen website gevonden'}
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-50 flex justify-between items-center">
                   <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Decision Maker</div>
                      <div className="text-lg font-black text-slate-900 italic uppercase">{lead.ceoName || 'Zoeken...'}</div>
                   </div>
                   <div className="bg-slate-50 w-16 h-16 rounded-[25px] flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner text-2xl">→</div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdateLead={(updated) => {
            onUpdateLeads([updated]);
            setSelectedLead(updated);
          }} 
        />
      )}
    </div>
  );
};

export default LeadDatabase;

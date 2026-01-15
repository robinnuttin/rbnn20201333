
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';

interface Props {
  leads: Lead[];
  scripts: {id: string, title: string, content: string, type: string}[];
  setScripts: React.Dispatch<React.SetStateAction<any[]>>;
  onUpdateLeads: (updated: Lead[]) => void;
  onLeadClick: (lead: Lead) => void;
}

const ColdCallCenter: React.FC<Props> = ({ leads, scripts, setScripts, onUpdateLeads, onLeadClick }) => {
  const [activeTab, setActiveTab] = useState<'rooster' | 'scripts' | 'analytics'>('rooster');
  const [newScript, setNewScript] = useState({ title: '', content: '' });

  const callQueue = useMemo(() => {
    return leads
      .filter(l => l.outboundChannel === 'coldcall' && l.pipelineTag === 'cold')
      .slice(0, 25);
  }, [leads]);

  const callScripts = useMemo(() => scripts.filter(s => s.type === 'call'), [scripts]);

  const handleAddScript = () => {
    if (!newScript.title || !newScript.content) return;
    setScripts(prev => [...prev, { ...newScript, id: Date.now().toString(), type: 'call' }]);
    setNewScript({ title: '', content: '' });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-10 lg:p-16 bg-white border-b border-slate-200 shadow-xl flex justify-between items-end">
        <div className="space-y-4">
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Cold Call Matrix</h2>
          <div className="flex gap-10 mt-6">
            <button onClick={() => setActiveTab('rooster')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'rooster' ? 'text-red-500 border-red-500' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>Dagschema (Max 25)</button>
            <button onClick={() => setActiveTab('scripts')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'scripts' ? 'text-red-500 border-red-500' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>Script Library</button>
            <button onClick={() => setActiveTab('analytics')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'analytics' ? 'text-red-500 border-red-500' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>Analytics</button>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-10 py-6 rounded-[40px] shadow-2xl flex items-center gap-10">
           <div className="text-right">
              <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Slots Over</div>
              <div className="text-3xl font-black italic">{25 - callQueue.filter(l => l.interactions.length > 0).length} / 25</div>
           </div>
           <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-red-500/20">📞</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar pb-64">
        {activeTab === 'rooster' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {callQueue.map((lead, i) => (
              <div key={lead.id} onClick={() => onLeadClick(lead)} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-2xl flex items-center justify-between group cursor-pointer hover:border-red-500 transition-all relative ring-0 hover:ring-8 hover:ring-red-50/30">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center font-black italic text-xl shadow-xl">{i + 1}</div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none group-hover:text-red-600 transition-colors">{lead.companyName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{lead.ceoName || 'Zoeken...'} • {lead.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-right hidden md:block">
                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Web Score</div>
                    <div className="text-lg font-black text-red-500 italic">{lead.analysis.websiteScore}/10</div>
                  </div>
                  <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-2xl group-hover:bg-red-500 group-hover:text-white transition-all shadow-inner">→</div>
                </div>
              </div>
            ))}
            {callQueue.length === 0 && (
              <div className="py-32 text-center opacity-20 space-y-6">
                <div className="text-9xl">🔇</div>
                <p className="text-2xl font-black uppercase tracking-[0.5em] italic">Geen leads in wachtrij</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
             <div className="bg-white p-14 rounded-[70px] shadow-3xl border border-slate-100 space-y-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Nieuw Call Script Toevoegen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <input 
                     type="text" 
                     placeholder="Script Titel (bv. Bezwaren-handling)" 
                     value={newScript.title}
                     onChange={e => setNewScript({...newScript, title: e.target.value})}
                     className="bg-slate-50 p-6 rounded-[30px] font-bold outline-none border-2 border-transparent focus:border-red-500 transition-all"
                   />
                   <button onClick={handleAddScript} className="bg-red-500 text-white rounded-[30px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-900 transition-all">Script Opslaan</button>
                </div>
                <textarea 
                  placeholder="Typ hier je script... Gebruik {{ceo_name}} voor personalisatie." 
                  value={newScript.content}
                  onChange={e => setNewScript({...newScript, content: e.target.value})}
                  className="w-full h-48 bg-slate-50 p-8 rounded-[40px] font-medium text-slate-700 outline-none border-2 border-transparent focus:border-red-500 transition-all resize-none"
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {callScripts.map(script => (
                  <div key={script.id} className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden group">
                     <div className="flex justify-between items-center">
                        <h4 className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter">{script.title}</h4>
                        <button onClick={() => setScripts(prev => prev.filter(s => s.id !== script.id))} className="text-slate-200 hover:text-red-500 transition-all">✕</button>
                     </div>
                     <p className="text-sm text-slate-500 leading-relaxed italic">"{script.content}"</p>
                     <button className="w-full py-4 bg-slate-50 rounded-full text-[9px] font-black uppercase text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all">Script Gebruiken</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { label: 'Connect Rate', val: '42%', color: 'text-red-500' },
                  { label: 'Booking Rate', val: '8.4%', color: 'text-emerald-500' },
                  { label: 'Follow-ups', val: '124', color: 'text-blue-500' }
                ].map((kpi, i) => (
                  <div key={i} className="bg-white p-14 rounded-[70px] shadow-3xl border border-slate-100 text-center space-y-4">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                     <div className={`text-7xl font-black italic tracking-tighter ${kpi.color}`}>{kpi.val}</div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdCallCenter;

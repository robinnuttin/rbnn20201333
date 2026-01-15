
import React, { useState, useMemo } from 'react';
import { Lead, AnalyticsPeriod } from '../types';

interface Props {
  allLeads: Lead[];
  scripts: {id: string, title: string, content: string, type: string}[];
  setScripts: React.Dispatch<React.SetStateAction<any[]>>;
  onUpdateLeads: (updated: Lead[]) => void;
  onLeadClick: (lead: Lead) => void;
}

const EmailOutreach: React.FC<Props> = ({ allLeads, scripts, setScripts, onUpdateLeads, onLeadClick }) => {
  const [activeTab, setActiveTab] = useState<'outreach' | 'scripts' | 'analytics'>('outreach');
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [newEmailScript, setNewEmailScript] = useState({ title: '', content: '' });

  const chartData = useMemo(() => [
    { label: 'Ma', val: 145 }, { label: 'Di', val: 190 }, { label: 'Wo', val: 260 },
    { label: 'Do', val: 210 }, { label: 'Vr', val: 160 }, { label: 'Za', val: 70 }, { label: 'Zo', val: 45 }
  ], []);

  const pendingEmails = useMemo(() => 
    allLeads.filter(l => l.outboundChannel === 'coldemail' && l.pipelineTag === 'cold'), 
  [allLeads]);

  const emailScripts = useMemo(() => scripts.filter(s => s.type === 'email'), [scripts]);

  const handleAddScript = () => {
    if (!newEmailScript.title || !newEmailScript.content) return;
    setScripts(prev => [...prev, { ...newEmailScript, id: Date.now().toString(), type: 'email' }]);
    setNewEmailScript({ title: '', content: '' });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-10 lg:p-16 bg-white border-b border-slate-200 shadow-xl flex justify-between items-end">
        <div className="space-y-4">
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Email Command</h2>
          <div className="flex gap-10 mt-6">
            <button onClick={() => setActiveTab('outreach')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'outreach' ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>Outreach</button>
            <button onClick={() => setActiveTab('scripts')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'scripts' ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>Campagnes</button>
            <button onClick={() => setActiveTab('analytics')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'analytics' ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>Analytics</button>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-10 py-6 rounded-[40px] shadow-2xl flex items-center gap-10">
           <div className="text-right">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Queue Health</div>
              <div className="text-3xl font-black italic">{pendingEmails.length} Ready</div>
           </div>
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">📧</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar pb-64">
        {activeTab === 'outreach' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
             <div className="bg-white p-12 rounded-[70px] border border-slate-100 shadow-2xl space-y-10">
                <div className="flex justify-between items-center px-6">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Verzendklaar (Neural Validated)</h3>
                   <button className="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 transition-all">Launch Email Blitz 🔥</button>
                </div>
                <div className="grid gap-6">
                   {pendingEmails.map(lead => (
                     <div key={lead.id} onClick={() => onLeadClick(lead)} className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex justify-between items-center group cursor-pointer hover:border-blue-600 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">✉️</div>
                           <div>
                              <div className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter leading-none">{lead.companyName}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{lead.ceoEmail || 'Zoeken...'}</div>
                           </div>
                        </div>
                        <button className="bg-white border-4 border-slate-900 text-slate-900 px-8 py-4 rounded-[25px] font-black text-[10px] uppercase shadow-md group-hover:bg-slate-900 group-hover:text-white transition-all">Review Copy</button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
             <div className="bg-white p-14 rounded-[70px] shadow-3xl border border-slate-100 space-y-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Nieuwe E-mailcampagne</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <input 
                     type="text" 
                     placeholder="Campagne Naam (bv. Dakwerkers Pitch)" 
                     value={newEmailScript.title}
                     onChange={e => setNewEmailScript({...newEmailScript, title: e.target.value})}
                     className="bg-slate-50 p-6 rounded-[30px] font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all"
                   />
                   <button onClick={handleAddScript} className="bg-blue-600 text-white rounded-[30px] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-900 transition-all">Campagne Opslaan</button>
                </div>
                <textarea 
                  placeholder="Inhoud van de email... Gebruik {{company_name}} voor personalisatie." 
                  value={newEmailScript.content}
                  onChange={e => setNewEmailScript({...newEmailScript, content: e.target.value})}
                  className="w-full h-48 bg-slate-50 p-8 rounded-[40px] font-medium text-slate-700 outline-none border-2 border-transparent focus:border-blue-500 transition-all resize-none"
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {emailScripts.map(script => (
                  <div key={script.id} className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-6">
                     <div className="flex justify-between items-center">
                        <h4 className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter">{script.title}</h4>
                        <button onClick={() => setScripts(prev => prev.filter(s => s.id !== script.id))} className="text-slate-200 hover:text-red-500">✕</button>
                     </div>
                     <p className="text-sm text-slate-500 italic">"{script.content}"</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
             <div className="bg-slate-900 p-20 rounded-[100px] shadow-4xl text-white space-y-16 border-b-[30px] border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 text-[180px] font-black opacity-5 italic grayscale pointer-events-none uppercase">EMAIL</div>
                <div className="h-80 flex items-end justify-between px-10 gap-8 relative z-10">
                   {chartData.map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-8 group">
                        <div className="text-blue-400 font-black text-xl italic opacity-0 group-hover:opacity-100 transition-all transform -translate-y-4">{d.val}</div>
                        <div className="w-full bg-blue-600 rounded-t-[30px] transition-all duration-700 hover:brightness-125 shadow-[0_0_30px_rgba(37,99,235,0.3)]" style={{ height: `${(d.val / 300) * 100}%` }}></div>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{d.label}</span>
                     </div>
                   ))}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { label: 'Open Rate', val: '84.2%', color: 'text-emerald-500' },
                  { label: 'Reply Rate', val: '12.8%', color: 'text-blue-500' },
                  { label: 'Meetings', val: '32', color: 'text-amber-500' }
                ].map((kpi, i) => (
                  <div key={i} className="bg-white p-14 rounded-[70px] shadow-3xl border border-slate-100 text-center">
                     <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">{kpi.label}</div>
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

export default EmailOutreach;

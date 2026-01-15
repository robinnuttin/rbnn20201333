
import React, { useState, useMemo } from 'react';
import { Lead, AnalyticsPeriod } from '../types';

interface Props {
  leads: Lead[];
  scripts: {id: string, title: string, content: string, type: string}[];
  setScripts: React.Dispatch<React.SetStateAction<any[]>>;
  onUpdateLeads: (updatedLeads: Lead[]) => void;
  onLeadClick?: (lead: Lead) => void;
}

const SMSInbox: React.FC<Props> = ({ leads, scripts, setScripts, onUpdateLeads, onLeadClick }) => {
  const [activeTab, setActiveTab] = useState<'outreach' | 'launch' | 'scripts' | 'analytics'>('outreach');
  const [prompt, setPrompt] = useState('');
  const [newSmsScript, setNewSmsScript] = useState({ title: '', content: '' });

  const pendingSMS = useMemo(() => 
    leads.filter(l => l.outboundChannel === 'coldsms' && l.pipelineTag === 'cold'), 
  [leads]);

  const smsScripts = useMemo(() => scripts.filter(s => s.type === 'sms'), [scripts]);

  const handleAddScript = () => {
    if (!newSmsScript.title || !newSmsScript.content) return;
    setScripts(prev => [...prev, { ...newSmsScript, id: Date.now().toString(), type: 'sms' }]);
    setNewSmsScript({ title: '', content: '' });
  };

  const handleLaunchBlitz = () => {
    alert(`SMS Blitz gelanceerd voor ${pendingSMS.length} leads met prompt: "${prompt}"`);
    setPrompt('');
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="p-10 lg:p-16 bg-white border-b border-slate-200 shadow-xl flex justify-between items-end">
        <div className="space-y-4">
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">SMS Command</h2>
          <div className="flex gap-8 mt-6">
            <button onClick={() => setActiveTab('outreach')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'outreach' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Wachtrij</button>
            <button onClick={() => setActiveTab('launch')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'launch' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Launch Pad</button>
            <button onClick={() => setActiveTab('scripts')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'scripts' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Scripts</button>
            <button onClick={() => setActiveTab('analytics')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'analytics' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Analytics</button>
          </div>
        </div>
        <div className="bg-amber-500 text-slate-900 px-10 py-6 rounded-[40px] shadow-2xl flex items-center gap-10 font-black italic">
           <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Avg Response</div>
              <div className="text-3xl tracking-tighter">32%</div>
           </div>
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl">💬</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar pb-64">
        {activeTab === 'outreach' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            {pendingSMS.map(lead => (
              <div key={lead.id} onClick={() => onLeadClick?.(lead)} className="p-10 bg-white rounded-[50px] border border-slate-100 flex justify-between items-center group cursor-pointer hover:border-amber-500 transition-all shadow-xl">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">📱</div>
                  <div>
                    <div className="font-black text-2xl text-slate-900 uppercase italic leading-none">{lead.companyName}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">{lead.ceoPhone || 'Geen nr'}</div>
                  </div>
                </div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-3xl text-[10px] font-black uppercase">Bericht Sturen</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'launch' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn">
             <div className="bg-slate-900 p-16 rounded-[80px] shadow-4xl text-white space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-8xl grayscale italic">BLITZ</div>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter">Bulk Launch Command</h3>
                <p className="text-slate-400 text-lg font-medium max-w-2xl">Plak hier je prompt of custom bericht. De AI zal dit personaliseren voor de geselecteerde batch leads.</p>
                <textarea 
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Typ je Blitz bericht..."
                  className="w-full h-48 bg-white/5 border-2 border-white/10 p-10 rounded-[50px] text-xl font-black italic text-blue-400 outline-none focus:border-amber-500 transition-all resize-none"
                />
                <button onClick={handleLaunchBlitz} className="w-full py-8 bg-amber-500 text-slate-900 rounded-[50px] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-white transition-all">Launch SMS Blitz 🚀</button>
             </div>
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn">
             <div className="bg-white p-14 rounded-[70px] shadow-3xl border border-slate-100 space-y-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nieuw SMS Script</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <input type="text" placeholder="Script Naam" value={newSmsScript.title} onChange={e => setNewSmsScript({...newSmsScript, title: e.target.value})} className="bg-slate-50 p-6 rounded-3xl font-bold outline-none" />
                   <button onClick={handleAddScript} className="bg-amber-500 text-white rounded-3xl font-black uppercase text-[10px]">Script Opslaan</button>
                </div>
                <textarea value={newSmsScript.content} onChange={e => setNewSmsScript({...newSmsScript, content: e.target.value})} className="w-full h-32 bg-slate-50 p-6 rounded-3xl font-medium resize-none outline-none" placeholder="SMS inhoud..." />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {smsScripts.map(s => (
                  <div key={s.id} className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100">
                    <h4 className="font-black text-xl mb-4 italic uppercase">{s.title}</h4>
                    <p className="text-sm text-slate-500 italic">"{s.content}"</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                {[
                  { label: 'Sent', val: '520', color: 'bg-slate-900' },
                  { label: 'Delivered', val: '512', color: 'bg-blue-600' },
                  { label: 'Replied', val: '184', color: 'bg-amber-500' },
                  { label: 'Interested', val: '42', color: 'bg-emerald-500' }
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center gap-6">
                     <div className="h-80 w-full bg-slate-50 rounded-[40px] relative overflow-hidden flex flex-col justify-end">
                        <div className={`${bar.color} w-full`} style={{ height: `${(parseInt(bar.val) / 600) * 100}%` }}></div>
                     </div>
                     <div className="text-center font-black uppercase italic tracking-tighter">
                        <div className="text-[10px] text-slate-400">{bar.label}</div>
                        <div className="text-2xl">{bar.val}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSInbox;

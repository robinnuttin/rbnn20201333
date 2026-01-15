
import React, { useState, useMemo } from 'react';
import { EmailAccount, AnalyticsPeriod, Lead } from '../types';

// Fix: Defined Props interface for EmailInbox to match its usage in App.tsx
interface Props {
  leads: Lead[];
  onUpdateLeads: (updatedLeads: Lead[]) => void;
}

const EmailInbox: React.FC<Props> = ({ leads, onUpdateLeads }) => {
  const [activeTab, setActiveTab] = useState<'overzicht' | 'instellingen' | 'archief'>('overzicht');
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const accounts: EmailAccount[] = [
    { id: '1', email: 'sales@crescoflow.be', provider: 'ghl', status: 'gezond', dailyLimit: 50, sentToday: 12 },
    { id: '2', email: 'outreach@crescoflow.be', provider: 'instantly', status: 'gezond', dailyLimit: 150, sentToday: 85 }
  ];

  const chartData = [
    { dag: 'Ma', volume: 245 }, { dag: 'Di', volume: 310 }, { dag: 'Wo', volume: 280 },
    { dag: 'Do', volume: 420 }, { dag: 'Vr', volume: 390 }, { dag: 'Za', volume: 110 }, { dag: 'Zo', volume: 85 }
  ];

  return (
    <div className="p-10 lg:p-20 bg-slate-50 min-h-screen overflow-y-auto pb-64 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex justify-between items-end border-b border-slate-200 pb-12">
          <div className="space-y-4">
            <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Email Outreach</h2>
            <div className="flex gap-10">
              {['overzicht', 'instellingen', 'archief'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-3 border-b-4 transition-all ${activeTab === t ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex bg-white p-2 rounded-full border border-slate-200">
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => setPeriod(p as any)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all ${period === p ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>{p}</button>
              ))}
          </div>
        </div>

        {activeTab === 'overzicht' && (
          <div className="animate-fadeIn space-y-16">
             {/* Grafiek */}
             <div className="bg-white p-16 rounded-[80px] shadow-3xl border border-slate-100 space-y-12">
                <div className="flex justify-between items-center px-10">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Volume per Dag ({period})</h3>
                   <div className="text-3xl font-black text-slate-900 italic">Totaal: 1,840</div>
                </div>
                <div className="h-64 flex items-end justify-between px-10 gap-6">
                   {chartData.map((d, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-6 group">
                        <div className="text-[10px] font-black text-blue-600 opacity-0 group-hover:opacity-100 transition-all">{d.volume}</div>
                        <div className="w-full bg-blue-600 rounded-t-3xl transition-all hover:brightness-110 shadow-lg" style={{ height: `${d.volume / 2}px` }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{d.dag}</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Actieve Accounts */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl flex justify-between items-center group">
                     <div className="flex items-center gap-6">
                        <div className={`w-4 h-4 rounded-full ${acc.status === 'gezond' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                        <div>
                           <div className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{acc.email}</div>
                           <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{acc.provider} • Gezondheid: 100%</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Limit</div>
                        <div className="text-xl font-black text-slate-900">{acc.sentToday} / {acc.dailyLimit}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'instellingen' && (
          <div className="max-w-4xl mx-auto bg-white p-20 rounded-[80px] shadow-3xl space-y-12">
             <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter text-center">Account Beheer</h3>
             <div className="space-y-6">
                <button className="w-full bg-slate-50 border-4 border-dashed border-slate-200 p-12 rounded-[50px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all">+ Nieuw E-mailaccount Koppelen</button>
                <div className="p-10 bg-blue-50 rounded-[50px] border border-blue-100 space-y-6">
                   <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Distributie Logica</h4>
                   <p className="text-sm font-bold text-slate-700 italic">"Email volume wordt automatisch verdeeld over gezonde inboxen om de zender-reputatie te beschermen."</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailInbox;

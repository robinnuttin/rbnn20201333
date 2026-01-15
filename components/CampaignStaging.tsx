
import React, { useMemo, useState } from 'react';
import { Lead, OutboundChannel } from '../types';

interface Props {
  leads: Lead[];
  onUpdateLeads: (updated: Lead[]) => void;
}

const CampaignStaging: React.FC<Props> = ({ leads, onUpdateLeads }) => {
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = useMemo(() => {
    // Fix: Using scheduledDate instead of non-existent scheduledFor
    const call = leads.filter(l => l.outboundChannel === 'coldcall' && !l.scheduledDate);
    const sms = leads.filter(l => l.outboundChannel === 'coldsms' && !l.scheduledDate);
    const email = leads.filter(l => l.outboundChannel === 'coldemail' && !l.scheduledDate);
    
    const scheduledToday = leads.filter(l => l.scheduledDate === activeDate);
    
    return { call, sms, email, scheduledToday };
  }, [leads, activeDate]);

  const handleScheduleBatch = (channel: OutboundChannel, limit: number) => {
    // Fix: Using scheduledDate instead of non-existent scheduledFor
    const available = leads.filter(l => l.outboundChannel === channel && !l.scheduledDate);
    const batch = available.sort((a,b) => b.confidenceScore - a.confidenceScore).slice(0, limit);
    
    if (batch.length === 0) return;

    const updated = leads.map(l => {
      if (batch.some(b => b.id === l.id)) {
        // Fix: Using scheduledDate instead of non-existent scheduledFor
        return { ...l, scheduledDate: activeDate, pipelineTag: 'sent' as any };
      }
      return l;
    });

    onUpdateLeads(updated);
    alert(`${batch.length} leads ingepland voor ${channel} op ${activeDate}.`);
  };

  return (
    <div className="p-10 lg:p-20 space-y-16 bg-slate-50 h-full overflow-y-auto pb-64 custom-scrollbar">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
        <div className="space-y-4">
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Dispatcher Board</h2>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.6em] ml-4">Capacity Management: 75 / 75 / 300 Caps</p>
        </div>
        <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-xl flex items-center gap-6">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Schedule</span>
           <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} className="bg-slate-50 border-none outline-none font-black text-sm uppercase px-4 py-2 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* COLD CALLS */}
        <div className="bg-white p-12 rounded-[60px] shadow-3xl border-b-[20px] border-red-500 space-y-10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 text-[100px] opacity-5 font-black grayscale italic">CALL</div>
           <div className="flex justify-between items-start relative z-10">
              <div className="text-5xl">📞</div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase">Wachtrij</div>
                <div className="text-4xl font-black">{categories.call.length}</div>
              </div>
           </div>
           <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Telemarketing</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Max 75 / dag • Hoogste ROI Focus</p>
           </div>
           <button 
             onClick={() => handleScheduleBatch('coldcall', 75)}
             className="w-full bg-slate-900 text-white py-6 rounded-[35px] font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl"
           >
             VERDEEL BATCH (75)
           </button>
        </div>

        {/* SMS OUTREACH */}
        <div className="bg-white p-12 rounded-[60px] shadow-3xl border-b-[20px] border-amber-500 space-y-10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 text-[100px] opacity-5 font-black grayscale italic">SMS</div>
           <div className="flex justify-between items-start relative z-10">
              <div className="text-5xl">💬</div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase">Wachtrij</div>
                <div className="text-4xl font-black">{categories.sms.length}</div>
              </div>
           </div>
           <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">SMS Outreach</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Max 75 / dag • Snelle Conversie</p>
           </div>
           <button 
             onClick={() => handleScheduleBatch('coldsms', 75)}
             className="w-full bg-slate-900 text-white py-6 rounded-[35px] font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl"
           >
             VERDEEL BATCH (75)
           </button>
        </div>

        {/* EMAIL OUTREACH */}
        <div className="bg-white p-12 rounded-[60px] shadow-3xl border-b-[20px] border-blue-600 space-y-10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 text-[100px] opacity-5 font-black grayscale italic">MAIL</div>
           <div className="flex justify-between items-start relative z-10">
              <div className="text-5xl">📧</div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase">Wachtrij</div>
                <div className="text-4xl font-black">{categories.email.length}</div>
              </div>
           </div>
           <div className="relative z-10">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Email Automatisatie</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Max 300 / dag • High Volume</p>
           </div>
           <button 
             onClick={() => handleScheduleBatch('coldemail', 300)}
             className="w-full bg-slate-900 text-white py-6 rounded-[35px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
           >
             VERDEEL BATCH (300)
           </button>
        </div>

      </div>

      {/* TODAY'S PLAN */}
      <div className="bg-white p-16 rounded-[80px] shadow-2xl border border-slate-100 space-y-10">
         <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] ml-6">Vandaag Ingepland ({categories.scheduledToday.length})</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.scheduledToday.map(l => (
              <div key={l.id} className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 flex justify-between items-center group">
                 <div>
                    <div className="font-black text-slate-900 text-sm truncate w-40">{l.companyName}</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase mt-1">{l.outboundChannel} • Score {l.confidenceScore}%</div>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] bg-white shadow-sm border border-slate-100`}>
                    {l.outboundChannel === 'coldcall' ? '📞' : l.outboundChannel === 'coldsms' ? '💬' : '📧'}
                 </div>
              </div>
            ))}
            {categories.scheduledToday.length === 0 && (
              <p className="col-span-full py-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Nog geen batches verwerkt voor vandaag.</p>
            )}
         </div>
      </div>
    </div>
  );
};

export default CampaignStaging;

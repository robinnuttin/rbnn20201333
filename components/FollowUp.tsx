
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, PipelineStatus } from '../types';

interface Props {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  // Added missing onLeadClick prop to fix TypeScript error in App.tsx
  onLeadClick?: (lead: Lead) => void;
}

const FollowUp: React.FC<Props> = ({ leads, onUpdateLeads, onLeadClick }) => {
  const [activePipeline, setActivePipeline] = useState<'outreach' | 'recovery' | 'sales'>('outreach');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const identifyIntents = () => {
      let changed = false;
      const updatedLeads = leads.map(l => {
        const lastInteraction = l.interactions[l.interactions.length - 1];
        const now = new Date().getTime();
        const lastTime = lastInteraction ? new Date(lastInteraction.timestamp).getTime() : 0;
        const daysSinceLast = (now - lastTime) / (1000 * 60 * 60 * 24);

        if (l.pipelineTag === 'appointment_booked' && l.scheduledDate && new Date(l.scheduledDate).getTime() < now && (!lastInteraction || lastTime < new Date(l.scheduledDate).getTime())) {
          changed = true;
          return { ...l, pipelineTag: 'no_show' as PipelineStatus };
        }

        if ((l.pipelineTag === 'cold' || (l.pipelineTag as string) === 'no_show') && daysSinceLast > 30) {
          changed = true;
          return { ...l, pipelineTag: 'reactivation' as PipelineStatus };
        }

        if (l.pipelineTag === 'replied' && l.interactions.length >= 3) {
          changed = true;
          return { ...l, pipelineTag: 'hot' as PipelineStatus };
        }

        return l;
      });

      if (changed) {
        onUpdateLeads(updatedLeads);
      }
    };

    const timer = setTimeout(identifyIntents, 2000);
    return () => clearTimeout(timer);
  }, [leads]);

  const pipelines = {
    outreach: {
      label: 'Outreach Pipeline',
      stages: [
        { id: 'sent', label: 'Wacht op antwoord', icon: '⏳', color: 'bg-slate-400' },
        { id: 'replied', label: 'Beantwoord', icon: '📧', color: 'bg-blue-500' },
        { id: 'warm', label: 'Warme interesse', icon: '🔥', color: 'bg-amber-500' },
        { id: 'hot', label: 'High Intent (Klaar!)', icon: '💎', color: 'bg-emerald-500' }
      ]
    },
    recovery: {
      label: 'Recovery & Ghosting',
      stages: [
        { id: 'no_show', label: 'No Show', icon: '👻', color: 'bg-red-400' },
        { id: 'not_interested', label: 'Geen interesse', icon: '🛑', color: 'bg-slate-600' },
        { id: 'reactivation', label: 'Reactivatie Pool', icon: '🔄', color: 'bg-indigo-600' }
      ]
    },
    sales: {
      label: 'Sales & Onboarding',
      stages: [
        { id: 'appointment_booked', label: 'Call Ingepland', icon: '📅', color: 'bg-blue-600' },
        { id: 'pending', label: 'Follow-up na Call', icon: '📞', color: 'bg-amber-600' },
        { id: 'closed', label: 'Actieve Klant 🏆', icon: '🏆', color: 'bg-emerald-600' }
      ]
    }
  };

  const currentStages = pipelines[activePipeline].stages;

  const categorizedLeads = useMemo(() => {
    return currentStages.map(stage => ({
      ...stage,
      leads: leads.filter(l => l.pipelineTag === stage.id)
    }));
  }, [leads, activePipeline]);

  const handleUpdateStatus = (lead: Lead, status: PipelineStatus) => {
    onUpdateLeads(leads.map(l => l.id === lead.id ? { ...l, pipelineTag: status, lastInteractionDate: new Date().toISOString() } : l));
    setSelectedLead(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-10 lg:p-16 bg-white border-b border-slate-200 shadow-sm space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-6">
             <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Pipeline Engine</h2>
             <div className="flex bg-slate-100 p-2 rounded-full w-fit gap-2 shadow-inner">
                {Object.keys(pipelines).map((key) => (
                  <button key={key} onClick={() => setActivePipeline(key as any)} className={`px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activePipeline === key ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                    {pipelines[key as keyof typeof pipelines].label}
                  </button>
                ))}
             </div>
          </div>
          <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl flex items-center gap-10">
             <div className="text-right">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Neural Intent Detection</div>
                <div className="text-2xl font-black italic">Monitoring 24/7 Active</div>
             </div>
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl animate-pulse shadow-xl shadow-blue-500/20">🛰️</div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL SCROLLBAR IMPLEMENTATION */}
      <div className="flex-1 overflow-x-auto p-10 lg:p-16 custom-scrollbar pb-24">
        <div className="flex gap-10 min-w-max pb-12">
          {categorizedLeads.map(stage => (
            <div key={stage.id} className="w-[450px] flex flex-col gap-8">
              <div className="flex items-center justify-between px-6">
                 <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${stage.color} rounded-[25px] flex items-center justify-center text-3xl shadow-lg rotate-3`}>{stage.icon}</div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{stage.label}</h3>
                 </div>
                 <span className="bg-white px-5 py-2 rounded-full text-[12px] font-black text-slate-400 shadow-sm border border-slate-50">{stage.leads.length}</span>
              </div>

              <div className="flex-1 flex flex-col gap-8">
                 {stage.leads.map(lead => (
                   <div key={lead.id} onClick={() => (onLeadClick ? onLeadClick(lead) : setSelectedLead(lead))} className="bg-white p-12 rounded-[70px] border border-slate-100 shadow-2xl hover:shadow-blue-600/10 transition-all cursor-pointer group space-y-8 relative overflow-hidden">
                      {lead.pipelineTag === 'hot' && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black uppercase px-8 py-2 rotate-45 translate-x-6 translate-y-2">BUYING NOW</div>}
                      <div className="space-y-3">
                         <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors leading-none">{lead.companyName}</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.city} • Last Action: {lead.lastInteractionDate ? new Date(lead.lastInteractionDate).toLocaleDateString('nl-NL') : 'Just Added'}</p>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[45px] border border-slate-100 space-y-4 relative overflow-hidden">
                         <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-3">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Intelligent Recommendation
                         </div>
                         <p className="text-xs font-bold italic text-slate-600 leading-relaxed">
                            {lead.pipelineTag === 'no_show' ? "No-show gedetecteerd. Bel direct om te herschikken." : 
                             lead.pipelineTag === 'hot' ? "Deze lead staat op het punt te kopen. Stuur direct de offerte!" :
                             lead.pipelineTag === 'reactivation' ? "Geen contact in 30 dagen. Stuur een nieuwe 2025 Case Study." :
                             "Plan een korte demo call in om de waarde te tonen."}
                         </p>
                      </div>

                      <div className="flex gap-4">
                         <button className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg hover:bg-emerald-500 transition-all">📞</button>
                         <button className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg hover:bg-amber-500 transition-all">💬</button>
                         <button className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg hover:bg-blue-600 transition-all">📧</button>
                      </div>
                   </div>
                 ))}
                 {stage.leads.length === 0 && <div className="h-64 border-4 border-dashed border-slate-200 rounded-[70px] flex flex-col items-center justify-center text-slate-200 font-black uppercase tracking-widest opacity-30"><span className="text-5xl mb-4">📁</span><span>Stage Empty</span></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[120] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-10 animate-fadeIn">
           <div className="bg-white w-full max-w-6xl rounded-[100px] p-24 space-y-16 relative shadow-4xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>
              <div className="flex justify-between items-center">
                 <div className="space-y-4">
                    <h3 className="text-7xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedLead.companyName}</h3>
                    <p className="text-slate-400 text-sm font-black uppercase tracking-[0.5em] ml-6">{selectedLead.ceoName || 'Beslisser'} • {selectedLead.sector}</p>
                 </div>
                 <button onClick={() => setSelectedLead(null)} className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl hover:bg-red-500 hover:text-white transition-all shadow-inner border border-slate-100">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-20">
                 <div className="bg-slate-50 p-12 rounded-[70px] space-y-10 shadow-inner">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">History Log</h4>
                    <div className="space-y-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                       {selectedLead.interactions.map((it, i) => (
                         <div key={i} className="flex flex-col gap-3 border-l-4 border-blue-600 pl-8 relative">
                            <div className="absolute left-[-8px] top-0 w-3 h-3 bg-blue-600 rounded-full"></div>
                            <div className="text-[10px] font-black text-slate-400 uppercase">{it.type} • {new Date(it.timestamp).toLocaleString('nl-NL')}</div>
                            <p className="text-sm font-bold italic text-slate-700 leading-relaxed">"{it.outcome}"</p>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-12">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-10">Direct Stage Control</h4>
                    <div className="grid grid-cols-2 gap-6">
                       {Object.values(pipelines).flatMap(p => p.stages).map(s => (
                         <button key={s.id} onClick={() => handleUpdateStatus(selectedLead, s.id as PipelineStatus)} className={`p-10 rounded-[50px] border-4 transition-all text-[10px] font-black uppercase tracking-widest text-center shadow-sm ${selectedLead.pipelineTag === s.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 hover:border-blue-100 hover:bg-slate-50'}`}>{s.label}</button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;

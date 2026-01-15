
import React, { useState, useEffect } from 'react';
import { Lead, PipelineStatus, GHLMessage, Interaction } from '../types';
import { fetchGHLMessages, syncToGHL } from '../services/ghlService';
// Fixed: Use correct exported member enrichLeadNeural from geminiService
import { enrichLeadNeural } from '../services/geminiService';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onUpdateLead?: (lead: Lead) => void;
}

const LeadDetailModal: React.FC<Props> = ({ lead, onClose, onUpdateLead }) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'intelligence' | 'timeline'>('dossier');
  const [ghlMessages, setGhlMessages] = useState<GHLMessage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (lead?.ghlContactId) {
      fetchGHLMessages(lead.ghlContactId).then(setGhlMessages);
    }
  }, [lead?.ghlContactId]);

  if (!lead) return null;

  const handleDeepAudit = async () => {
    setIsRefreshing(true);
    // Fixed: Use enrichLeadNeural instead of enrichLead
    const enriched = await enrichLeadNeural(lead);
    onUpdateLead?.(enriched);
    setIsRefreshing(false);
  };

  const handleUpdateStatus = async (status: PipelineStatus) => {
    const updated: Lead = { 
      ...lead, 
      pipelineTag: status, 
      lastInteractionDate: new Date().toISOString(),
      interactions: [
        ...lead.interactions, 
        { 
          id: Math.random().toString(36), 
          type: 'system', 
          timestamp: new Date().toISOString(), 
          outcome: `Status: ${status.toUpperCase()}` 
        } as Interaction
      ] 
    };
    onUpdateLead?.(updated);
    if (lead.ghlSynced) await syncToGHL(updated);
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-900/98 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-10 animate-fadeIn">
      <div className="bg-white w-full max-w-7xl h-[94vh] rounded-[60px] shadow-4xl flex flex-col overflow-hidden relative border border-white/20">
        
        {/* HEADER */}
        <div className="p-10 lg:p-12 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white gap-8 sticky top-0 z-50">
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 bg-slate-900 rounded-[35px] flex items-center justify-center text-4xl shadow-2xl rotate-3 text-white font-black italic">
              {lead.companyName.charAt(0)}
            </div>
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{lead.companyName}</h2>
              <div className="flex items-center gap-6">
                <span className="text-blue-600 font-black uppercase text-[11px] tracking-widest bg-blue-50 px-4 py-1 rounded-full">
                  {lead.sector} • {lead.city}
                </span>
                <span className="text-emerald-500 font-black text-[11px] uppercase tracking-widest">{lead.confidenceScore}% Cloud Match</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="flex bg-slate-100 p-2 rounded-full shadow-inner">
                {['dossier', 'intelligence', 'timeline'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t as any)} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                ))}
             </div>
             <button onClick={onClose} className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-2xl hover:bg-red-500 hover:text-white transition-all shadow-inner border border-slate-100">✕</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-14 custom-scrollbar bg-slate-50/30">
          
          {activeTab === 'dossier' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fadeIn">
               {/* LEFT: CONTACT SPLIT */}
               <div className="lg:col-span-7 space-y-10">
                  
                  {/* CEO PERSONAL BOX */}
                  <div className="bg-white p-12 rounded-[50px] shadow-xl border border-blue-100 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                      <span className="w-3 h-3 bg-blue-600 rounded-full"></span> Persoonlijk (Beslisser)
                    </h3>
                    <div className="space-y-2 mb-10">
                      <p className="text-4xl font-black text-slate-900 tracking-tight italic">{lead.ceoName || 'Zoeken via Neural Cloud...'}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">CEO / Eigenaar</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 group/item hover:bg-white hover:border-blue-600 transition-all">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Persoonlijk Email</p>
                          <p className="text-sm font-black text-slate-800 break-all">{lead.ceoEmail || 'Privé email opsporen...'}</p>
                          {lead.ceoEmail && <a href={`mailto:${lead.ceoEmail}`} className="mt-4 inline-block text-[10px] font-black text-blue-600 uppercase">📧 Direct Mailen</a>}
                       </div>
                       <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 group/item hover:bg-white hover:border-emerald-600 transition-all">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Persoonlijk GSM</p>
                          <p className="text-sm font-black text-slate-800">{lead.ceoPhone || 'GSM nummer zoeken...'}</p>
                          {lead.ceoPhone && <a href={`tel:${lead.ceoPhone}`} className="mt-4 inline-block text-[10px] font-black text-emerald-600 uppercase">📱 Direct Bellen</a>}
                       </div>
                    </div>
                  </div>

                  {/* BUSINESS BOX */}
                  <div className="bg-white p-12 rounded-[50px] shadow-lg border border-slate-100">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Bedrijfsgegevens (Algemeen)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                       <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Email Kantoor</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{lead.companyContact?.email || 'N/A'}</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Telefoon Kantoor</p>
                          <p className="text-xs font-bold text-slate-800">{lead.companyContact?.phone || 'N/A'}</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Website</p>
                          <a href={lead.website} target="_blank" className="text-xs font-black text-blue-600 truncate block underline italic">Bezoek Site</a>
                       </div>
                    </div>
                  </div>
               </div>

               {/* RIGHT: SOCIALS & INTELLIGENCE */}
               <div className="lg:col-span-5 space-y-10">
                  
                  {/* ACTION SOCIALS */}
                  <div className="bg-slate-900 p-12 rounded-[50px] shadow-2xl text-white space-y-8">
                    <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Digital Audit Socials</h3>
                    <div className="grid grid-cols-3 gap-4">
                       <a href={lead.socials?.linkedin} target="_blank" className={`aspect-square flex flex-col items-center justify-center rounded-3xl border-2 transition-all ${lead.socials?.linkedin ? 'bg-[#0A66C2] border-[#0A66C2] hover:scale-105' : 'bg-white/5 border-white/5 opacity-20 pointer-events-none grayscale'}`}>
                          <span className="text-3xl mb-2">👔</span>
                          <span className="text-[8px] font-black uppercase">LinkedIn</span>
                       </a>
                       <a href={lead.socials?.facebook} target="_blank" className={`aspect-square flex flex-col items-center justify-center rounded-3xl border-2 transition-all ${lead.socials?.facebook ? 'bg-[#1877F2] border-[#1877F2] hover:scale-105' : 'bg-white/5 border-white/5 opacity-20 pointer-events-none grayscale'}`}>
                          <span className="text-3xl mb-2">📘</span>
                          <span className="text-[8px] font-black uppercase">Facebook</span>
                       </a>
                       <a href={lead.socials?.instagram} target="_blank" className={`aspect-square flex flex-col items-center justify-center rounded-3xl border-2 transition-all ${lead.socials?.instagram ? 'bg-[#E4405F] border-[#E4405F] hover:scale-105' : 'bg-white/5 border-white/5 opacity-20 pointer-events-none grayscale'}`}>
                          <span className="text-3xl mb-2">📸</span>
                          <span className="text-[8px] font-black uppercase">Instagram</span>
                       </a>
                    </div>
                  </div>

                  {/* PAIN POINTS */}
                  <div className="bg-white p-12 rounded-[50px] shadow-xl border border-red-50 space-y-8">
                     <h3 className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3">
                       <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span> Kritieke Pijnpunten
                     </h3>
                     <div className="space-y-4">
                        {(lead.painPoints || []).map((p, i) => (
                          <div key={i} className="flex items-center gap-4 bg-red-50/50 p-5 rounded-[25px] border border-red-100">
                             <span className="text-xl">⚡</span>
                             <span className="text-sm font-black italic text-slate-800">{p}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="max-w-5xl mx-auto space-y-16 py-10 animate-fadeIn">
               <div className="flex justify-between items-center">
                  <div className="space-y-3">
                    <h3 className="text-5xl font-black italic text-slate-900 leading-none">NEURAL CLOUD AUDIT</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Powered by Gemini 3 Pro (Thinking Budget 32k)</p>
                  </div>
                  <button 
                    onClick={handleDeepAudit} 
                    disabled={isRefreshing}
                    className="bg-blue-600 text-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all disabled:opacity-50"
                  >
                    {isRefreshing ? 'Thinking...' : 'Start Deep Audit 🚀'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="bg-white p-14 rounded-[60px] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-6">
                     <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Web Performance Score</div>
                     <div className={`text-9xl font-black italic leading-none ${(lead.analysis?.websiteScore || 0) > 7 ? 'text-emerald-500' : 'text-blue-600'}`}>
                        {lead.analysis?.websiteScore || 0}
                     </div>
                  </div>
                  <div className="md:col-span-2 bg-slate-900 p-14 rounded-[60px] shadow-2xl text-white space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-10 opacity-5 text-8xl grayscale italic">AUDIT</div>
                     <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Strategische Analyse</h4>
                     <p className="text-2xl font-black italic text-slate-200 leading-relaxed relative z-10">
                        "{lead.analysis?.offerReason || 'Start een diepe audit om een op maat gemaakte pitch te genereren.'}"
                     </p>
                     <div className="bg-white/5 p-8 rounded-[35px] border border-white/10 mt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Discovery Path</p>
                        <p className="text-sm font-bold italic text-blue-400">{lead.analysis?.discoveryPath}</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* WORKFLOW FOOTER */}
        <div className="p-10 lg:p-12 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0 z-50">
           <div className="flex gap-4">
              <button onClick={() => handleUpdateStatus('hot')} className="bg-emerald-50 text-emerald-600 px-10 py-5 rounded-[30px] font-black text-[11px] uppercase tracking-widest border-2 border-emerald-100 shadow-xl hover:bg-emerald-600 hover:text-white transition-all">🔥 HOT LEAD</button>
              <button onClick={() => handleUpdateStatus('appointment_booked')} className="bg-blue-50 text-blue-600 px-10 py-5 rounded-[30px] font-black text-[11px] uppercase tracking-widest border-2 border-blue-100 shadow-xl hover:bg-blue-600 hover:text-white transition-all">📅 AFSPRAAK</button>
           </div>
           <button onClick={() => handleUpdateStatus('closed')} className="bg-slate-900 text-white px-16 py-6 rounded-[35px] font-black text-[11px] uppercase tracking-[0.5em] shadow-4xl hover:bg-emerald-600 transition-all active:scale-95">CLOSE DEAL 🏆</button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;


import React, { useState, useMemo } from 'react';
import { FBConversation, Lead } from '../types';

interface Props {
  conversations: FBConversation[];
  allLeads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
}

const FacebookPipeline: React.FC<Props> = ({ conversations = [], allLeads, onUpdateLeads }) => {
  const [activeView, setActiveView] = useState<'monitor' | 'instellingen' | 'historie'>('monitor');
  const [selectedChat, setSelectedChat] = useState<FBConversation | null>(null);

  // Mock data als er geen echte conversaties zijn
  const activeChats = useMemo(() => conversations.length > 0 ? conversations : [
    { 
      id: 'fb_1', leadName: 'Pieter Janssen', summary: 'Interesse in dakwerken project', 
      lastUpdate: '2 mins geleden', interestScore: 85, meetingBooked: false,
      contactInfoExchanged: { email: 'pieter@janssen.be', phone: '0499 12 34 56' },
      transcript: [
        { role: 'user', text: 'Hoi, ik zag je post over extra klanten voor dakwerkers.', timestamp: '14:00' },
        { role: 'bot', text: 'Dag Pieter! Absoluut, we helpen momenteel meerdere bedrijven. Wat is je website?', timestamp: '14:02' }
      ]
    }
  ] as FBConversation[], [conversations]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-10 lg:p-16 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between items-end gap-10 shadow-sm relative z-20">
        <div className="space-y-6">
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Facebook Funnel</h2>
          <div className="flex gap-10">
            {['monitor', 'instellingen', 'historie'].map(t => (
              <button key={t} onClick={() => setActiveView(t as any)} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-3 border-b-4 transition-all ${activeView === t ? 'text-indigo-600 border-indigo-600' : 'text-slate-300 border-transparent'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-indigo-50 px-10 py-6 rounded-[40px] border-2 border-indigo-100 flex items-center gap-6">
           <div className="text-right">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">GHL Sync Status</div>
              <div className="text-sm font-black text-indigo-600">Verbonden met Messenger</div>
           </div>
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl animate-pulse">👥</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
        {activeView === 'monitor' && (
          <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
             {/* Chat Lijst */}
             <div className="flex-1 space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Actieve Messenger Chats</h3>
                {activeChats.map(chat => (
                  <div key={chat.id} onClick={() => setSelectedChat(chat)} className={`bg-white p-10 rounded-[60px] border transition-all cursor-pointer group shadow-xl hover:shadow-indigo-600/10 ${selectedChat?.id === chat.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
                     <div className="flex justify-between items-center">
                        <div>
                           <div className="font-black text-2xl text-slate-900 uppercase italic group-hover:text-indigo-600 transition-colors">{chat.leadName}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{chat.lastUpdate}</div>
                        </div>
                        <div className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase">{chat.interestScore}% Score</div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Chat Details */}
             {selectedChat && (
               <div className="w-full lg:w-[600px] bg-white rounded-[70px] shadow-4xl border border-slate-100 flex flex-col overflow-hidden animate-slide-up">
                  <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                     <h4 className="font-black text-xl italic uppercase tracking-tighter">{selectedChat.leadName}</h4>
                     <button onClick={() => setSelectedChat(null)} className="text-white/60 hover:text-white transition-all">✕</button>
                  </div>
                  <div className="flex-1 p-10 space-y-6 bg-slate-50 overflow-y-auto h-[400px] custom-scrollbar">
                     {selectedChat.transcript.map((m, i) => (
                       <div key={i} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] p-6 rounded-[35px] text-sm leading-relaxed shadow-sm ${m.role === 'bot' ? 'bg-white text-slate-700 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                             {m.text}
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="p-10 bg-white border-t border-slate-100 space-y-6">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">AI Data Extractie</div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                           <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Email</div>
                           <div className="text-[11px] font-black text-slate-900">{selectedChat.contactInfoExchanged.email || 'Niet gevonden'}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                           <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Telefoon</div>
                           <div className="text-[11px] font-black text-slate-900">{selectedChat.contactInfoExchanged.phone || 'Niet gevonden'}</div>
                        </div>
                     </div>
                     <button className="w-full bg-slate-900 text-white py-6 rounded-[40px] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Pushen naar GHL Database 🚀</button>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeView === 'instellingen' && (
          <div className="max-w-4xl mx-auto bg-white p-20 rounded-[80px] shadow-3xl space-y-12">
             <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter text-center">Messenger Integratie</h3>
             <div className="space-y-8">
                <div className="flex justify-between items-center p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                   <div>
                      <div className="font-black text-slate-900 uppercase text-sm">GHL Messenger API</div>
                      <div className="text-[10px] text-emerald-500 font-bold uppercase mt-1">Verbonden met sub-account ID: 8XJ...</div>
                   </div>
                   <button className="bg-white px-8 py-3 rounded-full border border-slate-200 font-black text-[10px] uppercase">Reset</button>
                </div>
                <div className="flex justify-between items-center p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                   <div>
                      <div className="font-black text-slate-900 uppercase text-sm">Auto-Lead Creation</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Maak direct contact aan bij e-mail detectie</div>
                   </div>
                   <div className="w-16 h-8 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                      <div className="w-6 h-6 bg-white rounded-full ml-auto shadow-md"></div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookPipeline;

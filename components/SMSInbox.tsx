
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, AnalyticsPeriod } from '../types';
import { smsService, smsQueueService, smsStorage, type SMSMessage, type SMSQueue } from '../services/communication/smsService';

interface Props {
  leads: Lead[];
  scripts: {id: string, title: string, content: string, type: string}[];
  setScripts: React.Dispatch<React.SetStateAction<any[]>>;
  onUpdateLeads: (updatedLeads: Lead[]) => void;
  onLeadClick?: (lead: Lead) => void;
}

const SMS_DAILY_LIMIT = 75;

const SMSInbox: React.FC<Props> = ({ leads, scripts, setScripts, onUpdateLeads, onLeadClick }) => {
  const [activeTab, setActiveTab] = useState<'outreach' | 'conversations' | 'queue' | 'scripts' | 'analytics'>('queue');
  const [prompt, setPrompt] = useState('');
  const [newSmsScript, setNewSmsScript] = useState({ title: '', content: '' });
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [smsData, setSmsData] = useState(smsStorage.load());
  const [isSending, setIsSending] = useState(false);
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);

  // Sync SMS data
  useEffect(() => {
    setSmsData(smsStorage.load());
  }, []);

  const pendingSMS = useMemo(() =>
    leads.filter(l => l.outboundChannel === 'coldsms' && l.pipelineTag === 'cold'),
  [leads]);

  const smsScripts = useMemo(() => scripts.filter(s => s.type === 'sms'), [scripts]);

  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId), [selectedLeadId, leads]);

  const selectedConversation = useMemo(() =>
    smsData.conversations.find(c => c.leadId === selectedLeadId),
  [selectedLeadId, smsData.conversations]);

  const dailyUsage = useMemo(
    () => smsQueueService.calculateDailyUsage(smsData.queue, new Date()),
    [smsData.queue]
  );

  const todayQueue = useMemo(
    () => smsQueueService.getTodayQueue(smsData.queue),
    [smsData.queue]
  );

  const handleAddScript = () => {
    if (!newSmsScript.title || !newSmsScript.content) return;
    setScripts(prev => [...prev, { ...newSmsScript, id: Date.now().toString(), type: 'sms' }]);
    setNewSmsScript({ title: '', content: '' });
  };

  const handleSendMessage = async (lead: Lead) => {
    if (!messageText.trim()) return;

    setSendingLeadId(lead.id);
    setIsSending(true);

    try {
      const phones = smsService.getPhoneNumbers(lead);
      if (phones.length === 0) {
        alert('Geen telefoonnummer voor deze lead');
        return;
      }

      const result = await smsService.sendSMS(phones[0], messageText);

      if (result.success) {
        // Add message to data
        const newMessage: SMSMessage = {
          id: `sms-${Date.now()}`,
          leadId: lead.id,
          phoneNumber: phones[0],
          message: messageText,
          timestamp: new Date(),
          status: 'sent',
          direction: 'outbound',
          sentAt: new Date(),
        };

        const updatedConversations = smsData.conversations.map(c =>
          c.leadId === lead.id
            ? { ...c, messages: [...c.messages, newMessage], lastMessageAt: new Date() }
            : c
        );

        if (!updatedConversations.find(c => c.leadId === lead.id)) {
          updatedConversations.push({
            leadId: lead.id,
            phoneNumber: phones[0],
            messages: [newMessage],
            lastMessageAt: new Date(),
            totalMessages: 1,
            sentiment: 'neutral',
          });
        }

        const updated = {
          ...smsData,
          messages: [...smsData.messages, newMessage],
          conversations: updatedConversations,
        };

        smsStorage.save(updated);
        setSmsData(updated);
        setMessageText('');
      } else {
        alert('Error sending SMS: ' + result.error);
      }
    } finally {
      setSendingLeadId(null);
      setIsSending(false);
    }
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
            <button onClick={() => setActiveTab('queue')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'queue' ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent'}`}>📊 Queue ({todayQueue.length})</button>
            <button onClick={() => setActiveTab('conversations')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'conversations' ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent'}`}>💬 Gesprekken ({smsData.conversations.length})</button>
            <button onClick={() => setActiveTab('outreach')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'outreach' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Manually Send</button>
            <button onClick={() => setActiveTab('scripts')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'scripts' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Scripts</button>
            <button onClick={() => setActiveTab('analytics')} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${activeTab === 'analytics' ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>Analytics</button>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-6 rounded-[40px] shadow-2xl flex items-center gap-10 font-black italic">
           <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Daily Limit</div>
              <div className="text-3xl tracking-tighter">{dailyUsage.remaining}/{SMS_DAILY_LIMIT}</div>
           </div>
           <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-xl">📱</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar pb-64">
        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[40px] border-2 border-blue-200 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase italic">📅 Vandaag Queue</h3>
                <span className="text-3xl font-black text-blue-600">{todayQueue.length}</span>
              </div>
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${(dailyUsage.used / SMS_DAILY_LIMIT) * 100}%` }}
                />
              </div>
              <p className="text-[12px] text-slate-500 mt-3 font-bold">{dailyUsage.used} verzonden, {dailyUsage.remaining} beschikbaar van {SMS_DAILY_LIMIT}</p>
            </div>

            {todayQueue.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-slate-500 text-lg italic">Geen berichten in queue</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {todayQueue.map((item, idx) => {
                  const lead = leads.find(l => l.id === item.leadId);
                  return (
                    <div
                      key={item.id}
                      className="p-6 bg-white rounded-[30px] border border-slate-100 flex justify-between items-center hover:border-blue-500 transition-all shadow-lg"
                    >
                      <div className="flex items-center gap-6">
                        <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-black">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{item.companyName}</p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">"{item.message}"</p>
                          <p className="text-[10px] text-slate-400 mt-1">{item.phoneNumber}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${
                        item.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            {smsData.conversations.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-slate-500 text-lg italic">Geen actieve gesprekken</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {smsData.conversations.map(conv => (
                  <div
                    key={conv.leadId}
                    onClick={() => setSelectedLeadId(conv.leadId)}
                    className={`p-8 rounded-[30px] border-2 cursor-pointer transition-all hover:shadow-lg ${
                      selectedLeadId === conv.leadId
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-slate-100 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-slate-900">{leads.find(l => l.id === conv.leadId)?.companyName}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{conv.phoneNumber}</p>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                        conv.sentiment === 'positive'
                          ? 'bg-emerald-100 text-emerald-700'
                          : conv.sentiment === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {conv.sentiment}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 mb-3 line-clamp-2">
                      {conv.messages[conv.messages.length - 1]?.message}
                    </p>
                    <p className="text-[10px] text-slate-400">{conv.totalMessages} berichten</p>
                  </div>
                ))}
              </div>
            )}

            {/* Conversation Detail */}
            {selectedLead && selectedConversation && (
              <div className="fixed right-4 bottom-4 w-96 bg-white rounded-[40px] shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-96">
                <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <h4 className="font-black text-lg">{selectedLead.companyName}</h4>
                  <p className="text-[11px] opacity-80 mt-1">{selectedConversation.phoneNumber}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-[20px] max-w-xs text-[12px] ${
                          msg.direction === 'outbound'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type antwoord..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(selectedLead);
                      }
                    }}
                    className="flex-1 bg-slate-50 px-4 py-2 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSendMessage(selectedLead)}
                    disabled={isSending || !messageText.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-2xl font-black disabled:opacity-50"
                  >
                    📤
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outreach Tab */}
        {activeTab === 'outreach' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            {pendingSMS.map(lead => (
              <div key={lead.id} className="p-10 bg-white rounded-[50px] border border-slate-100 flex justify-between items-center group hover:border-amber-500 transition-all shadow-xl">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">📱</div>
                  <div>
                    <div className="font-black text-2xl text-slate-900 uppercase italic leading-none">{lead.companyName}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">{lead.ceoPhone || 'Geen nr'}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setActiveTab('conversations');
                  }}
                  className="bg-amber-600 text-white px-8 py-4 rounded-3xl text-[10px] font-black uppercase hover:bg-amber-700 transition-all"
                >
                  💬 Sturen
                </button>
              </div>
            ))}
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

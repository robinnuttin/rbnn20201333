import React, { useEffect, useState } from 'react';
import { getImessages, sendImessage } from '../mcpClient';
import { Lead } from '../types';

interface Imessage {
    id: string;
    from: string;
    body: string;
    timestamp: string;
}

const ImessageInbox: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const [messages, setMessages] = useState<Imessage[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [text, setText] = useState('');

    // Load inbox on mount
    useEffect(() => {
        const fetchMessages = async () => {
            const res = await getImessages();
            if (res.success && Array.isArray(res.data)) {
                setMessages(res.data as Imessage[]);
            }
        };
        fetchMessages();
    }, []);

    const handleSend = async () => {
        if (!selectedLead?.ceoPhone) {
            alert('Select a lead with a phone number first');
            return;
        }
        if (!text) return;
        const res = await sendImessage(selectedLead.ceoPhone, text);
        if (res.success) {
            alert('Message sent');
            setText('');
        } else {
            alert('Failed to send: ' + (res.error ?? 'unknown'));
        }
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-10 lg:p-16 bg-white border-b border-slate-200 shadow-xl flex justify-between items-end">
                <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                    iMessage Inbox
                </h2>
                <div className="bg-amber-500 text-slate-900 px-10 py-6 rounded-[30px] shadow-2xl flex items-center gap-10 font-black italic">
                    <div className="text-right">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-50">
                            Total Messages
                        </div>
                        <div className="text-3xl tracking-tighter">{messages.length}</div>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl">
                        📩
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex overflow-hidden">
                {/* Leads list */}
                <div className="w-1/3 border-r border-slate-200 overflow-y-auto p-6 custom-scrollbar">
                    <h3 className="text-xl font-black mb-4">Leads</h3>
                    {leads.map((lead) => (
                        <button
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={`w-full text-left p-4 mb-2 rounded-xl transition-colors ${selectedLead?.id === lead.id ? 'bg-amber-100' : 'bg-white'} hover:bg-amber-50`}
                        >
                            <div className="font-black text-lg">{lead.companyName}</div>
                            <div className="text-sm text-slate-500">{lead.ceoPhone || 'Geen telefoon'}</div>
                        </button>
                    ))}
                </div>

                {/* Conversation */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className="mb-4">
                                <div className="text-sm text-slate-500 mb-1">{msg.from} • {new Date(msg.timestamp).toLocaleString()}</div>
                                <div className="bg-white p-4 rounded-xl shadow">{msg.body}</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 border-t border-slate-200">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Typ je bericht..."
                            className="w-full h-24 bg-white/5 border-2 border-white/10 p-4 rounded-[30px] text-xl font-black italic text-blue-400 outline-none focus:border-amber-500 transition-all resize-none"
                        />
                        <button
                            onClick={handleSend}
                            className="w-full py-4 bg-amber-500 text-slate-900 rounded-[30px] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-white transition-all mt-2"
                        >
                            Verstuur iMessage 🚀
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImessageInbox;

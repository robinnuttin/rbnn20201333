
import React, { useState, useRef, useEffect } from 'react';
import { askChatBot } from '../services/geminiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);
    setStatus('busy');

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const response = await askChatBot(userMsg, history);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      setStatus('online');
    } catch (e) {
      setStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-500 hover:scale-110 active:scale-95 border-b-4 border-slate-900 ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-blue-600 text-white rotate-0'}`}
      >
        {isOpen ? '✕' : '🧠'}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white/95 backdrop-blur-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col overflow-hidden animate-fadeIn slide-up">
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'online' ? 'bg-emerald-400' : status === 'busy' ? 'bg-amber-400' : 'bg-red-400'}`}></div>
              <h3 className="font-black uppercase text-[10px] tracking-widest">Master Brain (GCP-Live)</h3>
            </div>
            <div className="text-[9px] font-bold opacity-40 uppercase">{status}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-4">
                <div className="text-4xl">🚀</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  24/7 Monitoring Actief. Stel je strategische vragen.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] px-5 py-3 rounded-[25px] text-sm font-medium shadow-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white px-5 py-3 rounded-[25px] border border-slate-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Vraag de Master Brain..."
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[25px] px-6 py-4 pr-14 outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-bold shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all disabled:opacity-20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9-7-9-7V19z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;

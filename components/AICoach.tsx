
import React, { useState, useRef } from 'react';
import { askCoach } from '../services/geminiService';
import { Lead } from '../types';

interface Props {
  allLeads: Lead[];
}

const AICoach: React.FC<Props> = ({ allLeads }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user'|'ai', text: string, sources?: any[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    setHistory(prev => [...prev, {role: 'user', text: query}]);
    const result = await askCoach(query, { leadsCount: allLeads.length });
    setHistory(prev => [...prev, {role: 'ai', text: result.text, sources: result.sources}]);
    setQuery('');
    setLoading(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Niet ondersteund.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setQuery(event.results[0][0].transcript);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900">
      <div className="p-16 border-b border-slate-200 bg-white shadow-xl flex justify-between items-center relative z-10">
        <div>
           <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none uppercase italic">Master Brain</h2>
           <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.5em] mt-3">Live Cloud Reasoning Engine</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Search Grounding: ACTIVE</div>
           <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-4xl shadow-2xl shadow-blue-600/40 rotate-6 text-white font-black">🧠</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-24 space-y-12 custom-scrollbar">
        {history.map((h, i) => (
          <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[80%] p-12 rounded-[60px] text-md leading-relaxed shadow-2xl border
              ${h.role === 'user' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-100'}
            `}>
              {h.text}
              {h.sources && h.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-2">
                   <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Geverifieerde Bronnen:</div>
                   {h.sources.map((s: any, idx: number) => (
                     <a key={idx} href={s.web?.uri} target="_blank" className="block text-[10px] text-slate-400 hover:text-blue-600 transition-colors truncate">
                       🔗 {s.web?.title || s.web?.uri}
                     </a>
                   ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-600 animate-pulse font-black text-xs uppercase tracking-widest ml-12">Analyseert Live Cloud Data...</div>}
      </div>

      <div className="p-12 lg:p-24 bg-white border-t border-slate-100 shadow-2xl pb-40">
        <div className="max-w-6xl mx-auto flex gap-8 items-center">
          <button 
            onClick={startVoiceInput}
            className={`w-24 h-24 rounded-[40px] flex items-center justify-center text-3xl transition-all shadow-xl
              ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-50 text-slate-300 hover:bg-blue-100 hover:text-blue-600'}
            `}
          >🎤</button>
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
            placeholder="Vraag om een concurrentie-analyse of marktadvies..."
            className="flex-1 bg-slate-50 border-4 border-slate-50 rounded-[50px] px-12 py-8 outline-none focus:border-blue-600 focus:bg-white text-xl font-black transition-all shadow-inner"
          />
          <button onClick={handleAsk} className="bg-slate-900 text-white px-20 py-8 rounded-[50px] font-black text-sm hover:bg-blue-600 transition-all shadow-3xl uppercase tracking-widest">ANALYSEER</button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;

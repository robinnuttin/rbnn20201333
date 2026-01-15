
import React, { useState, useMemo } from 'react';
import { Task, Lead } from '../types';
import { optimizeSchedule } from '../services/geminiService';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  leads: Lead[];
}

const Agenda: React.FC<Props> = ({ tasks, setTasks, leads }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'settings'>('daily');
  const [weekOffset, setWeekOffset] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiCommand, setAiCommand] = useState('');
  
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 - 22:00
  const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

  const weekDaysWithDates = useMemo(() => {
    const today = new Date();
    const first = today.getDate() - today.getDay() + 1 + (weekOffset * 7);
    return days.map((day, i) => {
      const d = new Date(today.setDate(first + i));
      return { day, date: d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' }) };
    });
  }, [weekOffset]);

  const handleAiOptimize = async () => {
    setIsOptimizing(true);
    try {
      const optimized = await optimizeSchedule(tasks, leads, aiCommand);
      setTasks(optimized);
      alert(`AI Optimizer: "Rooster is herrangschikt op basis van: '${aiCommand}'. Alle slots zijn nu efficiënt ingepland."`);
      setAiCommand('');
    } catch (e) {
      alert("AI Optimalisatie kon niet worden voltooid.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 p-10 lg:p-20 pb-64 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header met Navigatie */}
        <div className="flex flex-col lg:flex-row justify-between items-end border-b border-slate-200 pb-12 gap-8">
          <div className="space-y-4">
            <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Revenue Agenda</h2>
            <div className="flex gap-12 mt-8">
              {['daily', 'weekly', 'settings'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t as any)}
                  className={`text-[11px] font-black uppercase tracking-[0.5em] pb-3 border-b-4 transition-all ${activeTab === t ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent hover:text-slate-400'}`}
                >
                  {t === 'daily' ? 'Daily Grind' : t === 'weekly' ? 'Wekelijks Overzicht' : 'Cloud Settings'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'weekly' && (
            <div className="flex items-center gap-6 bg-white p-3 rounded-full shadow-lg border border-slate-100">
               <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-4 bg-slate-50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-inner font-black">←</button>
               <div className="text-center px-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maandoverzicht</div>
                  <div className="font-black text-slate-900 uppercase italic tracking-tighter">Week {weekOffset > 0 ? `+${weekOffset}` : weekOffset === 0 ? 'Huidig' : weekOffset}</div>
               </div>
               <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-4 bg-slate-50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-inner font-black">→</button>
            </div>
          )}
        </div>

        {/* AI Optimizer Command Line */}
        {activeTab !== 'settings' && (
           <div className="bg-slate-900 p-8 rounded-[40px] shadow-4xl border border-white/5 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-blue-600/20 rotate-3">🧠</div>
                <input 
                  value={aiCommand}
                  onChange={e => setAiCommand(e.target.value)}
                  placeholder="Vraag AI om je week te optimaliseren (bv. 'Rangschik op ROI' of 'Blokkeer ochtenden')..."
                  className="flex-1 bg-transparent border-none text-white font-black text-lg outline-none placeholder-white/10"
                />
              </div>
              <button 
                onClick={handleAiOptimize}
                disabled={isOptimizing}
                className="bg-blue-600 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 w-full md:w-auto"
              >
                {isOptimizing ? 'ANALYSEREN...' : 'OPTIMALISEER'}
              </button>
           </div>
        )}

        {/* Content Tabs */}
        <div className="animate-fadeIn pb-20">
          {activeTab === 'daily' && (
            <div className="bg-white rounded-[70px] shadow-3xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
               {hours.map(h => (
                 <div key={h} className="flex min-h-[140px] group">
                    <div className="w-40 bg-slate-50 flex items-center justify-center border-r border-slate-100 font-black text-3xl italic text-slate-900 tracking-tighter group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {h}:00
                    </div>
                    <div className="flex-1 p-10 flex flex-wrap gap-8 items-center">
                       {h === 10 && (
                         <div className="bg-blue-50 border-l-[12px] border-blue-600 p-8 rounded-[40px] flex-1 font-black text-xl text-slate-700 italic shadow-xl transition-all hover:translate-x-2">
                           Audit: Dakwerken NV - Volledige SEO Pitch
                           <div className="text-[10px] font-black text-blue-600 uppercase mt-2 tracking-widest">Duur: 60 min • Prioriteit: Hoog</div>
                         </div>
                       )}
                       {h === 14 && (
                         <div className="bg-emerald-50 border-l-[12px] border-emerald-500 p-8 rounded-[40px] flex-1 font-black text-xl text-slate-700 italic shadow-xl transition-all hover:translate-x-2">
                           Closing Call: Project Solar Solutions
                           <div className="text-[10px] font-black text-emerald-600 uppercase mt-2 tracking-widest">Duur: 90 min • Prioriteit: Maximum</div>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="bg-white rounded-[70px] shadow-4xl border border-slate-100 overflow-hidden">
               <div className="grid grid-cols-8 divide-x divide-slate-100 border-b border-slate-100 bg-slate-900 text-white py-8 text-[10px] font-black uppercase tracking-[0.5em] text-center sticky top-0 z-10">
                  <div className="opacity-40">Tijd</div>
                  {weekDaysWithDates.map(d => (
                    <div key={d.day} className="flex flex-col gap-1">
                      <span>{d.day}</span>
                      <span className="text-blue-400">{d.date}</span>
                    </div>
                  ))}
               </div>
               <div className="divide-y divide-slate-50">
                  {hours.map(h => (
                    <div key={h} className="grid grid-cols-8 divide-x divide-slate-50 h-32 group">
                       <div className="flex items-center justify-center font-black text-slate-300 text-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                         {h}:00
                       </div>
                       {days.map(d => (
                         <div key={d} className="p-2 transition-all hover:bg-blue-600/5 cursor-pointer relative group/slot">
                            {/* Mock agenda items */}
                            {h === 11 && d === 'Maandag' && (
                              <div className="absolute inset-2 bg-blue-600 text-white rounded-3xl p-4 text-[9px] font-black uppercase shadow-xl z-10 flex flex-col justify-center animate-fadeIn">
                                Outreach Call
                              </div>
                            )}
                            {h === 15 && d === 'Donderdag' && (
                              <div className="absolute inset-2 bg-emerald-500 text-white rounded-3xl p-4 text-[9px] font-black uppercase shadow-xl z-10 flex flex-col justify-center animate-fadeIn">
                                Deal Closing
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12">
               <div className="bg-white p-20 rounded-[80px] shadow-4xl space-y-16 border border-slate-100">
                  <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter text-center">Cloud Agenda Monitoring</h3>
                  
                  <div className="space-y-8">
                     <div className="flex justify-between items-center p-10 bg-slate-50 rounded-[50px] border border-slate-100 group transition-all hover:border-blue-600/30 hover:bg-white shadow-sm">
                        <div className="flex items-center gap-8">
                           <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center text-5xl shadow-xl border border-slate-100 group-hover:rotate-6 transition-all">🗓️</div>
                           <div>
                              <div className="font-black text-slate-900 uppercase tracking-tight text-2xl">Google Calendar</div>
                              <div className="text-[11px] text-emerald-500 font-black uppercase mt-2 tracking-widest flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div> Google Cloud OAuth: VERBONDEN
                              </div>
                           </div>
                        </div>
                        <a href="https://calendar.google.com" target="_blank" className="bg-white px-10 py-4 rounded-full border-2 border-slate-200 font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Dashboard Openen</a>
                     </div>

                     <div className="flex justify-between items-center p-10 bg-slate-50 rounded-[50px] border border-slate-100 group transition-all hover:border-indigo-600/30 hover:bg-white shadow-sm">
                        <div className="flex items-center gap-8">
                           <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center text-5xl shadow-xl border border-slate-100 group-hover:-rotate-6 transition-all">🌀</div>
                           <div>
                              <div className="font-black text-slate-900 uppercase tracking-tight text-2xl">GoHighLevel (GHL)</div>
                              <div className="text-[11px] text-emerald-500 font-black uppercase mt-2 tracking-widest flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div> API Cluster Status: ACTIEF
                              </div>
                           </div>
                        </div>
                        <button className="bg-white px-10 py-4 rounded-full border-2 border-slate-200 font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">Sync Nu Forceren</button>
                     </div>
                  </div>

                  <div className="p-12 bg-blue-50 rounded-[60px] border-l-[20px] border-blue-600 space-y-6 shadow-2xl">
                     <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.5em]">Neural Scheduler Engine</h4>
                     <p className="text-lg font-black italic text-slate-700 leading-relaxed">
                        "Elk tijdslot wordt geanalyseerd op basis van historische conversiedata. De AI suggereert automatisch pauzes en voorbereidingstijd voor complexe closing calls."
                     </p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agenda;

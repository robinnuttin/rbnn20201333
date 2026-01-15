
import React, { useState } from 'react';
import { FilterState, Lead } from '../types';
import FilterPanel from './FilterPanel';

interface Props {
  onStartBackground: (filters: FilterState) => void;
  onStopBackground: () => void;
  isBackgroundActive: boolean;
  queueLength: number;
  masterDatabase: Lead[];
  onLeadsFound: (leads: Lead[]) => void;
}

const Scraper: React.FC<Props> = ({ onStartBackground, onStopBackground, isBackgroundActive, queueLength }) => {
  const [filters, setFilters] = useState<FilterState>({
    sectors: [],
    locations: [],
    sector: '',
    location: '',
    requireCeoName: true,
    requirePersonalPhone: true,
    requirePersonalEmail: true,
    requireLinkedIn: true,
    adStatus: 'all',
    adPlatforms: ['meta', 'google'],
    minWebsiteScore: 5,
    minSeoScore: 5,
    enableWebsiteFilter: true,
    enableSeoFilter: true,
    crescoProfile: 'foundation'
  });

  const handleLaunch = () => {
    onStartBackground(filters);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-10 lg:p-16 space-y-16 pb-64 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-slate-200 pb-12 gap-10">
          <div className="space-y-4">
            <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Mission Control</h2>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.6em] ml-4">Enterprise V27 • Neural Discovery Matrix</p>
          </div>
          
          <div className="flex items-center gap-10 bg-white p-6 rounded-[45px] shadow-2xl border border-slate-100">
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Status</div>
                <div className={`font-black uppercase text-xs italic ${isBackgroundActive ? 'text-blue-600 animate-pulse' : 'text-slate-300'}`}>
                  {isBackgroundActive ? `${queueLength} Sectors in Discovery` : 'Engine Ready'}
                </div>
             </div>
             <button 
              onClick={() => isBackgroundActive ? onStopBackground() : handleLaunch()}
              className={`w-28 h-14 rounded-full p-2 transition-all shadow-inner relative ${isBackgroundActive ? 'bg-red-500' : 'bg-slate-200'}`}
             >
                <div className={`w-10 h-10 bg-white rounded-full shadow-lg transition-all transform duration-500 ${isBackgroundActive ? 'translate-x-14' : 'translate-x-0'}`}></div>
             </button>
          </div>
        </div>

        {/* MISSION CONTROL FILTERS (ONLY SOURCE OF TRUTH) */}
        <FilterPanel 
          filters={filters} 
          setFilters={setFilters} 
          onSubmit={handleLaunch} 
          onStop={onStopBackground} 
          isProcessing={isBackgroundActive} 
          mode="scrape" 
        />

        {/* ENGINE STATUS & TIPS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
             <div className="bg-slate-900 p-16 rounded-[80px] shadow-4xl text-white space-y-12 border-l-[30px] border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 text-8xl grayscale italic">AUTONOMOUS</div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Neural Engine Logic</h3>
                <p className="text-slate-400 text-lg italic font-medium leading-relaxed max-w-2xl">
                  De motor verwerkt elke combinatie van sectoren en locaties die je hierboven hebt toegevoegd. Zodra je op 'Start Deep Discovery' klikt, begint de AI met een onuitputtelijk onderzoek in de cloud. 
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                         <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Maps Scraper</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300">Vindt real-time 20+ leads per locatie via Google Maps grounding.</p>
                   </div>
                   <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Neural Auditor</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300">Graaft diep in KBO, LinkedIn en bedrijfswebsites voor privé contactdata.</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4">
             <div className="bg-white p-16 rounded-[80px] shadow-2xl border border-slate-100 flex flex-col justify-center h-full space-y-10">
                <div className="text-center space-y-4">
                   <div className="text-6xl">🔒</div>
                   <h4 className="text-xl font-black italic uppercase tracking-tighter">Data Security</h4>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cloud Sync Active</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-[11px] font-bold text-slate-600 italic leading-relaxed text-center">
                   "Alle gescrapte data wordt onmiddellijk geëncrypt opgeslagen in je Enterprise Cloud Cluster en gesynchroniseerd met je GoHighLevel account."
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scraper;

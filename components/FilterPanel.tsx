
import React, { useState } from 'react';
import { FilterState } from '../types';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSubmit: () => void;
  onStop?: () => void;
  isProcessing: boolean;
  mode: 'scrape' | 'filter';
}

const FilterPanel: React.FC<Props> = ({ filters, setFilters, onSubmit, onStop, isProcessing, mode }) => {
  const [sectorInput, setSectorInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addItem = (key: 'sectors' | 'locations', value: string) => {
    if (!value.trim()) return;
    const current = filters[key] || [];
    if (!current.includes(value.trim())) {
      handleChange(key, [...current, value.trim()]);
    }
  };

  const removeItem = (key: 'sectors' | 'locations', value: string) => {
    const current = filters[key] || [];
    handleChange(key, current.filter(v => v !== value));
  };

  const togglePlatform = (platform: 'google' | 'meta') => {
    const current = filters.adPlatforms || [];
    const updated = current.includes(platform) ? current.filter(p => p !== platform) : [...current, platform];
    handleChange('adPlatforms', updated);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-2xl p-10 rounded-[50px] mx-4 lg:mx-8 mt-6">
      
      {/* BASIS INPUTS MET MULTI-TAG SUPPORT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Neural Sectors / Niches</label>
          <div className="relative">
            <input 
              type="text" 
              value={sectorInput} 
              onChange={e => setSectorInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (addItem('sectors', sectorInput), setSectorInput(''))}
              placeholder="bv. Dakwerkers + Enter..."
              className="w-full bg-slate-50 border-4 border-slate-50 rounded-[30px] px-8 py-5 text-sm font-black italic focus:border-blue-600 outline-none transition-all shadow-inner"
            />
            <button onClick={() => (addItem('sectors', sectorInput), setSectorInput(''))} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white w-10 h-10 rounded-2xl">+</button>
          </div>
          <div className="flex flex-wrap gap-2 px-2">
            {filters.sectors?.map(s => (
              <span key={s} className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2">
                {s} <button onClick={() => removeItem('sectors', s)} className="hover:text-red-500">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className="md:col-span-4 space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Target Regions / Cities</label>
          <div className="relative">
            <input 
              type="text" 
              value={locationInput} 
              onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (addItem('locations', locationInput), setLocationInput(''))}
              placeholder="bv. Antwerpen + Enter..."
              className="w-full bg-slate-50 border-4 border-slate-50 rounded-[30px] px-8 py-5 text-sm font-black italic focus:border-blue-600 outline-none transition-all shadow-inner"
            />
            <button onClick={() => (addItem('locations', locationInput), setLocationInput(''))} className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-10 h-10 rounded-2xl">+</button>
          </div>
          <div className="flex flex-wrap gap-2 px-2">
            {filters.locations?.map(l => (
              <span key={l} className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2">
                {l} <button onClick={() => removeItem('locations', l)} className="hover:text-blue-100">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className="md:col-span-4 flex gap-4 pt-8">
          {isProcessing ? (
            <button onClick={onStop} className="flex-1 py-5 bg-red-500 text-white rounded-[30px] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-red-600 transition-all">STOP ENGINE</button>
          ) : (
            <button onClick={onSubmit} className="flex-1 py-5 bg-blue-600 text-white rounded-[30px] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-blue-500/20 hover:bg-slate-900 transition-all">START DEEP DISCOVERY</button>
          )}
        </div>
      </div>

      {/* GEAVANCEERDE FILTERS */}
      <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-12 animate-fadeIn">
        
        {/* ADS INTELLIGENCE */}
        <div className="space-y-6">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
             <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Ad-History Status
          </h4>
          <select 
            value={filters.adStatus} 
            onChange={e => handleChange('adStatus', e.target.value)}
            className="w-full bg-slate-50 p-5 rounded-[25px] text-xs font-black italic outline-none border-2 border-slate-50 focus:border-blue-600"
          >
            <option value="all">Alle advertentie historie</option>
            <option value="active">Nu Actief (Scaling Mode)</option>
            <option value="past">Verleden Ads (Ooit geprobeerd)</option>
            <option value="none">Geen ads gedetecteerd</option>
          </select>
          <div className="flex gap-3">
            <button onClick={() => togglePlatform('google')} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase border-4 transition-all ${filters.adPlatforms?.includes('google') ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'border-slate-50 text-slate-400 bg-slate-50'}`}>Google</button>
            <button onClick={() => togglePlatform('meta')} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase border-4 transition-all ${filters.adPlatforms?.includes('meta') ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-50 text-slate-400 bg-slate-50'}`}>Meta</button>
          </div>
        </div>

        {/* PERFORMANCE SCORES */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
               <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Tech Matrix
            </h4>
            <div className="flex gap-2">
              <button onClick={() => handleChange('enableWebsiteFilter', !filters.enableWebsiteFilter)} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${filters.enableWebsiteFilter ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>WEB</button>
              <button onClick={() => handleChange('enableSeoFilter', !filters.enableSeoFilter)} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase transition-all ${filters.enableSeoFilter ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>SEO</button>
            </div>
          </div>
          <div className="space-y-6">
            <div className={`transition-all duration-500 ${filters.enableWebsiteFilter ? 'opacity-100' : 'opacity-20 grayscale pointer-events-none'}`}>
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest"><span>Min Website Score</span><span>{filters.minWebsiteScore}/10</span></div>
              <input type="range" min="1" max="10" value={filters.minWebsiteScore} onChange={e => handleChange('minWebsiteScore', parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
            </div>
            <div className={`transition-all duration-500 ${filters.enableSeoFilter ? 'opacity-100' : 'opacity-20 grayscale pointer-events-none'}`}>
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest"><span>Min SEO Score</span><span>{filters.minSeoScore}/10</span></div>
              <input type="range" min="1" max="10" value={filters.minSeoScore} onChange={e => handleChange('minSeoScore', parseInt(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* CONTACT VEREISTEN */}
        <div className="space-y-6">
           <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Cloud Validation
           </h4>
           <div className="grid gap-3 bg-slate-50 p-6 rounded-[35px] border border-slate-100">
              <label className="flex items-center gap-4 text-[11px] font-black text-slate-700 cursor-pointer group">
                <input type="checkbox" checked={filters.requireCeoName} onChange={e => handleChange('requireCeoName', e.target.checked)} className="w-5 h-5 rounded-[8px] accent-blue-600" />
                <span className="group-hover:text-blue-600 transition-colors">Naam Zaakvoerder</span>
              </label>
              <label className="flex items-center gap-4 text-[11px] font-black text-slate-700 cursor-pointer group">
                <input type="checkbox" checked={filters.requirePersonalPhone} onChange={e => handleChange('requirePersonalPhone', e.target.checked)} className="w-5 h-5 rounded-[8px] accent-blue-600" />
                <span className="group-hover:text-blue-600 transition-colors">Persoonlijk GSM (CEO)</span>
              </label>
              <label className="flex items-center gap-4 text-[11px] font-black text-slate-700 cursor-pointer group">
                <input type="checkbox" checked={filters.requirePersonalEmail} onChange={e => handleChange('requirePersonalEmail', e.target.checked)} className="w-5 h-5 rounded-[8px] accent-blue-600" />
                <span className="group-hover:text-blue-600 transition-colors">Privé Email (CEO)</span>
              </label>
              <label className="flex items-center gap-4 text-[11px] font-black text-slate-700 cursor-pointer group">
                <input type="checkbox" checked={filters.requireLinkedIn} onChange={e => handleChange('requireLinkedIn', e.target.checked)} className="w-5 h-5 rounded-[8px] accent-blue-600" />
                <span className="group-hover:text-blue-600 transition-colors">LinkedIn Verificatie</span>
              </label>
           </div>
        </div>

        {/* ICP PACKAGES */}
        <div className="space-y-6">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
             <span className="w-2 h-2 bg-slate-900 rounded-full"></span> Offer Matching
          </h4>
          <div className="grid grid-cols-1 gap-3">
             {['foundation', 'multiplier', 'domination'].map(p => (
               <button 
                key={p} 
                onClick={() => handleChange('crescoProfile', p)}
                className={`py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest border-4 transition-all italic ${filters.crescoProfile === p ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'border-slate-50 text-slate-400 bg-slate-50 hover:bg-white hover:border-slate-100'}`}
               >
                 {p} Package
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;


import React, { useState } from 'react';
import { UserConfig, TrainingData } from '../types';

interface Props {
  config: UserConfig;
  onUpdateConfig: (config: UserConfig) => void;
  // Added missing onLogout prop
  onLogout?: () => void;
}

const Settings: React.FC<Props> = ({ config, onUpdateConfig, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'core' | 'knowledge' | 'monitoring'>('core');
  const [trainingList, setTrainingList] = useState<TrainingData[]>([
    { id: '1', type: 'website', title: 'CrescoFlow Hoofdsite', url: 'https://crescoflow.be', timestamp: '2025-01-20' },
    { id: '2', type: 'pdf', title: 'Product Pitch 2025', size: '2.4MB', timestamp: '2025-02-15' }
  ]);
  const [newLink, setNewLink] = useState('');

  const addTraining = (type: TrainingData['type']) => {
    if (type === 'link' && !newLink) return;
    const item: TrainingData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: type === 'link' ? newLink : 'Nieuw Document',
      url: type === 'link' ? newLink : undefined,
      timestamp: new Date().toISOString().split('T')[0]
    };
    setTrainingList([item, ...trainingList]);
    setNewLink('');
  };

  const removeTraining = (id: string) => {
    setTrainingList(trainingList.filter(t => t.id !== id));
  };

  return (
    <div className="p-10 lg:p-24 bg-slate-50 min-h-screen overflow-y-auto pb-64 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex justify-between items-end border-b border-slate-200 pb-12">
          <div className="space-y-4">
            <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Instellingen</h2>
            <div className="flex gap-10">
              {['core', 'knowledge', 'monitoring'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`text-[11px] font-black uppercase tracking-[0.5em] pb-3 border-b-4 transition-all ${activeTab === t ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent'}`}>
                  {t === 'core' ? 'Systeem' : t === 'knowledge' ? 'Knowledge Hub' : 'Infrastructuur'}
                </button>
              ))}
            </div>
          </div>
          {/* Display Logout button if provided */}
          {onLogout && (
            <button 
              onClick={onLogout}
              className="bg-red-500 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all"
            >
              Uitloggen
            </button>
          )}
        </div>

        {activeTab === 'knowledge' && (
          <div className="animate-fadeIn space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* Upload Sectie */}
               <div className="bg-white p-14 rounded-[70px] shadow-3xl space-y-10">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Train de Master Brain</h3>
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Mijn Website (Primaire Bron)</label>
                    <input value={config.companyWebsite} onChange={(e) => onUpdateConfig({...config, companyWebsite: e.target.value})} placeholder="https://jouwsite.nl" className="w-full bg-slate-50 p-6 rounded-[30px] font-bold outline-none focus:border-blue-600 border-2 border-transparent transition-all" />
                  </div>
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Andere Links / Bronnen</label>
                    <div className="flex gap-4">
                      <input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://extra-bron.nl" className="flex-1 bg-slate-50 p-6 rounded-[30px] font-bold outline-none" />
                      <button onClick={() => addTraining('link')} className="bg-slate-900 text-white px-8 rounded-[30px] font-black text-xs uppercase">Toevoegen</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <button onClick={() => addTraining('pdf')} className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all text-center space-y-2">
                       <span className="text-3xl">📄</span>
                       <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">PDF Upload</span>
                    </button>
                    <button onClick={() => addTraining('audio')} className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all text-center space-y-2">
                       <span className="text-3xl">🎤</span>
                       <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Audio Trans</span>
                    </button>
                    <button className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 hover:border-blue-500 transition-all text-center space-y-2 opacity-50 cursor-not-allowed">
                       <span className="text-3xl">📊</span>
                       <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Unlimited</span>
                    </button>
                  </div>
               </div>

               {/* Overzicht Sectie */}
               <div className="bg-white p-14 rounded-[70px] shadow-3xl space-y-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Trainings Archief</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                     {trainingList.map(item => (
                       <div key={item.id} className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 flex justify-between items-center group">
                          <div className="flex items-center gap-6">
                             <span className="text-2xl">{item.type === 'website' ? '🌐' : item.type === 'pdf' ? '📄' : '🎤'}</span>
                             <div>
                                <div className="font-black text-slate-900 text-sm uppercase italic truncate w-48">{item.title}</div>
                                <div className="text-[9px] text-slate-400 font-bold tracking-widest mt-1 uppercase">{item.timestamp} {item.size && `• ${item.size}`}</div>
                             </div>
                          </div>
                          <button onClick={() => removeTraining(item.id)} className="w-10 h-10 bg-white text-slate-300 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">✕</button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="bg-slate-900 text-white p-12 rounded-[60px] shadow-4xl space-y-8">
               <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">GHL Sync Status</h3>
               <div className="flex justify-between items-center border-b border-white/10 pb-6">
                  <span className="text-sm font-bold text-slate-400">Messenger Tracking</span>
                  <span className="text-emerald-400 font-black">ACTIEF ✓</span>
               </div>
               <div className="flex justify-between items-center border-b border-white/10 pb-6">
                  <span className="text-sm font-bold text-slate-400">SMS Gateway</span>
                  <span className="text-emerald-400 font-black">ACTIEF ✓</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">Email SMTP</span>
                  <span className="text-emerald-400 font-black">ACTIEF ✓</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

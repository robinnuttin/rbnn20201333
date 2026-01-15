
import React, { useState } from 'react';

interface Props {
  activeApp: string;
  setActiveApp: (app: string) => void;
  totalLeadsCount: number;
  isScraping?: boolean;
}

const Sidebar: React.FC<Props> = ({ activeApp, setActiveApp, totalLeadsCount, isScraping }) => {
  const [isOpen, setIsOpen] = useState(false);

  const apps = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'lead-scraper', name: 'Scraper', icon: '🔍' },
    { id: 'database', name: 'Database', icon: '🗄️' },
    { id: 'cold-calls', name: 'Cold Call', icon: '📞' },
    { id: 'email-pipeline', name: 'Email Outreach', icon: '📧' },
    { id: 'sms-pipeline', name: 'SMS Command', icon: '💬' },
    { id: 'sms-launch', name: 'SMS Launch Pad', icon: '🚀' },
    { id: 'facebook-funnel', name: 'Facebook Funnel', icon: '👥' },
    { id: 'follow-up', name: 'Follow-up', icon: '🔄' },
    { id: 'sales-meet', name: 'Closing Suite', icon: '🎥' },
    { id: 'ai-coach', name: 'Master Brain', icon: '🧠' },
    { id: 'agenda', name: 'Agenda', icon: '📅' },
    { id: 'ghl-manager', name: 'GHL Control', icon: '🔗' },
    { id: 'settings', name: 'Instellingen', icon: '⚙️' }
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden fixed top-6 left-6 z-[400] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <div className={`fixed left-0 top-0 h-screen bg-slate-900 text-white shadow-2xl z-[350] transition-all duration-500 flex flex-col lg:w-72 ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="p-10 border-b border-white/5 text-center flex-shrink-0">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white tracking-tighter uppercase italic">CRESCOFLOW</h1>
          <p className="text-blue-500 text-[9px] mt-2 uppercase font-black tracking-[0.5em]">ML Revenue OS V27</p>
        </div>
        
        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto custom-sidebar-scroll">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-6">Modules</div>
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => { setActiveApp(app.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-[25px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 group ${activeApp === app.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-2' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className={`text-xl transition-transform group-hover:scale-125 duration-300 ${activeApp === app.id ? 'scale-110' : ''}`}>{app.icon}</span>
              <span>{app.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-4 flex-shrink-0">
           <div className="bg-white/5 p-6 rounded-[30px] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Assets</div>
                <div className="text-xl font-black italic">{totalLeadsCount.toLocaleString()} <span className="text-[10px] text-blue-500 not-italic">Leads</span></div>
              </div>
              {isScraping && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
              )}
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

import React, { useState } from 'react';

interface Props {
  activeApp: string;
  setActiveApp: (app: string) => void;
  totalLeadsCount: number;
  isScraping?: boolean;
  syncState?: 'loading' | 'synced' | 'saving' | 'offline';
  onSignOut?: () => void;
}

const sections: { title: string; apps: { id: string; name: string; icon: string }[] }[] = [
  {
    title: 'Overzicht',
    apps: [
      { id: 'dashboard', name: 'Dashboard', icon: '📊' },
      { id: 'database', name: 'Leads', icon: '🗂️' },
      { id: 'lead-scraper', name: 'Scraper', icon: '🔍' },
    ],
  },
  {
    title: 'Outreach',
    apps: [
      { id: 'cold-calls', name: 'Cold Call', icon: '📞' },
      { id: 'email-pipeline', name: 'E-mail', icon: '✉️' },
      { id: 'sms-pipeline', name: 'SMS', icon: '💬' },
      { id: 'sms-launch', name: 'SMS Launch Pad', icon: '🚀' },
      { id: 'imessage-inbox', name: 'iMessage', icon: '📱' },
      { id: 'facebook-funnel', name: 'Facebook', icon: '👥' },
      { id: 'follow-up', name: 'Follow-up', icon: '🔄' },
    ],
  },
  {
    title: 'Werk',
    apps: [
      { id: 'sales-meet', name: 'Closing', icon: '🎥' },
      { id: 'agenda', name: 'Agenda', icon: '📅' },
      { id: 'ai-coach', name: 'AI Coach', icon: '🧠' },
      { id: 'ghl-manager', name: 'GoHighLevel', icon: '🔗' },
      { id: 'settings', name: 'Instellingen', icon: '⚙️' },
    ],
  },
];

const syncLabel = {
  loading: { text: 'Laden…', dot: 'bg-stone-300' },
  synced: { text: 'Opgeslagen in cloud', dot: 'bg-emerald-500' },
  saving: { text: 'Opslaan…', dot: 'bg-amber-400' },
  offline: { text: 'Offline — lokaal bewaard', dot: 'bg-rose-400' },
};

const Sidebar: React.FC<Props> = ({ activeApp, setActiveApp, totalLeadsCount, isScraping, syncState = 'loading', onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sync = syncLabel[syncState];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
        className="lg:hidden fixed top-4 left-4 z-[400] bg-white border border-stone-200 text-stone-700 w-9 h-9 rounded-md shadow-sm"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-[#f7f7f5] border-r border-stone-200 text-stone-700 z-[350] flex flex-col transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-4 pt-5 pb-3 flex items-center gap-2">
          <span className="text-lg">🌱</span>
          <span className="text-sm font-semibold text-stone-900">CrescoFlow</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
          {sections.map(section => (
            <div key={section.title}>
              <div className="px-2 py-1 text-[11px] font-medium text-stone-400">{section.title}</div>
              {section.apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => { setActiveApp(app.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${activeApp === app.id ? 'bg-stone-200/70 text-stone-900 font-medium' : 'hover:bg-stone-200/50'}`}
                >
                  <span className="w-5 text-center">{app.icon}</span>
                  <span className="truncate">{app.name}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-stone-200 px-4 py-3 space-y-2 text-xs text-stone-500">
          <div className="flex items-center justify-between">
            <span>{totalLeadsCount.toLocaleString('nl-BE')} leads</span>
            {isScraping && <span className="text-amber-600">● scraping</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${sync.dot}`} />
            <span>{sync.text}</span>
          </div>
          {onSignOut && (
            <button onClick={onSignOut} className="text-stone-400 hover:text-stone-700">Uitloggen</button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

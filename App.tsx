
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadDatabase from './components/LeadDatabase';
import Scraper from './components/Scraper';
import ColdCallCenter from './components/ColdCallCenter';
import EmailOutreach from './components/EmailOutreach';
import SMSInbox from './components/SMSInbox';
import SMSLaunchPad from './components/SMSLaunchPad';
import FollowUp from './components/FollowUp';
import SalesMeet from './components/SalesMeet';
import Agenda from './components/Agenda';
import ChatBot from './components/ChatBot';
import AICoach from './components/AICoach';
import FacebookPipeline from './components/FacebookPipeline';
import GHLManager from './components/GHLManager';
import LeadDetailModal from './components/LeadDetailModal';
import Settings from './components/Settings';
import ImessageInbox from './components/ImessageInbox';
import { Lead, FilterState, UserConfig } from './types';
import { discoverLeadsBatch, enrichLeadNeural } from './services/geminiService';
import { saveLeadsToCloud, getLeadsFromCloud, initializeCloudConnection } from './services/cloudPersistenceService';
import { fetchRemoteLeads, pushLeads, fetchSetting, saveSetting, diffLeads } from './services/cloudSync';
import { supabase } from './services/supabaseClient';

const App: React.FC<{ userEmail?: string }> = ({ userEmail }) => {
  const [activeApp, setActiveApp] = useState('dashboard');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState(false);
  const [workerStatus, setWorkerStatus] = useState('Standby');
  const [scrapingQueue, setScrapingQueue] = useState<{ sector: string, location: string }[]>([]);
  const [enrichmentQueue, setEnrichmentQueue] = useState<Partial<Lead>[]>([]);

  const [scripts, setScripts] = useState<{ id: string, title: string, content: string, type: 'call' | 'email' | 'sms' }[]>([
    { id: '1', title: 'Standaard Call Script', content: 'Hoi {{ceo_name}}, ik zag jullie website...', type: 'call' },
    { id: '2', title: 'Cold Email V1', content: 'Beste {{ceo_name}}, we hebben een audit gedaan...', type: 'email' },
    { id: '3', title: 'SMS Quick Intro', content: 'Robin van CrescoFlow hier! Heb je even tijd?', type: 'sms' }
  ]);

  const [userConfig, setUserConfig] = useState<UserConfig>({
    username: 'Enterprise Admin',
    email: userEmail || '',
    ghlApiKey: '',
    integrations: { ghl: true }
  });

  const [syncState, setSyncState] = useState<'loading' | 'synced' | 'saving' | 'offline'>('loading');
  const syncedRef = useRef<Map<string, string>>(new Map());
  const loadedRef = useRef(false);

  useEffect(() => {
    const startup = async () => {
      await initializeCloudConnection();
      const local = await getLeadsFromCloud();
      try {
        const [remote, savedScripts, savedConfig] = await Promise.all([
          fetchRemoteLeads(),
          fetchSetting<typeof scripts>('scripts'),
          fetchSetting<UserConfig>('userConfig'),
        ]);
        const merged = new Map(remote.map(l => [l.id, l]));
        remote.forEach(l => syncedRef.current.set(l.id, JSON.stringify(l)));
        // Leads that only exist in this browser (e.g. from before cloud sync) are kept and uploaded.
        local.forEach(l => { if (!merged.has(l.id)) merged.set(l.id, l); });
        setAllLeads([...merged.values()]);
        if (savedScripts) setScripts(savedScripts);
        if (savedConfig) setUserConfig(savedConfig);
        setSyncState('synced');
      } catch (e) {
        console.error('[Supabase] Initial load failed, using local cache', e);
        setAllLeads(local);
        setSyncState('offline');
      }
      loadedRef.current = true;
    };
    startup();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    if (allLeads.length > 0) saveLeadsToCloud(allLeads);
    const changed = diffLeads(allLeads, syncedRef.current);
    if (changed.length === 0) return;
    const t = window.setTimeout(async () => {
      setSyncState('saving');
      try {
        await pushLeads(changed);
        changed.forEach(l => syncedRef.current.set(l.id, JSON.stringify(l)));
        setSyncState('synced');
      } catch (e) {
        console.error('[Supabase] Lead sync failed', e);
        setSyncState('offline');
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [allLeads]);

  useEffect(() => {
    if (!loadedRef.current) return;
    const t = window.setTimeout(() => {
      saveSetting('scripts', scripts).catch(e => console.error('[Supabase] Scripts sync failed', e));
      saveSetting('userConfig', userConfig).catch(e => console.error('[Supabase] Config sync failed', e));
    }, 1500);
    return () => clearTimeout(t);
  }, [scripts, userConfig]);

  useEffect(() => {
    let timeoutId: number;
    const runWorker = async () => {
      if (!isWorkerActive) return;

      if (scrapingQueue.length > 0) {
        setWorkerStatus(`Discovery: ${scrapingQueue[0].sector} in ${scrapingQueue[0].location}`);
        const task = scrapingQueue[0];
        try {
          const found = await discoverLeadsBatch(task.sector, task.location);
          const filteredFound = found.filter(f => !allLeads.some(l => l.companyName.toLowerCase() === f.companyName?.toLowerCase()));
          setEnrichmentQueue(prev => [...prev, ...filteredFound]);
        } catch (e) { console.error(e); }
        setScrapingQueue(prev => prev.slice(1));
        timeoutId = window.setTimeout(runWorker, 10000);
        return;
      }

      if (enrichmentQueue.length > 0) {
        const leadToEnrich = enrichmentQueue[0];
        setWorkerStatus(`Neural Audit: ${leadToEnrich.companyName}`);
        try {
          const fullyEnriched = await enrichLeadNeural(leadToEnrich);
          setAllLeads(prev => {
            const exists = prev.find(l => l.companyName === fullyEnriched.companyName);
            return exists ? prev.map(l => l.id === exists.id ? fullyEnriched : l) : [...prev, fullyEnriched];
          });
        } catch (e) { console.error(e); }
        setEnrichmentQueue(prev => prev.slice(1));
        timeoutId = window.setTimeout(runWorker, 12000);
        return;
      }

      setWorkerStatus('Monitor Mode');
      setIsWorkerActive(false);
    };

    if (isWorkerActive || enrichmentQueue.length > 0) {
      if (!isWorkerActive) setIsWorkerActive(true);
      runWorker();
    }
    return () => clearTimeout(timeoutId);
  }, [isWorkerActive, scrapingQueue, enrichmentQueue, allLeads]);

  const handleUpdateLeads = (updated: Lead[]) => {
    setAllLeads(prev => {
      const copy = [...prev];
      updated.forEach(u => {
        const idx = copy.findIndex(l => l.id === u.id);
        if (idx > -1) copy[idx] = u;
        else copy.push(u);
      });
      return copy;
    });
  };

  const handleStartScraping = (filters: FilterState) => {
    const sectors = (filters.sectors && filters.sectors.length > 0) ? filters.sectors : [filters.sector || ''];
    const locations = (filters.locations && filters.locations.length > 0) ? filters.locations : [filters.location || ''];
    const tasks = sectors.flatMap(s => locations.map(l => ({ sector: s, location: l })));
    setScrapingQueue(prev => [...prev, ...tasks]);
    setIsWorkerActive(true);
  };

  return (
    <div className="flex min-h-screen bg-white font-sans text-stone-800 overflow-hidden">
      <Sidebar activeApp={activeApp} setActiveApp={setActiveApp} totalLeadsCount={allLeads.length} isScraping={isWorkerActive} syncState={syncState} onSignOut={() => supabase.auth.signOut()} />

      <div className="flex-1 lg:ml-60 flex flex-col h-screen overflow-hidden relative">
        {isWorkerActive && (
          <div className="fixed bottom-4 right-4 z-[300] bg-white border border-stone-200 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
            <span className="text-stone-700">{workerStatus}</span>
            <span className="text-stone-400">· {scrapingQueue.length + enrichmentQueue.length} in wachtrij</span>
          </div>
        )}

        <main className="flex-1 overflow-hidden relative">
          {activeApp === 'dashboard' && <Dashboard isSystemOnline={true} onUpdateLeads={handleUpdateLeads} allLeads={allLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'lead-scraper' && <Scraper onStartBackground={handleStartScraping} onStopBackground={() => setIsWorkerActive(false)} isBackgroundActive={isWorkerActive} queueLength={scrapingQueue.length + enrichmentQueue.length} masterDatabase={allLeads} onLeadsFound={() => { }} />}
          {activeApp === 'database' && <LeadDatabase allLeads={allLeads} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} onManualImport={(leads) => { setEnrichmentQueue(prev => [...prev, ...leads]); setIsWorkerActive(true); }} />}
          {activeApp === 'cold-calls' && <ColdCallCenter leads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'email-pipeline' && <EmailOutreach allLeads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'sms-pipeline' && <SMSInbox leads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'sms-launch' && <SMSLaunchPad leads={allLeads} onUpdateLeads={handleUpdateLeads} />}
          {activeApp === 'follow-up' && <FollowUp leads={allLeads} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'sales-meet' && <SalesMeet sessions={[]} setSessions={() => { }} allLeads={allLeads} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'agenda' && <Agenda tasks={[]} setTasks={() => { }} leads={allLeads} />}
          {activeApp === 'ai-coach' && <AICoach allLeads={allLeads} />}
          {activeApp === 'facebook-funnel' && <FacebookPipeline conversations={[]} allLeads={allLeads} onUpdateLeads={handleUpdateLeads} />}
          {activeApp === 'ghl-manager' && <GHLManager leads={allLeads} onUpdateLeads={handleUpdateLeads} />}
          {activeApp === 'imessage-inbox' && <ImessageInbox leads={allLeads} />}
          {activeApp === 'settings' && <Settings config={userConfig} onUpdateConfig={setUserConfig} />}
        </main>

        {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdateLead={(u) => handleUpdateLeads([u])} />}
        <ChatBot />
      </div>
    </div>
  );
};

export default App;

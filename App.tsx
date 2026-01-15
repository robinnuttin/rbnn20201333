
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadDatabase from './components/LeadDatabase';
import Scraper from './components/Scraper';
import ColdCallCenter from './components/ColdCallCenter';
import EmailOutreach from './components/EmailOutreach';
import SMSInbox from './components/SMSInbox';
import FollowUp from './components/FollowUp';
import SalesMeet from './components/SalesMeet';
import Agenda from './components/Agenda';
import ChatBot from './components/ChatBot';
import AICoach from './components/AICoach';
import FacebookPipeline from './components/FacebookPipeline';
import GHLManager from './components/GHLManager';
import LeadDetailModal from './components/LeadDetailModal';
import Settings from './components/Settings';
import { Lead, FilterState, UserConfig } from './types';
import { discoverLeadsBatch, enrichLeadNeural } from './services/geminiService';
import { saveLeadsToCloud, getLeadsFromCloud, initializeCloudConnection } from './services/cloudPersistenceService';

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState('dashboard');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isWorkerActive, setIsWorkerActive] = useState(false);
  const [workerStatus, setWorkerStatus] = useState('Standby');
  const [scrapingQueue, setScrapingQueue] = useState<{sector: string, location: string}[]>([]);
  const [enrichmentQueue, setEnrichmentQueue] = useState<Partial<Lead>[]>([]);
  
  const [scripts, setScripts] = useState<{id: string, title: string, content: string, type: 'call' | 'email' | 'sms'}[]>([
    { id: '1', title: 'Standaard Call Script', content: 'Hoi {{ceo_name}}, ik zag jullie website...', type: 'call' },
    { id: '2', title: 'Cold Email V1', content: 'Beste {{ceo_name}}, we hebben een audit gedaan...', type: 'email' },
    { id: '3', title: 'SMS Quick Intro', content: 'Robin van CrescoFlow hier! Heb je even tijd?', type: 'sms' }
  ]);

  const [userConfig, setUserConfig] = useState<UserConfig>({
    username: 'Enterprise Admin',
    email: 'admin@crescoflow.be',
    ghlApiKey: 'pit-fc316bc9-4464-46eb-98a8-dc96f326f1a6',
    integrations: { ghl: true }
  });

  useEffect(() => {
    const startup = async () => {
      await initializeCloudConnection();
      const leads = await getLeadsFromCloud();
      setAllLeads(leads);
    };
    startup();
  }, []);

  useEffect(() => {
    if (allLeads.length > 0) {
      saveLeadsToCloud(allLeads);
    }
  }, [allLeads]);

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
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeApp={activeApp} setActiveApp={setActiveApp} totalLeadsCount={allLeads.length} isScraping={isWorkerActive} />
      
      <div className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden relative">
        {isWorkerActive && (
          <div className="fixed top-6 right-6 z-[300] bg-slate-900 text-white px-8 py-4 rounded-[30px] shadow-4xl border-l-[10px] border-blue-500 animate-slide-up flex items-center gap-6">
             <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
             <div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Engine Active</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">{workerStatus}</div>
             </div>
             <div className="text-right border-l border-white/10 pl-6">
                <div className="text-[8px] font-black text-slate-500 uppercase">Wachtrij</div>
                <div className="text-xs font-black">{scrapingQueue.length + enrichmentQueue.length}</div>
             </div>
          </div>
        )}

        <main className="flex-1 overflow-hidden relative">
          {activeApp === 'dashboard' && <Dashboard isSystemOnline={true} onUpdateLeads={handleUpdateLeads} allLeads={allLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'lead-scraper' && <Scraper onStartBackground={handleStartScraping} onStopBackground={() => setIsWorkerActive(false)} isBackgroundActive={isWorkerActive} queueLength={scrapingQueue.length + enrichmentQueue.length} masterDatabase={allLeads} onLeadsFound={() => {}} />}
          {activeApp === 'database' && <LeadDatabase allLeads={allLeads} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} onManualImport={(leads) => { setEnrichmentQueue(prev => [...prev, ...leads]); setIsWorkerActive(true); }} />}
          {activeApp === 'cold-calls' && <ColdCallCenter leads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'email-pipeline' && <EmailOutreach allLeads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'sms-pipeline' && <SMSInbox leads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'follow-up' && <FollowUp leads={allLeads} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'sales-meet' && <SalesMeet sessions={[]} setSessions={() => {}} allLeads={allLeads} onUpdateLeads={handleUpdateLeads} onLeadClick={setSelectedLead} />}
          {activeApp === 'agenda' && <Agenda tasks={[]} setTasks={() => {}} leads={allLeads} />}
          {activeApp === 'ai-coach' && <AICoach allLeads={allLeads} />}
          {activeApp === 'facebook-funnel' && <FacebookPipeline conversations={[]} allLeads={allLeads} onUpdateLeads={handleUpdateLeads} />}
          {activeApp === 'ghl-manager' && <GHLManager leads={allLeads} onUpdateLeads={handleUpdateLeads} />}
          {activeApp === 'settings' && <Settings config={userConfig} onUpdateConfig={setUserConfig} />}
        </main>

        {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdateLead={(u) => handleUpdateLeads([u])} />}
        <ChatBot />
      </div>
    </div>
  );
};

export default App;

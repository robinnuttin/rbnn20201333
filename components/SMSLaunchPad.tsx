import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import {
  smsService,
  smsQueueService,
  smsStorage,
  type SMSQueue,
} from '../services/communication/smsService';

interface Props {
  leads: Lead[];
  onUpdateLeads?: (leads: Lead[]) => void;
}

const SMSLaunchPad: React.FC<Props> = ({ leads, onUpdateLeads }) => {
  const [template, setTemplate] = useState(
    'Hoi {{ceo_name}}, ik zag jullie {{sector}} bedrijf in {{city}}. Kort vraag?'
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{
    added: number;
    queued: number;
    overflow: number;
    error?: string;
  } | null>(null);

  const smsData = useMemo(() => smsStorage.load(), []);
  const dailyUsage = useMemo(
    () =>
      smsQueueService.calculateDailyUsage(
        smsData.queue,
        new Date()
      ),
    [smsData.queue]
  );

  const qualifiedLeads = useMemo(
    () =>
      leads.filter((lead) => {
        // Has phone
        if (!lead.ceoPhone && !lead.companyContact?.phone) return false;
        // Not already queued
        if (smsData.queue.some((q) => q.leadId === lead.id)) return false;
        // Cold pipeline
        if (lead.pipelineTag !== 'cold') return false;
        // High confidence
        if ((lead.confidenceScore || 0) < 40) return false;
        return true;
      }),
    [leads, smsData.queue]
  );

  const handleLaunchCampaign = async () => {
    if (!template.trim()) {
      setLaunchResult({
        added: 0,
        queued: 0,
        overflow: 0,
        error: 'Vul een bericht in',
      });
      return;
    }

    setIsLaunching(true);
    try {
      // Generate queue items
      const newItems = smsQueueService.autoImportLeads(
        qualifiedLeads,
        template,
        smsData.queue
      );

      const todayCount = newItems.filter((item) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const itemDate = new Date(item.scheduledDate);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      }).length;

      const overflowCount = newItems.length - todayCount;

      // Save updated queue
      const updatedQueue = [...smsData.queue, ...newItems];
      smsStorage.save({
        ...smsData,
        queue: updatedQueue,
      });

      setLaunchResult({
        added: newItems.length,
        queued: todayCount,
        overflow: overflowCount,
      });

      // Reset
      setTemplate(
        'Hoi {{ceo_name}}, ik zag jullie {{sector}} bedrijf in {{city}}. Kort vraag?'
      );
    } catch (err) {
      setLaunchResult({
        added: 0,
        queued: 0,
        overflow: 0,
        error: err instanceof Error ? err.message : 'Error launching campaign',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const nextSendTime = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Suggest next 9 AM window
    if (hour < 9) {
      const nextSend = new Date(now);
      nextSend.setHours(9, 0, 0, 0);
      return nextSend;
    }
    if (hour >= 17) {
      const nextSend = new Date(now);
      nextSend.setDate(nextSend.getDate() + 1);
      nextSend.setHours(9, 0, 0, 0);
      return nextSend;
    }

    return now;
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-10 lg:p-16 bg-white border-b-2 border-slate-200 shadow-2xl">
        <div className="space-y-6">
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            📱 SMS Launch Pad
          </h2>
          <p className="text-slate-500 text-lg max-w-3xl">
            Lanceer bulk SMS campagnes met intelligente queue management. Max 75
            per dag.
          </p>

          {/* Daily Capacity Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Vandaag's Capaciteit
              </span>
              <span className="text-sm font-black text-slate-900">
                {dailyUsage.used}/{dailyUsage.remaining} beschikbaar
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  dailyUsage.percentage < 50
                    ? 'bg-emerald-500'
                    : dailyUsage.percentage < 80
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${dailyUsage.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
          {/* Message Template */}
          <div className="bg-white p-14 rounded-[40px] shadow-xl border-2 border-slate-100 space-y-8">
            <div className="space-y-3">
              <h3 className="text-xl font-black uppercase italic text-slate-900">
                📝 Bericht Template
              </h3>
              <p className="text-[12px] text-slate-500 uppercase tracking-wider">
                Gebruik {{ceo_name}}, {{company_name}}, {{sector}}, {{city}}
              </p>
            </div>

            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Typ je bericht..."
              className="w-full h-32 bg-slate-50 p-6 rounded-3xl font-bold border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
            />

            {/* Preview */}
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Preview
              </p>
              <div className="bg-slate-900 text-white p-6 rounded-2xl text-sm italic">
                {smsService.personalizeMessage(template, leads[0] || {})}
              </div>
            </div>
          </div>

          {/* Qualified Leads */}
          <div className="bg-white p-14 rounded-[40px] shadow-xl border-2 border-slate-100 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic text-slate-900">
                ✅ Gekwalificeerde Leads
              </h3>
              <span className="bg-blue-100 text-blue-900 px-6 py-2 rounded-full font-black text-sm">
                {qualifiedLeads.length} beschikbaar
              </span>
            </div>

            {qualifiedLeads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg italic">
                  Geen gekwalificeerde leads gevonden
                </p>
                <p className="text-[12px] text-slate-400 mt-2">
                  Zorg dat leads: telefoonnummer hebben, cold pipeline, + 40%
                  confidence
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {qualifiedLeads.slice(0, 10).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl"
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {lead.companyName}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {lead.ceoPhone || lead.companyContact?.phone}
                      </p>
                    </div>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
                      {Math.round(lead.confidenceScore || 0)}%
                    </span>
                  </div>
                ))}
                {qualifiedLeads.length > 10 && (
                  <p className="text-center text-[12px] text-slate-500 italic pt-2">
                    ... en {qualifiedLeads.length - 10} meer
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Launch Result */}
          {launchResult && (
            <div
              className={`p-10 rounded-[30px] border-2 space-y-4 ${
                launchResult.error
                  ? 'bg-red-50 border-red-300'
                  : 'bg-emerald-50 border-emerald-300'
              }`}
            >
              {launchResult.error ? (
                <div>
                  <p className="font-black text-red-900">❌ Error</p>
                  <p className="text-red-700 text-sm mt-1">{launchResult.error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-4xl font-black text-emerald-600">
                      {launchResult.queued}
                    </p>
                    <p className="text-[11px] font-black text-emerald-900 uppercase mt-1">
                      Vandaag
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-black text-amber-600">
                      {launchResult.overflow}
                    </p>
                    <p className="text-[11px] font-black text-amber-900 uppercase mt-1">
                      Morgen+
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-black text-slate-600">
                      {launchResult.added}
                    </p>
                    <p className="text-[11px] font-black text-slate-900 uppercase mt-1">
                      Totaal
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Send Time */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-10 rounded-[40px] text-white space-y-4 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-80">
              Volgende Planning
            </p>
            <p className="text-3xl font-black italic">
              {nextSendTime.toLocaleTimeString('nl-BE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-[12px] opacity-90">
              Berichten worden om 9:00 AM per batch verzonden
            </p>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunchCampaign}
            disabled={isLaunching || qualifiedLeads.length === 0}
            className={`w-full py-8 rounded-[50px] font-black uppercase text-[12px] tracking-[0.3em] transition-all shadow-2xl ${
              isLaunching || qualifiedLeads.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:scale-95'
            }`}
          >
            {isLaunching ? '⏳ Bezig...' : '🚀 Launch SMS Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSLaunchPad;

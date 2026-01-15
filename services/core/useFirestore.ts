import { useEffect, useState, useCallback, useRef } from 'react';
import {
  leadsService,
  emailService,
  campaignService,
  smsService,
  scraperService,
  Lead,
  EmailAccount,
  EmailCampaign,
  EmailInboxMessage,
  Campaign,
  SMSQueue,
  SMSConversation,
  ScraperJob,
} from './firestoreService';
import { Unsubscribe, QueryConstraint, where, orderBy } from 'firebase/firestore';

// ============================================================================
// useLeads Hook - Real-time lead list
// ============================================================================

export function useLeads(constraints: QueryConstraint[] = []) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      unsubscribeRef.current = leadsService.onLeadsSnapshot(
        (data) => {
          setLeads(data);
          setLoading(false);
        },
        constraints
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return { leads, loading, error };
}

// ============================================================================
// useLead Hook - Single lead with updates
// ============================================================================

export function useLead(leadId: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const data = await leadsService.getLead(leadId);
        setLead(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  const updateLead = useCallback(
    async (updates: Partial<Lead>) => {
      try {
        await leadsService.updateLead(leadId, updates);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    [leadId]
  );

  return { lead, loading, error, updateLead };
}

// ============================================================================
// useEmailAccounts Hook - Real-time email accounts
// ============================================================================

export function useEmailAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await emailService.getEmailAccounts();
        setAccounts(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const addAccount = useCallback(async (account: EmailAccount) => {
    try {
      await emailService.upsertEmailAccount(account);
      const updated = await emailService.getEmailAccounts();
      setAccounts(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, []);

  return { accounts, loading, error, addAccount };
}

// ============================================================================
// useCampaigns Hook - Real-time campaigns
// ============================================================================

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      unsubscribeRef.current = campaignService.onCampaignsSnapshot((data) => {
        setCampaigns(data);
        setLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const createCampaign = useCallback(async (campaign: Campaign) => {
    try {
      await campaignService.createCampaign(campaign);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  }, []);

  return { campaigns, loading, error, createCampaign };
}

// ============================================================================
// useEmailInbox Hook - Real-time email messages
// ============================================================================

export function useEmailInbox(leadId?: string) {
  const [messages, setMessages] = useState<EmailInboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      unsubscribeRef.current = emailService.onEmailInboxSnapshot(
        (data) => {
          setMessages(data);
          setLoading(false);
        },
        leadId
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [leadId]);

  return { messages, loading, error };
}

// ============================================================================
// useSMSConversation Hook - Real-time SMS conversation
// ============================================================================

export function useSMSConversation(leadId: string) {
  const [conversation, setConversation] = useState<SMSConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      unsubscribeRef.current = smsService.onSMSConversationSnapshot(
        leadId,
        (data) => {
          setConversation(data);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [leadId]);

  return { conversation, loading, error };
}

// ============================================================================
// useScraperJob Hook - Real-time scraper job status
// ============================================================================

export function useScraperJob(jobId: string) {
  const [job, setJob] = useState<ScraperJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    try {
      unsubscribeRef.current = scraperService.onScraperJobSnapshot(jobId, (data) => {
        setJob(data);
        setLoading(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [jobId]);

  return { job, loading, error };
}

// ============================================================================
// useLeadSearch Hook - Search leads with constraints
// ============================================================================

export function useLeadSearch(constraints: QueryConstraint[]) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const searchLeads = async () => {
      setLoading(true);
      try {
        const results = await leadsService.searchLeads(constraints);
        setLeads(results);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    searchLeads();
  }, [JSON.stringify(constraints)]);

  return { leads, loading, error };
}

// ============================================================================
// useSMSQueue Hook - SMS queue for a specific date
// ============================================================================

export function useSMSQueue(date: Date) {
  const [queue, setQueue] = useState<SMSQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await smsService.getSMSQueue(date);
        setQueue(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    fetchQueue();
  }, [date.toDateString()]);

  return { queue, loading, error };
}

// ============================================================================
// Async functions for mutations (used in components)
// ============================================================================

export const firestoreMutations = {
  createLead: leadsService.upsertLead,
  updateLead: leadsService.updateLead,
  deleteLead: leadsService.deleteLead,
  batchUpsertLeads: leadsService.batchUpsertLeads,
  createEmailCampaign: emailService.createEmailCampaign,
  createCampaign: campaignService.createCampaign,
  createScraperJob: scraperService.createScraperJob,
  updateScraperJobProgress: scraperService.updateScraperJobProgress,
  addToSMSQueue: smsService.addToSMSQueue,
};

import {
  initializeApp,
  FirebaseApp,
  getApps,
} from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  Unsubscribe,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';

// ============================================================================
// Firebase Configuration & Initialization
// ============================================================================

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initializeFirebase = (config: FirebaseConfig) => {
  if (getApps().length > 0) {
    app = getApps()[0];
    db = getFirestore(app);
    return { app, db };
  }

  app = initializeApp(config);
  db = getFirestore(app);
  return { app, db };
};

export const getFirebaseDB = (): Firestore => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase first.');
  }
  return db;
};

// ============================================================================
// Type Definitions
// ============================================================================

export interface Lead extends DocumentData {
  id: string;
  companyName: string;
  sector: string;
  city: string;
  address?: string;
  website?: string;

  // Contact info
  ceo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };

  // Financial data (KBO)
  financials?: {
    revenue_yearly?: number;
    revenue_monthly?: number;
    employee_count?: number;
    last_financial_year?: string;
  };

  // Ad history
  ad_history?: {
    google_ads?: { active: boolean; last_seen?: Date };
    meta_ads?: { active: boolean; last_seen?: Date };
  };

  // Website analysis
  website_analysis?: {
    seo_score?: number;
    performance_score?: number;
    mobile_friendly?: boolean;
    issues?: string[];
  };

  // AI insights
  pain_points?: string[];
  revenue_opportunities?: string[];

  // Pipeline
  pipelineTag?: string;
  outboundChannel?: string;
  confidenceScore?: number;

  // Sync
  ghlContactId?: string;
  ghlSynced?: boolean;
  lastGHLSync?: Date;

  // Scraping
  scrapedAt?: Date;
  sourceHash?: string;
  scrapeSources?: string[];
}

export interface EmailAccount extends DocumentData {
  id: string;
  email: string;
  provider: 'smtp' | 'instantly';
  smtp_config?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  imap_config?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  health: {
    deliverability_score: number;
    spam_score: number;
    daily_limit: number;
    sent_today: number;
  };
  klaviyo_list_id?: string;
  created_at?: Date;
}

export interface EmailCampaign extends DocumentData {
  id: string;
  name: string;
  mode: 'instantly' | 'smtp';
  email_accounts: string[];
  leads: string[];
  subject: string;
  body: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
  };
  created_at?: Date;
  launched_at?: Date;
}

export interface EmailInboxMessage extends DocumentData {
  id: string;
  campaign_id?: string;
  lead_id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp?: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentiment_confidence?: number;
  source: 'instantly' | 'smtp';
  reply_to_message_id?: string;
}

export interface SMSQueue extends DocumentData {
  id: string;
  lead_id: string;
  scheduled_date: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  message: string;
  sent_at?: Date;
  delivered_at?: Date;
}

export interface SMSConversation extends DocumentData {
  id: string;
  lead_id: string;
  phone: string;
  messages: Array<{
    role: 'user' | 'system';
    content: string;
    timestamp: Date;
  }>;
  sentiment?: 'positive' | 'negative' | 'neutral';
  last_reply_at?: Date;
}

export interface Campaign extends DocumentData {
  id: string;
  type: 'email' | 'sms' | 'call';
  name: string;
  leads_count: number;
  stats: {
    sent: number;
    delivered: number;
    replied: number;
    booked: number;
  };
  created_at?: Date;
  launched_at?: Date;
  archived: boolean;
}

export interface ScraperJob extends DocumentData {
  id: string;
  sector: string;
  location: string;
  sources: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total_sources: number;
    completed_sources: number;
    leads_found: number;
    leads_enriched: number;
  };
  started_at?: Date;
  completed_at?: Date;
  error?: string;
}

// ============================================================================
// Lead Operations (Most Frequent)
// ============================================================================

export const leadsService = {
  /**
   * Create or update a single lead
   * Cost: 1 write
   */
  async upsertLead(lead: Lead): Promise<void> {
    const db = getFirebaseDB();
    const leadRef = doc(db, 'leads', lead.id);
    await setDoc(
      leadRef,
      {
        ...lead,
        scrapedAt: lead.scrapedAt || Timestamp.now(),
      },
      { merge: true }
    );
  },

  /**
   * Batch upsert leads (cost-efficient for multiple leads)
   * Cost: 1 write per lead (batched reduces roundtrips)
   */
  async batchUpsertLeads(leads: Lead[]): Promise<void> {
    const db = getFirebaseDB();
    const batch = writeBatch(db);

    leads.forEach((lead) => {
      const leadRef = doc(db, 'leads', lead.id);
      batch.set(
        leadRef,
        {
          ...lead,
          scrapedAt: lead.scrapedAt || Timestamp.now(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  },

  /**
   * Get single lead by ID
   * Cost: 1 read
   */
  async getLead(leadId: string): Promise<Lead | null> {
    const db = getFirebaseDB();
    const leadRef = doc(db, 'leads', leadId);
    const snapshot = await getDoc(leadRef);
    return snapshot.exists() ? (snapshot.data() as Lead) : null;
  },

  /**
   * Get all leads (paginated to control costs)
   * Cost: 1 read per page
   */
  async getLeads(pageSize: number = 100, lastLead?: Lead): Promise<Lead[]> {
    const db = getFirebaseDB();
    const leadsRef = collection(db, 'leads');

    let q;
    if (lastLead) {
      q = query(
        leadsRef,
        orderBy('scrapedAt', 'desc'),
        startAfter(lastLead.scrapedAt || Timestamp.now()),
        limit(pageSize)
      );
    } else {
      q = query(leadsRef, orderBy('scrapedAt', 'desc'), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Lead);
  },

  /**
   * Search leads by multiple criteria
   * Cost: 1 read (Firestore indexes required for multi-field queries)
   */
  async searchLeads(
    constraints: QueryConstraint[],
    pageSize: number = 50
  ): Promise<Lead[]> {
    const db = getFirebaseDB();
    const leadsRef = collection(db, 'leads');
    const q = query(leadsRef, ...constraints, limit(pageSize));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Lead);
  },

  /**
   * Update specific fields in a lead
   * Cost: 1 write
   */
  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    const db = getFirebaseDB();
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, updates);
  },

  /**
   * Delete a lead
   * Cost: 1 write
   */
  async deleteLead(leadId: string): Promise<void> {
    const db = getFirebaseDB();
    const leadRef = doc(db, 'leads', leadId);
    await deleteDoc(leadRef);
  },

  /**
   * Real-time listener for all leads
   * Cost: 1 read per snapshot
   * Use wisely - consider query constraints for large collections
   */
  onLeadsSnapshot(
    callback: (leads: Lead[]) => void,
    constraints: QueryConstraint[] = []
  ): Unsubscribe {
    const db = getFirebaseDB();
    const leadsRef = collection(db, 'leads');
    const q =
      constraints.length > 0 ? query(leadsRef, ...constraints) : query(leadsRef);

    return onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map((doc) => doc.data() as Lead);
      callback(leads);
    });
  },

  /**
   * Get leads count (uses a special counter document to avoid document reads)
   * Cost: 1 read per counter update
   */
  async getLeadsCount(): Promise<number> {
    const db = getFirebaseDB();
    const statsRef = doc(db, '_stats', 'leads_count');
    const snapshot = await getDoc(statsRef);
    return snapshot.exists() ? snapshot.data().count || 0 : 0;
  },
};

// ============================================================================
// Email Operations
// ============================================================================

export const emailService = {
  /**
   * Create/update email account
   * Cost: 1 write
   */
  async upsertEmailAccount(account: EmailAccount): Promise<void> {
    const db = getFirebaseDB();
    const accountRef = doc(db, 'email_accounts', account.id);
    await setDoc(accountRef, account, { merge: true });
  },

  /**
   * Get all email accounts
   * Cost: 1 read (typically < 20 accounts)
   */
  async getEmailAccounts(): Promise<EmailAccount[]> {
    const db = getFirebaseDB();
    const accountsRef = collection(db, 'email_accounts');
    const snapshot = await getDocs(query(accountsRef));
    return snapshot.docs.map((doc) => doc.data() as EmailAccount);
  },

  /**
   * Batch create email campaigns
   * Cost: 1 write per campaign
   */
  async createEmailCampaign(campaign: EmailCampaign): Promise<void> {
    const db = getFirebaseDB();
    const campaignRef = doc(db, 'email_campaigns', campaign.id);
    await setDoc(campaignRef, campaign);
  },

  /**
   * Get email inbox messages (paginated)
   * Cost: 1 read per page
   */
  async getEmailInbox(
    leadId?: string,
    pageSize: number = 50
  ): Promise<EmailInboxMessage[]> {
    const db = getFirebaseDB();
    const inboxRef = collection(db, 'email_inbox');

    let q;
    if (leadId) {
      q = query(
        inboxRef,
        where('lead_id', '==', leadId),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );
    } else {
      q = query(
        inboxRef,
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as EmailInboxMessage);
  },

  /**
   * Real-time listener for email inbox
   * Cost: 1 read per snapshot
   */
  onEmailInboxSnapshot(
    callback: (messages: EmailInboxMessage[]) => void,
    leadId?: string
  ): Unsubscribe {
    const db = getFirebaseDB();
    const inboxRef = collection(db, 'email_inbox');

    let q;
    if (leadId) {
      q = query(
        inboxRef,
        where('lead_id', '==', leadId),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(inboxRef, orderBy('timestamp', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data() as EmailInboxMessage);
      callback(messages);
    });
  },
};

// ============================================================================
// SMS Operations
// ============================================================================

export const smsService = {
  /**
   * Add leads to SMS queue
   * Cost: 1 write per lead
   */
  async addToSMSQueue(queueItems: SMSQueue[]): Promise<void> {
    const db = getFirebaseDB();
    const batch = writeBatch(db);

    queueItems.forEach((item) => {
      const queueRef = doc(db, 'sms_queue', item.id);
      batch.set(queueRef, item);
    });

    await batch.commit();
  },

  /**
   * Get SMS queue for a specific date
   * Cost: 1 read
   */
  async getSMSQueue(date: Date): Promise<SMSQueue[]> {
    const db = getFirebaseDB();
    const queueRef = collection(db, 'sms_queue');
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      queueRef,
      where('scheduled_date', '>=', startOfDay),
      where('scheduled_date', '<=', endOfDay),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as SMSQueue);
  },

  /**
   * Real-time listener for SMS inbox conversations
   * Cost: 1 read per snapshot
   */
  onSMSConversationSnapshot(
    leadId: string,
    callback: (conversation: SMSConversation | null) => void
  ): Unsubscribe {
    const db = getFirebaseDB();
    const conversationRef = doc(db, 'sms_conversations', leadId);

    return onSnapshot(conversationRef, (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as SMSConversation) : null);
    });
  },
};

// ============================================================================
// Campaign Operations
// ============================================================================

export const campaignService = {
  /**
   * Create campaign
   * Cost: 1 write
   */
  async createCampaign(campaign: Campaign): Promise<void> {
    const db = getFirebaseDB();
    const campaignRef = doc(db, 'campaigns', campaign.id);
    await setDoc(campaignRef, campaign);
  },

  /**
   * Get all campaigns
   * Cost: 1 read
   */
  async getCampaigns(): Promise<Campaign[]> {
    const db = getFirebaseDB();
    const campaignsRef = collection(db, 'campaigns');
    const snapshot = await getDocs(query(campaignsRef));
    return snapshot.docs.map((doc) => doc.data() as Campaign);
  },

  /**
   * Real-time listener for campaigns
   * Cost: 1 read per snapshot
   */
  onCampaignsSnapshot(callback: (campaigns: Campaign[]) => void): Unsubscribe {
    const db = getFirebaseDB();
    const campaignsRef = collection(db, 'campaigns');

    return onSnapshot(query(campaignsRef), (snapshot) => {
      const campaigns = snapshot.docs.map((doc) => doc.data() as Campaign);
      callback(campaigns);
    });
  },
};

// ============================================================================
// Scraper Job Operations
// ============================================================================

export const scraperService = {
  /**
   * Create scraper job
   * Cost: 1 write
   */
  async createScraperJob(job: ScraperJob): Promise<void> {
    const db = getFirebaseDB();
    const jobRef = doc(db, 'scraper_jobs', job.id);
    await setDoc(jobRef, job);
  },

  /**
   * Update scraper job progress
   * Cost: 1 write
   */
  async updateScraperJobProgress(
    jobId: string,
    progress: Partial<ScraperJob['progress']>
  ): Promise<void> {
    const db = getFirebaseDB();
    const jobRef = doc(db, 'scraper_jobs', jobId);
    await updateDoc(jobRef, { progress });
  },

  /**
   * Real-time listener for scraper job
   * Cost: 1 read per snapshot
   */
  onScraperJobSnapshot(
    jobId: string,
    callback: (job: ScraperJob | null) => void
  ): Unsubscribe {
    const db = getFirebaseDB();
    const jobRef = doc(db, 'scraper_jobs', jobId);

    return onSnapshot(jobRef, (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as ScraperJob) : null);
    });
  },
};

// ============================================================================
// Batch Operations (Cost-Efficient Bulk Updates)
// ============================================================================

export const batchOperations = {
  /**
   * Bulk update multiple leads
   * Cost: 1 write per lead (batched = fewer roundtrips)
   */
  async bulkUpdateLeads(updates: Array<{ id: string; data: Partial<Lead> }>) {
    const db = getFirebaseDB();
    const batch = writeBatch(db);

    updates.forEach(({ id, data }) => {
      const leadRef = doc(db, 'leads', id);
      batch.update(leadRef, data);
    });

    await batch.commit();
  },

  /**
   * Bulk sync leads to GHL
   * Cost: 1 write per lead (to update ghlSynced flag)
   */
  async bulkUpdateGHLSync(
    leadIds: string[],
    ghlContactIds: Record<string, string>
  ) {
    const db = getFirebaseDB();
    const batch = writeBatch(db);

    leadIds.forEach((leadId) => {
      const leadRef = doc(db, 'leads', leadId);
      batch.update(leadRef, {
        ghlSynced: true,
        ghlContactId: ghlContactIds[leadId],
        lastGHLSync: Timestamp.now(),
      });
    });

    await batch.commit();
  },
};

// ============================================================================
// Firestore Collection Initialization (Call once on app start)
// ============================================================================

export const initializeCollections = async () => {
  const db = getFirebaseDB();

  // Create collections with initial documents if needed
  const collections = [
    'leads',
    'email_accounts',
    'email_campaigns',
    'email_inbox',
    'sms_queue',
    'sms_conversations',
    'campaigns',
    'scraper_jobs',
    '_stats',
  ];

  // Just create collection references - Firestore creates collections on first write
  for (const collName of collections) {
    collection(db, collName);
  }
};

export default {
  initializeFirebase,
  getFirebaseDB,
  leadsService,
  emailService,
  smsService,
  campaignService,
  scraperService,
  batchOperations,
  initializeCollections,
};

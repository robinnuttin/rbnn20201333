
export type LeadSource = 'facebook' | 'email' | 'sms' | 'cold_call' | 'instagram' | 'referral' | 'other' | 'google_maps' | 'linkedin' | 'kbo' | 'companyweb';
export type CrescoProfile = 'foundation' | 'multiplier' | 'domination' | 'basic' | 'regular' | 'premium';
export type OutboundChannel = 'coldcall' | 'coldsms' | 'coldemail' | 'fb_messenger' | 'sales_call' | 'linkedin_dm';
export type PipelineStatus = 'cold' | 'warm' | 'hot' | 'appointment_booked' | 'closed' | 'not_interested' | 'reactivation' | 'sent' | 'replied' | 'no_show' | 'pending';
export type AnalyticsPeriod = 'week' | 'month' | '3_months' | 'year';

export interface Interaction {
  id: string;
  type: 'email' | 'sms' | 'call' | 'whatsapp' | 'messenger' | 'linkedin' | 'system';
  timestamp: string;
  outcome: string;
}

export interface Lead {
  id: string;
  companyName: string;
  sector: string;
  city: string;
  address: string;
  website: string;
  ceoName: string;
  ceoEmail: string;
  ceoPhone: string;
  companyContact: { email: string; phone: string; };
  socials: { instagram?: string; facebook?: string; linkedin?: string; };
  googleReviews?: { score: number; count: number; };
  websiteScore: number;
  seoScore: number;
  adStatus: 'active' | 'past' | 'none';
  adPlatforms: ('google' | 'meta')[];
  painPoints: string[];
  pipelineTag: PipelineStatus;
  outboundChannel: OutboundChannel;
  confidenceScore: number;
  scrapedAt: string;
  interactions: Interaction[];
  ghlSynced: boolean;
  ghlContactId?: string;
  analysis: {
    websiteScore: number;
    seoScore: number;
    offerReason: string;
    discoveryPath: string;
    seoStatus?: string;
    marketingBottlenecks?: string[];
    packageFit?: string;
  };
  crescoProfile?: CrescoProfile;
  phoneCompany?: string;
  emailCompany?: string;
  scheduledDate?: string;
  emailSentAt?: string;
  replyReceived?: boolean;
  replyDate?: string;
  ceo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedin?: string;
  };
  lastInteractionDate?: string;
  isValidated?: boolean;
  sourceHash?: string;
  isActive?: boolean;
  employeeCount?: string;
  revenueYearly?: string;
  revenueMonthly?: string;
  package?: string;
  relationshipStatus?: string;
  contactCount?: number;
  source?: LeadSource;
}

export interface FilterState {
  sectors: string[];
  locations: string[];
  sector?: string;
  location?: string;
  requireCeoName: boolean;
  requirePersonalPhone: boolean;
  requirePersonalEmail: boolean;
  requireLinkedIn: boolean;
  adStatus: 'active' | 'past' | 'none' | 'all';
  adPlatforms: ('google' | 'meta')[];
  minWebsiteScore: number;
  minSeoScore: number;
  enableWebsiteFilter: boolean;
  enableSeoFilter: boolean;
  crescoProfile?: CrescoProfile;
  phoneTypes?: string[];
  adTiming?: string;
  includeSmallTowns?: boolean;
  requireEmail?: boolean;
  requirePhone?: boolean;
  minReviewCount?: number;
  minReviewScore?: number;
  employeeCount?: string;
  selectedPackage?: string;
  minFte?: number;
  maxFte?: number;
}

export interface UserConfig {
  username: string;
  email: string;
  ghlApiKey: string;
  integrations: { ghl: boolean; };
  companyWebsite?: string;
  instantlyApiKey?: string;
  toneOfVoice?: string;
  documents?: any[];
  trainingData?: any[];
  tokens?: any;
}

export interface GHLMessage {
  id: string;
  body?: string;
  type: string;
  dateAdded?: string;
}

export interface GHLCustomValue {
  id: string;
  name: string;
  value: string;
  lastUpdated: string;
  history: { value: string; date: string }[];
}

export interface ChannelFunnel {
  id: string;
  channel: string;
  revenue: number;
  conversionRate: number;
  color: string;
  steps: {
    label: string;
    count: number;
    percentage: string;
    details: string;
    kpis: string[];
  }[];
}

export interface EmailAccount {
  id: string;
  email: string;
  provider: string;
  status: string;
  dailyLimit: number;
  sentToday: number;
}

export interface SMSCampaignRecord {
  id: string;
  name: string;
  type: 'manual' | 'ai_prompt';
  content: string;
  leadsCount: number;
  sentDate: string;
  stats: {
    sent: number;
    delivered: number;
    replied: number;
    positiveSentiment: number;
    negativeSentiment: number;
    booked: number;
    avgResponseTimeMinutes: number;
  };
}

export interface TrainingData {
  id: string;
  type: 'website' | 'pdf' | 'audio' | 'link';
  title: string;
  url?: string;
  size?: string;
  timestamp: string;
}

export interface FBConversation {
  id: string;
  leadName: string;
  summary: string;
  lastUpdate: string;
  interestScore: number;
  meetingBooked: boolean;
  contactInfoExchanged: { email?: string; phone?: string };
  transcript: { role: 'user' | 'bot'; text: string; timestamp: string }[];
}

export interface AccountData {
  leads: Lead[];
  campaigns: any[];
  fbConversations: FBConversation[];
  scripts: any[];
  sessions: MeetSession[];
  config: UserConfig;
}

export interface MeetSession {
  id: string;
  leadId: string;
  leadName: string;
  email: string;
  website: string;
  date: string;
  status: 'pending' | 'completed';
  leadSource: string;
  outcome: 'closed' | 'follow_up' | 'none';
  recordingUrl?: string;
  transcript: { role: 'user' | 'bot'; text: string; timestamp: string }[];
  aiAnalysis?: {
    summary: string;
    positives: string[];
    improvements: string[];
    keyTopics: string[];
    nextSteps: string[];
  };
  priority?: number;
}

export interface Task {
  id: string;
  title: string;
  start: string;
  end: string;
  leadId?: string;
}

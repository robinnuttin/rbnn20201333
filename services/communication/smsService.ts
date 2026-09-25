/**
 * SMS Service with MCP Integration
 *
 * Handles SMS sending via:
 * 1. MCP Server (Apple Messages)
 * 2. Queue management with 75/day limit
 * 3. Conversation tracking
 * 4. Auto-import from leads
 */

import type { Lead } from '../../types';

// ============================================================================
// Types & Constants
// ============================================================================

export interface SMSMessage {
  id: string;
  leadId: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  direction: 'outbound' | 'inbound';
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentAt?: Date;
}

export interface SMSQueue {
  id: string;
  leadId: string;
  companyName: string;
  phoneNumber: string;
  message: string;
  scheduledDate: Date;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  order: number;
  retryCount: number;
  error?: string;
}

export interface SMSConversation {
  leadId: string;
  phoneNumber: string;
  messages: SMSMessage[];
  lastMessageAt: Date;
  totalMessages: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'neutral';
}

const SMS_DAILY_LIMIT = 75;
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';
const MCP_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// SMS Service
// ============================================================================

export const smsService = {
  /**
   * Send SMS via MCP (Apple Messages)
   * Cost: ~1 API call per message
   */
  async sendSMS(phoneNumber: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 5) {
        return { success: false, error: 'Invalid phone number' };
      }

      // Validate message
      if (!message || message.length === 0) {
        return { success: false, error: 'Empty message' };
      }

      // Send via MCP
      const response = await fetch(`${MCP_SERVER_URL}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MCP_SERVER_TOKEN || ''}`,
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(MCP_TIMEOUT),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MCP Error: ${error}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('SMS send error:', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Personalize message with lead data
   */
  personalizeMessage(template: string, lead: Lead): string {
    let message = template;
    message = message.replace(/{{company_name}}/g, lead.companyName || '');
    message = message.replace(/{{ceo_name}}/g, lead.ceo?.firstName || 'there');
    message = message.replace(/{{sector}}/g, lead.sector || '');
    message = message.replace(/{{city}}/g, lead.city || '');
    return message;
  },

  /**
   * Extract phone numbers from lead
   */
  getPhoneNumbers(lead: Lead): string[] {
    const phones = [];
    if (lead.ceoPhone) phones.push(lead.ceoPhone);
    if (lead.companyContact?.phone) phones.push(lead.companyContact.phone);
    return [...new Set(phones)].filter(p => p && p.length > 5);
  },

  /**
   * Analyze sentiment of reply (uses AI)
   */
  async analyzeSentiment(message: string): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      // TODO: Implement with Gemini AI
      // For now, simple heuristic
      const lowerMsg = message.toLowerCase();
      if (
        lowerMsg.includes('yes') ||
        lowerMsg.includes('interested') ||
        lowerMsg.includes('yes!') ||
        lowerMsg.includes('love') ||
        lowerMsg.includes('perfect')
      ) {
        return 'positive';
      }
      if (
        lowerMsg.includes('no') ||
        lowerMsg.includes('not interested') ||
        lowerMsg.includes('sorry')
      ) {
        return 'negative';
      }
      return 'neutral';
    } catch (err) {
      return 'neutral';
    }
  },
};

// ============================================================================
// SMS Queue Service
// ============================================================================

export const smsQueueService = {
  /**
   * Calculate daily limit usage
   */
  calculateDailyUsage(queueItems: SMSQueue[], date: Date): {
    used: number;
    remaining: number;
    percentage: number;
  } {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    const sentToday = queueItems.filter((item) => {
      const itemDate = new Date(item.scheduledDate);
      itemDate.setHours(0, 0, 0, 0);
      return (
        itemDate.getTime() === today.getTime() &&
        item.status === 'sent'
      );
    }).length;

    const used = sentToday;
    const remaining = Math.max(0, SMS_DAILY_LIMIT - used);
    const percentage = (used / SMS_DAILY_LIMIT) * 100;

    return { used, remaining, percentage };
  },

  /**
   * Get queue for today
   */
  getTodayQueue(queueItems: SMSQueue[]): SMSQueue[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return queueItems
      .filter((item) => {
        const itemDate = new Date(item.scheduledDate);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      })
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Auto-import qualified leads to SMS queue
   */
  autoImportLeads(
    leads: Lead[],
    template: string,
    existingQueue: SMSQueue[]
  ): SMSQueue[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayQueue = smsQueueService.getTodayQueue(existingQueue);
    const usage = smsQueueService.calculateDailyUsage(existingQueue, today);

    // Filter qualified leads
    const qualifiedLeads = leads.filter((lead) => {
      // Must have phone number
      if (!lead.ceoPhone && !lead.companyContact?.phone) return false;

      // Must not already be in queue
      if (existingQueue.some((q) => q.leadId === lead.id)) return false;

      // Must be cold pipeline
      if (lead.pipelineTag !== 'cold') return false;

      // Confidence must be high enough
      if ((lead.confidenceScore || 0) < 40) return false;

      return true;
    });

    // Add to queue respecting 75/day limit
    const newQueueItems: SMSQueue[] = [];
    let order = todayQueue.length;

    for (const lead of qualifiedLeads) {
      const phoneNumbers = smsService.getPhoneNumbers(lead);
      if (phoneNumbers.length === 0) continue;

      const phoneNumber = phoneNumbers[0];
      const personalized = smsService.personalizeMessage(template, lead);

      if (usage.remaining > 0 || order >= SMS_DAILY_LIMIT) {
        // Schedule for today if slot available, otherwise tomorrow
        const scheduleDate = usage.remaining > 0 ? today : new Date(today.getTime() + 86400000);

        newQueueItems.push({
          id: `sms-${lead.id}-${Date.now()}`,
          leadId: lead.id,
          companyName: lead.companyName,
          phoneNumber,
          message: personalized,
          scheduledDate: scheduleDate,
          status: 'pending',
          order,
          retryCount: 0,
        });

        if (usage.remaining > 0) usage.remaining--;
        order++;
      }
    }

    return newQueueItems;
  },

  /**
   * Distribute overflow leads across future days
   */
  distributeOverflow(
    leads: Lead[],
    template: string,
    startDate: Date = new Date()
  ): SMSQueue[] {
    const queueItems: SMSQueue[] = [];
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    let currentDayCount = 0;

    for (const lead of leads) {
      const phoneNumbers = smsService.getPhoneNumbers(lead);
      if (phoneNumbers.length === 0) continue;

      // Move to next day if reached limit
      if (currentDayCount >= SMS_DAILY_LIMIT) {
        currentDate = new Date(currentDate.getTime() + 86400000);
        currentDayCount = 0;
      }

      const phoneNumber = phoneNumbers[0];
      const personalized = smsService.personalizeMessage(template, lead);

      queueItems.push({
        id: `sms-${lead.id}-${currentDate.getTime()}`,
        leadId: lead.id,
        companyName: lead.companyName,
        phoneNumber,
        message: personalized,
        scheduledDate: currentDate,
        status: 'pending',
        order: currentDayCount,
        retryCount: 0,
      });

      currentDayCount++;
    }

    return queueItems;
  },

  /**
   * Process queue (send pending messages)
   */
  async processQueue(queueItems: SMSQueue[]): Promise<{
    sent: number;
    failed: number;
    results: Array<{ id: string; success: boolean; error?: string }>;
  }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayQueue = queueItems.filter((item) => {
      const itemDate = new Date(item.scheduledDate);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime() && item.status === 'pending';
    });

    // Process first 75 items (respect daily limit)
    for (const item of todayQueue.slice(0, SMS_DAILY_LIMIT)) {
      try {
        const result = await smsService.sendSMS(item.phoneNumber, item.message);
        if (result.success) {
          sent++;
          results.push({ id: item.id, success: true });
        } else {
          failed++;
          results.push({
            id: item.id,
            success: false,
            error: result.error,
          });
        }
      } catch (err) {
        failed++;
        results.push({
          id: item.id,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Rate limit: 1 SMS per 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return { sent, failed, results };
  },
};

// ============================================================================
// Local Storage (Temporary - will sync to Firestore)
// ============================================================================

const SMS_STORAGE_KEY = 'crescoflow_sms_data';

export const smsStorage = {
  /**
   * Save SMS data to localStorage
   */
  save(data: {
    messages: SMSMessage[];
    queue: SMSQueue[];
    conversations: SMSConversation[];
  }): void {
    try {
      localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving SMS data:', err);
    }
  },

  /**
   * Load SMS data from localStorage
   */
  load(): {
    messages: SMSMessage[];
    queue: SMSQueue[];
    conversations: SMSConversation[];
  } {
    try {
      const data = localStorage.getItem(SMS_STORAGE_KEY);
      if (!data)
        return {
          messages: [],
          queue: [],
          conversations: [],
        };
      return JSON.parse(data);
    } catch (err) {
      console.error('Error loading SMS data:', err);
      return {
        messages: [],
        queue: [],
        conversations: [],
      };
    }
  },

  /**
   * Clear SMS data
   */
  clear(): void {
    try {
      localStorage.removeItem(SMS_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing SMS data:', err);
    }
  },
};

export default {
  smsService,
  smsQueueService,
  smsStorage,
};


import { Lead, UserConfig, GHLMessage, Interaction } from "../types";

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
// NIEUWE ENTERPRISE CREDENTIALS
const MASTER_KEY = 'pit-fc316bc9-4464-46eb-98a8-dc96f326f1a6';
const MASTER_LOCATION_ID = 'CeF7k7kG7kpfasFadIQR';

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token || MASTER_KEY}`,
  'Version': '2021-07-28'
});

/**
 * Haalt de Location ID op. 
 * CRITICAL FIX: Private Integration Tokens (PIT) mogen geen /locations/search doen.
 * We gebruiken de direct meegeleverde Location ID voor de master key.
 */
export const getFirstLocationId = async (token?: string): Promise<string | null> => {
  const currentToken = token || MASTER_KEY;
  
  // Als we de master key (PIT) gebruiken, gebruik dan direct de opgegeven locationId
  if (currentToken === MASTER_KEY || currentToken.startsWith('pit-')) {
    return MASTER_LOCATION_ID;
  }

  try {
    const response = await fetch(`${GHL_BASE_URL}/locations/search`, {
      method: 'GET',
      headers: getHeaders(currentToken)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.locations && data.locations.length > 0) {
        return data.locations[0].id;
      }
    }
    return MASTER_LOCATION_ID;
  } catch (e) {
    return MASTER_LOCATION_ID;
  }
};

export const fetchGHLCalendar = async (config?: UserConfig): Promise<any[]> => {
  try {
    const locId = await getFirstLocationId(config?.ghlApiKey);
    if (!locId) return [];
    
    const response = await fetch(`${GHL_BASE_URL}/calendars/events?locationId=${locId}`, {
      method: 'GET',
      headers: getHeaders(config?.ghlApiKey)
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.events || [];
  } catch (e) {
    console.error("GHL Cloud Calendar Error:", e);
    return [];
  }
};

export const sendGHLSMS = async (contactId: string, message: string, config?: UserConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${GHL_BASE_URL}/conversations/messages`, {
      method: 'POST',
      headers: getHeaders(config?.ghlApiKey),
      body: JSON.stringify({
        contactId,
        type: 'SMS',
        message
      })
    });
    return response.ok;
  } catch (e) {
    console.error("GHL Send SMS Error:", e);
    return false;
  }
};

export const fetchGHLMessages = async (contactId: string, config?: UserConfig): Promise<GHLMessage[]> => {
  try {
    const response = await fetch(`${GHL_BASE_URL}/conversations/messages?contactId=${contactId}`, {
      method: 'GET',
      headers: getHeaders(config?.ghlApiKey)
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.messages || [];
  } catch (e) {
    console.error("GHL Fetch Messages Error:", e);
    return [];
  }
};

export const syncToGHL = async (lead: Lead, extraTags: string[] = [], config?: UserConfig): Promise<string | null> => {
  try {
    const locId = await getFirstLocationId(config?.ghlApiKey);
    if (!locId) return null;

    const tags = [
      ...new Set([
        ...extraTags,
        `BLIEC_Score_${lead.confidenceScore}`,
        `Status_${lead.pipelineTag}`,
        'ENTERPRISE-CLOUD-SYNCED'
      ])
    ];

    const contactData: any = {
      firstName: lead.ceo?.firstName || lead.ceoName?.split(' ')[0] || 'Beslisser',
      lastName: lead.ceo?.lastName || lead.ceoName?.split(' ').slice(1).join(' ') || 'Maker',
      companyName: lead.companyName,
      email: lead.ceo?.email || lead.ceoEmail || lead.companyContact?.email,
      phone: lead.ceo?.phone || lead.ceoPhone || lead.companyContact?.phone,
      website: lead.website,
      tags: tags,
      address1: lead.address,
      city: lead.city,
      customFields: [
        { key: 'bliec_website_score', value: (lead.analysis?.websiteScore || lead.websiteScore || 0).toString() },
        { key: 'pijnpunten', value: lead.painPoints?.join(' | ') || '' },
        { key: 'socials_fb', value: lead.socials?.facebook || '' },
        { key: 'socials_ig', value: lead.socials?.instagram || '' },
        { key: 'socials_li', value: lead.socials?.linkedin || '' },
        { key: 'google_review_score', value: (lead.googleReviews?.score || 0).toString() },
        { key: 'google_review_count', value: (lead.googleReviews?.count || 0).toString() },
        { key: 'history_log', value: JSON.stringify(lead.interactions || []) }
      ]
    };

    const isUpdate = !!lead.ghlContactId;
    const url = isUpdate ? `${GHL_BASE_URL}/contacts/${lead.ghlContactId}` : `${GHL_BASE_URL}/contacts/`;
    
    // FIX: locationId is verplicht bij POST (create), maar VERBODEN bij PUT (update) in de body
    if (!isUpdate) {
        contactData.locationId = locId;
    }

    const response = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: getHeaders(config?.ghlApiKey),
      body: JSON.stringify(contactData)
    });

    if (response.ok) {
      const result = await response.json();
      return result.contact?.id || lead.ghlContactId || 'success';
    } else {
      const errText = await response.text();
      console.error("GHL Sync Error Details:", errText);
    }
    return null;
  } catch (error) {
    console.error("GHL Enterprise Sync Error:", error);
    return null;
  }
};

export const fetchAllLeadsFromGHL = async (config?: UserConfig): Promise<Lead[]> => {
  try {
    const apiKey = config?.ghlApiKey || MASTER_KEY;
    const locId = await getFirstLocationId(apiKey);
    
    if (!locId) return [];

    const response = await fetch(`${GHL_BASE_URL}/contacts/?locationId=${locId}&limit=100`, {
      method: 'GET',
      headers: getHeaders(apiKey)
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`GHL API Request Failed [${response.status}]: ${response.statusText}`, errorBody);
        return [];
    }
    
    const data = await response.json();
    if (!data.contacts) return [];
    
    return data.contacts.map((c: any) => {
      const getVal = (key: string) => c.customFields?.find((f: any) => f.id === key || f.key === key)?.value || '';
      return {
        id: c.id,
        ghlContactId: c.id,
        sourceHash: `GHL-${c.id}`,
        companyName: c.companyName || 'Bedrijfsnaam Onbekend',
        sector: getVal('sector') || 'GHL Geïmporteerd',
        city: c.city || '',
        address: c.address1 || '',
        website: c.website || '',
        isActive: true,
        ceo: { 
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email: c.email || '', 
          phone: c.phone || '',
          linkedin: getVal('socials_li')
        },
        companyContact: { email: c.email || '', phone: c.phone || '' },
        socials: {
          facebook: getVal('socials_fb'),
          instagram: getVal('socials_ig'),
          linkedin: getVal('socials_li')
        },
        googleReviews: {
          score: parseFloat(getVal('google_review_score') || '0'),
          count: parseInt(getVal('google_review_count') || '0')
        },
        employeeCount: getVal('werknemers') || '1-10',
        revenueYearly: getVal('omzet') || 'Unknown',
        websiteScore: 5,
        seoScore: 5,
        painPoints: getVal('pijnpunten')?.split(' | ') || [],
        pipelineTag: 'cold',
        ghlSynced: true,
        scrapedAt: c.dateAdded || new Date().toISOString(),
        interactions: getVal('history_log') ? JSON.parse(getVal('history_log')) : [],
        relationshipStatus: 'gecontacteerd',
        contactCount: 1,
        outboundChannel: 'coldemail',
        crescoProfile: 'foundation',
        ceoName: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        ceoEmail: c.email || '',
        ceoPhone: c.phone || '',
        // Added missing properties to fix TS conversion error
        adStatus: 'none',
        adPlatforms: [],
        confidenceScore: 0,
        analysis: {
          websiteScore: 5,
          seoScore: 5,
          seoStatus: 'Synced',
          marketingBottlenecks: [],
          offerReason: 'GHL Enterprise Sync',
          discoveryPath: 'GoHighLevel Cloud',
          packageFit: 'foundation'
        }
      } as Lead;
    });
  } catch (e) {
    console.error("GHL Deep Cluster Sync Failure:", e);
    return [];
  }
};

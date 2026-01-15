
import { Lead } from "../types";

export const validateInstantlyConnection = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const response = await fetch('https://api.instantly.ai/api/v1/account/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (err) {
    return false;
  }
};

export const uploadToInstantly = async (leads: Lead[], campaignId: string, customBody?: string, apiKey?: string) => {
  const finalApiKey = apiKey || '';
  if (!finalApiKey || leads.length === 0 || !campaignId) return false;

  const url = 'https://api.instantly.ai/api/v1/lead/add';
  const formattedLeads = leads.map(lead => ({
    email: lead.ceoEmail || lead.emailCompany,
    first_name: lead.ceoName ? lead.ceoName.split(' ')[0] : 'Contact',
    company_name: lead.companyName,
    website: lead.website
  })).filter(l => l.email && l.email.includes('@'));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`
      },
      body: JSON.stringify({ leads: formattedLeads, campaign_id: campaignId, skip_if_exists: true })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const checkInstantlyStatus = async (email: string, apiKey?: string): Promise<'replied' | 'sent' | null> => {
    const finalApiKey = apiKey || '';
    if (!finalApiKey) return null;
    const url = `https://api.instantly.ai/api/v1/lead/get?email=${encodeURIComponent(email)}`;
    try {
         const response = await fetch(url, { headers: { 'Authorization': `Bearer ${finalApiKey}` } });
         if (response.ok) {
            const data = await response.json();
            return (data.reply_count > 0) ? 'replied' : 'sent';
         }
         return null;
    } catch (e) {
        return null;
    }
};

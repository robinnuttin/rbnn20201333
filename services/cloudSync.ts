import { supabase } from './supabaseClient';
import { Lead } from '../types';

// Leads are stored as whole JSON documents so later changes to the Lead type never drop data.
const CHUNK = 500;

export const fetchRemoteLeads = async (): Promise<Lead[]> => {
  const leads: Lead[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('crescoflow_leads')
      .select('data')
      .eq('deleted', false)
      .range(from, from + 999);
    if (error) throw error;
    leads.push(...(data ?? []).map(r => r.data as Lead));
    if (!data || data.length < 1000) return leads;
  }
};

export const pushLeads = async (leads: Lead[]): Promise<void> => {
  for (let i = 0; i < leads.length; i += CHUNK) {
    const rows = leads.slice(i, i + CHUNK).map(l => ({
      id: l.id,
      data: l,
      deleted: false,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('crescoflow_leads').upsert(rows, { onConflict: 'owner,id' });
    if (error) throw error;
  }
};

export const fetchSetting = async <T>(key: string): Promise<T | null> => {
  const { data, error } = await supabase.from('crescoflow_kv').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return (data?.value as T) ?? null;
};

export const saveSetting = async (key: string, value: unknown): Promise<void> => {
  const { error } = await supabase
    .from('crescoflow_kv')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'owner,key' });
  if (error) throw error;
};

// Returns only the leads whose content changed since the last successful sync.
export const diffLeads = (leads: Lead[], lastSynced: Map<string, string>): Lead[] =>
  leads.filter(l => lastSynced.get(l.id) !== JSON.stringify(l));

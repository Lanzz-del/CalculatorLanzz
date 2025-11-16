import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// Database schema for reference:
// Table: users
// - id (uuid, primary key)
// - email (text, unique)
// - name (text)
// - google_id (text, unique)
// - created_at (timestamp)
// - updated_at (timestamp)

// Table: user_api_keys
// - id (uuid, primary key)
// - user_id (uuid, foreign key to users)
// - openai_key (text, encrypted)
// - anthropic_key (text, encrypted)
// - google_gemini_key (text, encrypted)
// - deepseek_key (text, encrypted)
// - binance_key (text, encrypted)
// - binance_secret (text, encrypted)
// - news_api_key (text, encrypted)
// - openweather_key (text, encrypted)
// - fred_api_key (text, encrypted)
// - updated_at (timestamp)

export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserApiKeys(userId) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertUserApiKeys(userId, apiKeys) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .upsert([{ user_id: userId, ...apiKeys, updated_at: new Date().toISOString() }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Supabase Configuration
 * 
 * Set these environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anon/public key
 * 
 * Create a table named 'games' in Supabase with this SQL:
 * 
 * CREATE TABLE games (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title TEXT NOT NULL,
 *   image TEXT NOT NULL,
 *   grid_size INTEGER NOT NULL DEFAULT 6,
 *   answer TEXT NOT NULL,
 *   revealed_tiles JSONB DEFAULT '[]',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Enable Row Level Security (optional but recommended)
 * ALTER TABLE games ENABLE ROW LEVEL SECURITY;
 * 
 * -- Allow all operations for now (adjust for production)
 * CREATE POLICY "Allow all" ON games FOR ALL USING (true);
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found. Database features will not work.');
}

const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

module.exports = { supabase };

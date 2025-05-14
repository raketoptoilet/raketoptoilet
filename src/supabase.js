import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xjyrmpdhnnovsylolfgk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqeXJtcGRobm5vdnN5bG9sZmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjU3NDEsImV4cCI6MjA2Mjc0MTc0MX0.hUtm8UlzkdD7MYlqRWxVXnR9OlXg_T1USQz2x8FAsh4';
export const supabase = createClient(supabaseUrl, supabaseKey);
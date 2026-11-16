import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jvorxidiigvdznnpgxrj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2b3J4aWRpaWd2ZHpubnBneHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1ODU1MDEsImV4cCI6MjExMDE2MTUwMX0._-FVN6k0-S-xaLsCOGTklHIIa3MRLU901Adn-kBcUsE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

// Publishable key: safe in the browser. Row-level security protects the data.
export const supabase = createClient(
  'https://hgtodegbjjmxiytnpwcv.supabase.co',
  'sb_publishable_MrMu_cSSYo6P3Kh14qpHeA_Wx2qvi7H',
);

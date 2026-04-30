import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zewowkabfukdnaaixoyz.supabase.co';
const supabasePublishableKey = 'sb_publishable_n1A94TGgsdzVoIKc-3nAZQ_L_tON5eo';

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
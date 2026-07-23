const SUPABASE_URL = "https://yulxzbgudbmzedijndmd.supabase.co/rest/v1/";

const SUPABASE_ANON_KEY = "sb_publishable_Z9ul2ddpAn0QCGkkXMFr-w_-MJouFhc";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
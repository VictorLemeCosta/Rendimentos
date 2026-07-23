const SUPABASE_URL = "https://yulxzbgudbmzedijnmd.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_Z9ul2ddpAn0QCGkkXMFr-w_-MJouFhc";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdvtjtxykvmkmuzzusgh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdnRqdHh5a3Zta211enp1c2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzUwNDEsImV4cCI6MjA5MjAxMTA0MX0.1_XML38QKhKqft0y2V2yS56AwydSLNOfoecVMJ818Ds';
export const AUTH_REDIRECT_URL = 'rentify://auth/callback';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

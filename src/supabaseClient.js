import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rfseqqqutfkirvmohwvq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc2VxcXF1dGZraXJ2bW9od3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTI3MTUsImV4cCI6MjA4OTM4ODcxNX0.Guhrx6LyZRyjsvTWWzDcqf8KMUUpL4llj-Bg7O6wsv0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
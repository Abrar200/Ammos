import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://zoljzcdwthnahapjxtdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbGp6Y2R3dGhuYWhhcGp4dGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTc1OTcsImV4cCI6MjA2OTY5MzU5N30.xQjGcYS8oc6sgOJWh01P03Vwaca1Tp-mMMyCq2iSU8k';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
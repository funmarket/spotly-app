import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jrhtbvfcnipkjxqfzofp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyaHRidmZjbmlwa2p4cWZ6b2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4Mjg5MzQsImV4cCI6MjA3OTQwNDkzNH0.7gxwUJN7be5KqVzZ8YCA_825r4WGEygMIwOJlJAudGM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


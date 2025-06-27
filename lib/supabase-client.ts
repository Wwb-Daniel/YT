import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://agnfqvcsagacsfuqrxzd.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbmZxdmNzYWdhY3NmdXFyeHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjE1NTMsImV4cCI6MjA2NjIzNzU1M30.NbUWZ6tBS7wDrOvcFS5s6-LMu_3VM13w87y2rkt0_7M"

// Create a singleton instance for client components
let clientInstance: ReturnType<typeof createClient> | null = null

export function createClientSupabase() {
  // Always use singleton pattern to avoid multiple instances
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  return clientInstance
}

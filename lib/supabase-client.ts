import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://agnfqvcsagacsfuqrxzd.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbmZxdmNzYWdhY3NmdXFyeHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjE1NTMsImV4cCI6MjA2NjIzNzU1M30.NbUWZ6tBS7wDrOvcFS5s6-LMu_3VM13w87y2rkt0_7M"

// Create a singleton instance for client components
let clientInstance: ReturnType<typeof createClient> | null = null

export function createClientSupabase() {
  try {
    if (typeof window === "undefined") {
      // Server-side: create a new instance each time to avoid conflicts
      return createClient(supabaseUrl, supabaseKey)
    }

    // Client-side: use singleton pattern
    if (!clientInstance) {
      clientInstance = createClient(supabaseUrl, supabaseKey)
      console.log("Supabase client created successfully")
    }

    return clientInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    // Return a minimal client that won't crash but will log errors
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            range: () => ({
              then: () => Promise.resolve({ data: [], error: null }),
            }),
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    } as any
  }
}

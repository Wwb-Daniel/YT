import { createServerClient as createClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient(
    "https://agnfqvcsagacsfuqrxzd.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbmZxdmNzYWdhY3NmdXFyeHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjE1NTMsImV4cCI6MjA2NjIzNzU1M30.NbUWZ6tBS7wDrOvcFS5s6-LMu_3VM13w87y2rkt0_7M",
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name, options) => {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )
}

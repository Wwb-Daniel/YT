"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"

const supabaseUrl = "https://agnfqvcsagacsfuqrxzd.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbmZxdmNzYWdhY3NmdXFyeHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjE1NTMsImV4cCI6MjA2NjIzNzU1M30.NbUWZ6tBS7wDrOvcFS5s6-LMu_3VM13w87y2rkt0_7M"

const SupabaseContext = createContext<{
  supabase: ReturnType<typeof createClient>
  user: any
  profile: any
  isLoading: boolean
}>({
  supabase: createClient(supabaseUrl, supabaseKey),
  user: null,
  profile: null,
  isLoading: true,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient(supabaseUrl, supabaseKey))
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      setIsLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)

          // Redirect to login if trying to access protected routes
          const protectedRoutes = [
            "/profile",
            "/upload",
            "/my-videos",
            "/subscriptions",
            "/library",
            "/history",
            "/liked",
            "/watch-later",
          ]
          if (protectedRoutes.includes(pathname)) {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select().eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      setProfile(data)

      // Create profile if it doesn't exist
      if (!data) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          username: `user_${userId.substring(0, 8)}`,
        })

        if (insertError) {
          console.error("Error creating profile:", insertError)
        } else {
          // Fetch the newly created profile
          const { data: newProfile } = await supabase.from("profiles").select().eq("id", userId).single()

          setProfile(newProfile)
        }
      }
    } catch (error) {
      console.error("Profile fetch error:", error)
    }
  }

  return <SupabaseContext.Provider value={{ supabase, user, profile, isLoading }}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

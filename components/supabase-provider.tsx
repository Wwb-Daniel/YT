"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClientSupabase } from "@/lib/supabase-client"

const SupabaseContext = createContext<{
  supabase: any
  user: any
  profile: any
  isLoading: boolean
  refreshProfile: () => Promise<void>
}>({
  supabase: createClientSupabase(),
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientSupabase())
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select().eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      setProfile(data)

      // Only create profile if it doesn't exist and we have a user
      if (!data && userId) {
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

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    // Initial session check - optimized
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          // Only fetch profile if we don't have it
          if (!profile) {
            await fetchProfile(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)

          // Only redirect if on protected routes and not already on login
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
          if (protectedRoutes.includes(pathname) && pathname !== "/login") {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("[SupabaseProvider] Session check error:", error)
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
  }, [supabase, router, pathname, profile])

  return <SupabaseContext.Provider value={{ supabase, user, profile, isLoading, refreshProfile }}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

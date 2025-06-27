"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { useSupabase } from "@/components/supabase-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoginPage() {
  const { user, isLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border">
          <Skeleton className="h-8 w-3/4 mx-auto mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold mb-6 text-center">Login or Sign Up</h1>
        <AuthForm />
      </div>
    </div>
  )
}

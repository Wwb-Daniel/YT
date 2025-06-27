"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { VideoUploadForm } from "@/components/video-upload-form"
import { useSupabase } from "@/components/supabase-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function UploadPage() {
  const { user, isLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-8 w-full max-w-md mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
      <VideoUploadForm userId={user.id} />
    </div>
  )
}

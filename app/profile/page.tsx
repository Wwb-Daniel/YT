"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { UserVideos } from "@/components/user-videos"
import { UserUploadedVideos } from "@/components/user-uploaded-videos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabase } from "@/components/supabase-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const { user, profile, isLoading } = useSupabase()
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
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <div className="space-y-8">
        <ProfileForm profile={profile} />

        <div className="pt-6 border-t">
          <Tabs defaultValue="liked" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="liked">Liked Videos</TabsTrigger>
              <TabsTrigger value="uploaded">Your Uploads</TabsTrigger>
            </TabsList>

            <TabsContent value="liked">
              <h2 className="text-xl font-semibold mb-4">Your Liked Videos</h2>
              <UserVideos userId={user.id} />
            </TabsContent>

            <TabsContent value="uploaded">
              <h2 className="text-xl font-semibold mb-4">Your Uploaded Videos</h2>
              <UserUploadedVideos userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { useSupabase } from "@/components/supabase-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserVideos } from "@/components/user-videos"
import { UserUploadedVideos } from "@/components/user-uploaded-videos"

export default function LibraryPage() {
  const { user, isLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar className="hidden md:block w-64 shrink-0" />
        <div className="flex-1 p-4 md:p-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-8 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-video rounded-lg" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex">
      <Sidebar className="hidden md:block w-64 shrink-0" />
      <div className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Library</h1>

        <Tabs defaultValue="liked" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
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
  )
}

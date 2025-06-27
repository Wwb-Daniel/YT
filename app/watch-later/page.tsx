"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { Sidebar } from "@/components/sidebar"
import { useSupabase } from "@/components/supabase-provider"
import { createClientSupabase } from "@/lib/supabase-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

export default function WatchLaterPage() {
  const { user, isLoading } = useSupabase()
  const router = useRouter()
  const [videos, setVideos] = useState<any[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchWatchLaterVideos()
    }
  }, [user])

  const fetchWatchLaterVideos = async () => {
    if (!user) return

    setIsLoadingVideos(true)
    try {
      const supabase = createClientSupabase()

      // Ahora sí, mostramos los videos de watch_later
      const { data } = await supabase
        .from("watch_later")
        .select(`
          *,
          videos (
            id,
            title,
            thumbnail_url,
            user_id,
            view_count,
            created_at,
            profiles:user_id (username)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Filter out null videos (might have been deleted)
      const validVideos = (data || []).filter((item) => item.videos)
      setVideos(validVideos)
    } catch (error) {
      console.error("Error fetching watch later videos:", error)
    } finally {
      setIsLoadingVideos(false)
    }
  }

  if (isLoading || isLoadingVideos) {
    return (
      <div className="flex">
        <Sidebar className="hidden md:block w-64 shrink-0" />
        <div className="flex-1 p-4 md:p-6">
          <Skeleton className="h-10 w-64 mb-6" />
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
        <h1 className="text-2xl font-bold mb-6">Watch Later</h1>

        {videos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">Your watch later list is empty</p>
            <Button asChild>
              <Link href="/">
                <Clock className="mr-2 h-4 w-4" />
                Browse Videos
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((item) => (
              <Link key={item.id} href={`/watch/${item.videos.id}`} className="group">
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <Image
                    src={item.videos.thumbnail_url || "/placeholder.svg"}
                    alt={item.videos.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-medium line-clamp-2">{item.videos.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.videos.profiles?.username || "Unknown"}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {item.videos.view_count ? `${item.videos.view_count.toLocaleString()} views` : "No views"}
                    </span>
                    <span className="mx-1">•</span>
                    <span>Added {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
import { Trash2 } from "lucide-react"

export default function HistoryPage() {
  const { user, isLoading } = useSupabase()
  const router = useRouter()
  const [history, setHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const fetchHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      const supabase = createClientSupabase()

      const { data } = await supabase
        .from("video_views")
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
        .order("viewed_at", { ascending: false })
        .limit(50)

      // Filter out null videos (might have been deleted)
      const validHistory = (data || []).filter((item) => item.videos)
      setHistory(validHistory)
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const clearHistory = async () => {
    if (!user) return

    try {
      const supabase = createClientSupabase()
      await supabase.from("video_views").delete().eq("user_id", user.id)
      setHistory([])
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  }

  if (isLoading || isLoadingHistory) {
    return (
      <div className="flex">
        <Sidebar className="hidden md:block w-64 shrink-0" />
        <div className="flex-1 p-4 md:p-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="aspect-video sm:w-64 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-md mb-2" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Watch History</h1>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">Your watch history is empty</p>
            <Button asChild>
              <Link href="/">Browse Videos</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((item) => (
              <Link key={item.id} href={`/watch/${item.videos.id}`} className="flex flex-col sm:flex-row gap-4 group">
                <div className="relative aspect-video sm:w-64 rounded-lg overflow-hidden">
                  <Image
                    src={item.videos.thumbnail_url || "/placeholder.svg"}
                    alt={item.videos.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium line-clamp-2">{item.videos.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.videos.profiles?.username || "Unknown"}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {item.videos.view_count ? `${item.videos.view_count.toLocaleString()} views` : "No views"}
                    </span>
                    <span className="mx-1">•</span>
                    <span>Watched {formatDistanceToNow(new Date(item.viewed_at), { addSuffix: true })}</span>
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

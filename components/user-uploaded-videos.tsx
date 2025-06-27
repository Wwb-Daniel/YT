"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { createClientSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface UserUploadedVideosProps {
  userId: string
}

export function UserUploadedVideos({ userId }: UserUploadedVideosProps) {
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUploadedVideos = async () => {
      setIsLoading(true)
      try {
        const supabase = createClientSupabase()

        const { data } = await supabase
          .from("videos")
          .select()
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        setVideos(data || [])
      } catch (error) {
        console.error("Error fetching uploaded videos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUploadedVideos()
    }
  }, [userId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
      </div>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">You haven't uploaded any videos yet</p>
        <Button asChild>
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link key={video.id} href={`/watch/${video.id}`} className="group">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={video.thumbnail_url || "/placeholder.svg"}
              alt={video.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="mt-2">
            <h3 className="font-medium line-clamp-2">{video.title}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{video.view_count ? `${video.view_count.toLocaleString()} views` : "No views"}</span>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

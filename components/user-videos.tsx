"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { createClientSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useInView } from "react-intersection-observer"
import { useToast } from "@/components/ui/use-toast"

interface UserVideosProps {
  userId: string
}

export function UserVideos({ userId }: UserVideosProps) {
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()
  const { toast } = useToast()

  const fetchLikedVideos = async (pageNumber: number) => {
    if (!userId) return

    setIsLoading(true)
    try {
      const supabase = createClientSupabase()

      // Calculate pagination range
      const from = (pageNumber - 1) * 8
      const to = from + 7

      // First get the likes
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("id, created_at, video_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (likesError) {
        throw likesError
      }

      if (!likesData || likesData.length === 0) {
        setVideos([])
        setHasMore(false)
        setIsLoading(false)
        return
      }

      // Get the video IDs
      const videoIds = likesData.map((like) => like.video_id)

      // Get the videos
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          user_id,
          view_count,
          created_at,
          published_at,
          channel_title
        `)
        .in("id", videoIds)

      if (videosError) {
        throw videosError
      }

      // Get usernames for videos
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", videosData.map((video) => video.user_id).filter(Boolean))

      // Combine the data
      const combinedData = likesData
        .map((like) => {
          const video = videosData.find((v) => v.id === like.video_id)
          if (!video) return null

          const profile = profilesData?.find((p) => p.id === video.user_id)

          return {
            id: like.id,
            created_at: like.created_at,
            videos: {
              ...video,
              profiles: profile ? { username: profile.username } : null,
            },
          }
        })
        .filter(Boolean)

      if (pageNumber === 1) {
        setVideos(combinedData)
      } else {
        setVideos((prev) => [...prev, ...combinedData])
      }

      setHasMore(combinedData.length === 8)
    } catch (error) {
      console.error("Error fetching liked videos:", error)
      toast({
        title: "Error",
        description: "Failed to load liked videos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchLikedVideos(1)
    }
  }, [userId])

  // Load more when scrolling to the bottom
  useEffect(() => {
    if (inView && !isLoading && hasMore) {
      setPage((prevPage) => prevPage + 1)
      fetchLikedVideos(page + 1)
    }
  }, [inView, isLoading, hasMore, page, userId])

  if (isLoading && videos.length === 0) {
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
        <p className="text-muted-foreground mb-4">You haven't liked any videos yet</p>
        <Button asChild>
          <Link href="/">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Browse Videos
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((like) => {
          const video = like.videos
          if (!video) return null

          return (
            <Link key={like.id} href={`/watch/${video.id}`} className="group">
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
                <p className="text-sm text-muted-foreground">
                  {video.profiles?.username || video.channel_title || "Unknown"}
                </p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>{video.view_count ? `${video.view_count.toLocaleString()} views` : "No views"}</span>
                  <span className="mx-1">•</span>
                  <span>
                    {formatDistanceToNow(new Date(video.created_at || video.published_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Loading indicator for infinite scroll */}
      {hasMore && (
        <div ref={ref} className="flex justify-center my-8">
          <div className="space-y-2">
            <Skeleton className="aspect-video w-64 rounded-lg" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      )}
    </div>
  )
}

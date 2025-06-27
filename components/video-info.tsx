"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { useSupabase } from "./supabase-provider"
import { createClientSupabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface VideoInfoProps {
  video: any
  youtubeDetails?: any
  isYoutubeVideo?: boolean
}

export function VideoInfo({ video, youtubeDetails, isYoutubeVideo = false }: VideoInfoProps) {
  const { user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dbVideoId, setDbVideoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Determine the database video ID
    const fetchVideoData = async () => {
      setIsLoading(true)
      try {
        const supabase = createClientSupabase()

        if (isYoutubeVideo && video.id) {
          // For YouTube videos, we need to find the database ID
          const { data } = await supabase.from("videos").select("id").eq("youtube_id", video.id).maybeSingle()

          if (data) {
            setDbVideoId(data.id)
          } else {
            // If not found, try to create it
            try {
              const { data: newVideo, error } = await supabase
                .from("videos")
                .insert({
                  youtube_id: video.id,
                  title: video.title || youtubeDetails?.snippet?.title,
                  thumbnail_url: youtubeDetails?.snippet?.thumbnails?.high?.url,
                  channel_title: video.channelTitle || youtubeDetails?.snippet?.channelTitle,
                  description: video.description || youtubeDetails?.snippet?.description,
                  published_at: video.publishedAt || youtubeDetails?.snippet?.publishedAt,
                  view_count: youtubeDetails?.statistics?.viewCount
                    ? Number.parseInt(youtubeDetails.statistics.viewCount)
                    : 0,
                })
                .select("id")
                .single()

              if (!error && newVideo) {
                setDbVideoId(newVideo.id)
              }
            } catch (insertError) {
              console.error("Error inserting video:", insertError)
            }
          }
        } else {
          // For database videos, we already have the ID
          setDbVideoId(video.id)
        }

        // Set initial like count
        if (youtubeDetails?.statistics?.likeCount) {
          setLikeCount(Number.parseInt(youtubeDetails.statistics.likeCount))
        } else if (dbVideoId || video.id) {
          // Get like count from our database
          const videoIdToUse = dbVideoId || video.id
          const { count, error } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("video_id", videoIdToUse)

          if (!error && count !== null) {
            setLikeCount(count)
          }
        }

        // Check if current user has liked this video
        if (user && (dbVideoId || video.id)) {
          const videoIdToUse = dbVideoId || video.id
          const { data, error } = await supabase
            .from("likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("video_id", videoIdToUse)
            .maybeSingle()

          if (!error) {
            setIsLiked(!!data)
          }
        }
      } catch (error) {
        console.error("Error fetching video data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideoData()
  }, [video, isYoutubeVideo, user, youtubeDetails])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like videos",
      })
      router.push("/login")
      return
    }

    const videoIdToUse = dbVideoId || video.id

    if (!videoIdToUse) {
      toast({
        title: "Error",
        description: "Cannot like this video at the moment",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClientSupabase()

      if (isLiked) {
        // Unlike
        const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("video_id", videoIdToUse)

        if (error) throw error

        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))

        toast({
          title: "Video unliked",
          description: "This video has been removed from your liked videos",
        })
      } else {
        // Like
        const { error } = await supabase.from("likes").insert({
          user_id: user.id,
          video_id: videoIdToUse,
        })

        if (error) throw error

        setIsLiked(true)
        setLikeCount((prev) => prev + 1)

        toast({
          title: "Video liked",
          description: "This video has been added to your liked videos",
        })
      }

      // Force refresh to update the UI
      router.refresh()
    } catch (error) {
      console.error("Error updating like:", error)
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Video link copied to clipboard",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // Get the appropriate title, description, etc. based on whether it's a YouTube video or uploaded video
  const title = isYoutubeVideo ? youtubeDetails?.snippet?.title || video.title : video.title

  const description = isYoutubeVideo
    ? youtubeDetails?.snippet?.description || video.description || ""
    : video.description || ""

  const channelTitle = isYoutubeVideo
    ? youtubeDetails?.snippet?.channelTitle || video.channelTitle || "Unknown"
    : video.profiles?.username || video.channel_title || "Unknown"

  const publishedAt = isYoutubeVideo
    ? youtubeDetails?.snippet?.publishedAt || video.publishedAt
    : video.published_at || video.created_at

  const viewCount = isYoutubeVideo
    ? youtubeDetails?.statistics?.viewCount || video.viewCount || 0
    : video.view_count || 0

  const avatarUrl = video.profiles?.avatar_url || null

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || ""} alt={channelTitle} />
            <AvatarFallback>{channelTitle?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{channelTitle}</p>
            {youtubeDetails?.statistics?.subscriberCount && (
              <p className="text-xs text-muted-foreground">
                {Number.parseInt(youtubeDetails.statistics.subscriberCount).toLocaleString()} subscribers
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isLiked ? "secondary" : "outline"}
            size="sm"
            onClick={handleLike}
            className="flex items-center gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{likeCount.toLocaleString()}</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <span>{viewCount ? `${Number.parseInt(String(viewCount)).toLocaleString()} views` : "No views"}</span>
          <span className="mx-1">•</span>
          <span>{publishedAt ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true }) : "Unknown date"}</span>
        </div>
        <p className="text-sm whitespace-pre-line">{description}</p>
      </div>
    </div>
  )
}

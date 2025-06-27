"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabase } from "./supabase-provider"
import { createClientSupabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface CommentSectionProps {
  videoId: string
}

export function CommentSection({ videoId }: CommentSectionProps) {
  const { user, profile } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchComments = async () => {
    if (!videoId) return

    try {
      setIsLoading(true)
      const supabase = createClientSupabase()

      // First, check if the video exists in our database
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("id")
        .eq("id", videoId)
        .maybeSingle()

      // If it's a YouTube ID, try to find it by youtube_id
      let dbVideoId = videoData?.id
      if (!dbVideoId && videoId.length === 11) {
        const { data: ytVideo } = await supabase.from("videos").select("id").eq("youtube_id", videoId).maybeSingle()

        dbVideoId = ytVideo?.id
      }

      if (!dbVideoId) {
        // If video doesn't exist in our database, show empty comments
        setComments([])
        setIsLoading(false)
        return
      }

      // Now fetch comments using the database video ID
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("video_id", dbVideoId)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Fetch user profiles separately
      const userIds = data.map((comment) => comment.user_id)
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)

      // Combine comments with user profiles
      const commentsWithProfiles = data.map((comment) => {
        const userProfile = profiles?.find((profile) => profile.id === comment.user_id)
        return {
          ...comment,
          profile: userProfile || null,
        }
      })

      setComments(commentsWithProfiles || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (videoId) {
      fetchComments()
    }
  }, [videoId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment",
      })
      router.push("/login")
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const supabase = createClientSupabase()

      // First, check if the video exists in our database
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("id")
        .eq("id", videoId)
        .maybeSingle()

      // If it's a YouTube ID, try to find it by youtube_id
      let dbVideoId = videoData?.id
      if (!dbVideoId && videoId.length === 11) {
        const { data: ytVideo } = await supabase.from("videos").select("id").eq("youtube_id", videoId).maybeSingle()

        dbVideoId = ytVideo?.id
      }

      if (!dbVideoId) {
        toast({
          title: "Error",
          description: "Cannot comment on this video",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("comments").insert({
        user_id: user.id,
        video_id: dbVideoId,
        content: newComment.trim(),
      })

      if (error) {
        throw error
      }

      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      })

      setNewComment("")
      await fetchComments()
    } catch (error: any) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Comments</h2>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{comments.length} Comments</h2>

      <form onSubmit={handleSubmitComment} className="flex gap-4">
        {user && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || ""} />
            <AvatarFallback>
              {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || isSubmitting}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!user || !newComment.trim() || isSubmitting}>
              {isSubmitting ? "Posting..." : "Comment"}
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.profile?.avatar_url || ""} alt={comment.profile?.username || ""} />
              <AvatarFallback>{comment.profile?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{comment.profile?.username || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
              <p className="mt-1">{comment.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
}

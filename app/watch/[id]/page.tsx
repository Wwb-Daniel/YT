import { Suspense } from "react"
import type { Metadata } from "next"
import { VideoPlayer } from "@/components/video-player"
import { CommentSection } from "@/components/comment-section"
import { VideoRecommendations } from "@/components/video-recommendations"
import { VideoSkeleton } from "@/components/video-skeleton"
import { ErrorBoundary } from "@/components/error-boundary"
import { ShareButton } from "@/components/share-button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { getVideoDetails } from "@/lib/youtube"
import { createServerClient } from "@/lib/supabase-server"
import { isUUID } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Eye,
  Globe,
  Lock,
  Video,
  Youtube,
  Calendar,
  Tag,
  User,
  ExternalLink,
} from "lucide-react"
import { WatchClient } from "@/components/watch-client"

// Force dynamic rendering to avoid prerender issues
export const dynamic = "force-dynamic"

interface VideoData {
  id: string
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  youtube_id?: string
  user_id?: string
  category?: string
  visibility?: "public" | "unlisted" | "private"
  tags?: string[]
  duration?: number
  file_size?: number
  resolution?: string
  view_count?: number
  like_count?: number
  created_at?: string
  updated_at?: string
  is_uploaded: boolean
  profiles?: {
    username?: string
    avatar_url?: string
    full_name?: string
  }
}

interface WatchPageProps {
  params: { id: string }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const videoId = params.id
  const supabase = await createServerClient()

  try {
    const isDbVideo = isUUID(videoId)

    if (isDbVideo) {
      const { data: video } = await supabase
        .from("videos")
        .select("title, description, thumbnail_url")
        .eq("id", videoId)
        .maybeSingle()

      if (video) {
        return {
          title: `${video.title} | Your Video Platform`,
          description: video.description || `Watch ${video.title} on Your Video Platform`,
          openGraph: {
            title: video.title,
            description: video.description || `Watch ${video.title}`,
            images: video.thumbnail_url ? [{ url: video.thumbnail_url }] : [],
            type: "video.other",
          },
          twitter: {
            card: "player",
            title: video.title,
            description: video.description || `Watch ${video.title}`,
            images: video.thumbnail_url ? [video.thumbnail_url] : [],
          },
        }
      }
    } else {
      // YouTube video
      const youtubeDetails = await getVideoDetails(videoId)
      if (youtubeDetails) {
        return {
          title: `${youtubeDetails.snippet.title} | Your Video Platform`,
          description: youtubeDetails.snippet.description || `Watch ${youtubeDetails.snippet.title}`,
          openGraph: {
            title: youtubeDetails.snippet.title,
            description: youtubeDetails.snippet.description || `Watch ${youtubeDetails.snippet.title}`,
            images: youtubeDetails.snippet.thumbnails?.maxres?.url
              ? [{ url: youtubeDetails.snippet.thumbnails.maxres.url }]
              : [],
            type: "video.other",
          },
        }
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
  }

  return {
    title: "Watch Video | Your Video Platform",
    description: "Watch amazing videos on Your Video Platform",
  }
}

// Error component for video not found
function VideoNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Video Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The video you're looking for doesn't exist or has been removed.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button asChild>
              <a href="/">
                <Video className="w-4 h-4 mr-2" />
                Browse Videos
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Error component for access denied
function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Private Video</h2>
            <p className="text-muted-foreground mt-2">This video is private and can only be viewed by the owner.</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Main video content component
async function VideoContent({ videoId }: { videoId: string }) {
  const supabase = await createServerClient()
  const isDbVideo = isUUID(videoId)

  try {
    if (isDbVideo) {
      // Database video
      const { data: dbVideo, error } = await supabase
        .from("videos")
        .select(
          `
          *,
          profiles:user_id (
            username,
            avatar_url,
            full_name
          )
        `,
        )
        .eq("id", videoId)
        .maybeSingle()

      if (error) {
        console.error("Error fetching video:", error)
        return <VideoNotFound />
      }

      if (!dbVideo) {
        return <VideoNotFound />
      }

      // Check if user has access to private video
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (dbVideo.visibility === "private" && (!session || session.user.id !== dbVideo.user_id)) {
        return <AccessDenied />
      }

      // Record a view (only for authenticated users to avoid spam)
      if (session) {
        try {
          await supabase.from("video_views").insert({
            video_id: dbVideo.id,
            user_id: session.user.id,
          })

          // Update view count
          await supabase.rpc("increment_view_count", { video_id: dbVideo.id })
        } catch (viewError) {
          console.error("Error recording view:", viewError)
        }
      }

      // Get YouTube details if it's a YouTube video
      let youtubeDetails = null
      if (dbVideo.youtube_id) {
        try {
          youtubeDetails = await getVideoDetails(dbVideo.youtube_id)
        } catch (ytError) {
          console.error("Error fetching YouTube details:", ytError)
        }
      }

      const videoData: VideoData = {
        ...dbVideo,
        profiles: Array.isArray(dbVideo.profiles) ? dbVideo.profiles[0] : dbVideo.profiles,
      }

      return <VideoLayout video={videoData} youtubeDetails={youtubeDetails} />
    } else {
      // YouTube video
      const youtubeDetails = await getVideoDetails(videoId)

      if (!youtubeDetails) {
        return <VideoNotFound />
      }

      const videoData: VideoData = {
        id: videoId,
        title: youtubeDetails.snippet.title,
        description: youtubeDetails.snippet.description,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: youtubeDetails.snippet.thumbnails?.maxres?.url || youtubeDetails.snippet.thumbnails?.high?.url,
        youtube_id: videoId,
        is_uploaded: false,
        visibility: "public",
        created_at: youtubeDetails.snippet.publishedAt,
      }

      return <VideoLayout video={videoData} youtubeDetails={youtubeDetails} isYoutubeOnly={true} />
    }
  } catch (error) {
    console.error("Error in VideoContent:", error)
    return <VideoNotFound />
  }
}

// Video layout component
function VideoLayout({
  video,
  youtubeDetails,
  isYoutubeOnly = false,
}: {
  video: VideoData
  youtubeDetails?: any
  isYoutubeOnly?: boolean
}) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Videos", href: "/videos" },
    { label: video.title, href: `/watch/${video.id}` },
  ]

  const getVisibilityIcon = (visibility?: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="w-4 h-4" />
      case "unlisted":
        return <ExternalLink className="w-4 h-4" />
      case "private":
        return <Lock className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  const getVisibilityColor = (visibility?: string) => {
    switch (visibility) {
      case "public":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "unlisted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "private":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Video Player and Info */}
          <div className="xl:col-span-3 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                <ErrorBoundary
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-white">
                      Error loading video player
                    </div>
                  }
                >
                  <VideoPlayer
                    videoId={video.id}
                    videoUrl={video.video_url}
                    youtubeId={video.youtube_id}
                    isUploaded={video.is_uploaded}
                  />
                </ErrorBoundary>
              </div>
            </Card>

            {/* Video Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Title and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold leading-tight">{video.title}</h1>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        {video.view_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{video.view_count.toLocaleString()} views</span>
                          </div>
                        )}

                        {video.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(video.created_at).toLocaleDateString()}</span>
                          </div>
                        )}

                        {video.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        )}

                        {video.resolution && (
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span>{video.resolution}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <ShareButton
                        url={`${process.env.NEXT_PUBLIC_SITE_URL}/watch/${video.id}`}
                        title={video.title}
                        description={video.description}
                      />

                      {youtubeDetails && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Youtube className="w-4 h-4 mr-2" />
                            YouTube
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tags and Category */}
                  {(video.category || video.tags) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {video.category && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {video.category}
                        </Badge>
                      )}

                      {video.visibility && !isYoutubeOnly && (
                        <Badge className={`flex items-center gap-1 ${getVisibilityColor(video.visibility)}`}>
                          {getVisibilityIcon(video.visibility)}
                          {video.visibility}
                        </Badge>
                      )}

                      {video.tags?.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Creator Info */}
                  {video.profiles && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {video.profiles.avatar_url ? (
                          <img
                            src={video.profiles.avatar_url || "/placeholder.svg"}
                            alt={video.profiles.username || "Creator"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {video.profiles.full_name || video.profiles.username || "Anonymous"}
                        </p>
                        {video.profiles.username && video.profiles.full_name && (
                          <p className="text-sm text-muted-foreground">@{video.profiles.username}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {video.description && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Description</h3>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-lg p-4">
                        {video.description}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <ErrorBoundary
              fallback={<div className="text-center py-8 text-muted-foreground">Comments unavailable</div>}
            >
              <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-64" />}>
                <CommentSection videoId={video.id} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Video Stats Card */}
              {!isYoutubeOnly && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Video Stats
                    </h3>
                    <div className="space-y-3 text-sm">
                      {video.view_count !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Views</span>
                          <span className="font-medium">{video.view_count.toLocaleString()}</span>
                        </div>
                      )}

                      {video.file_size && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">File Size</span>
                          <span className="font-medium">{(video.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      )}

                      {video.created_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uploaded</span>
                          <span className="font-medium">{new Date(video.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <ErrorBoundary
                fallback={<div className="text-center py-8 text-muted-foreground">Recommendations unavailable</div>}
              >
                <Suspense
                  fallback={
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
                      ))}
                    </div>
                  }
                >
                  <VideoRecommendations videoId={video.id} youtubeId={video.youtube_id} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component
export default async function WatchPage({ params }: WatchPageProps) {
  return (
    <ErrorBoundary fallback={<VideoNotFound />}>
      <Suspense fallback={<VideoSkeleton />}>
        <VideoContent videoId={params.id} />
      </Suspense>
    </ErrorBoundary>
  )
}

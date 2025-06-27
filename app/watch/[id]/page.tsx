import { VideoPlayer } from "@/components/video-player"
import { VideoInfo } from "@/components/video-info"
import { CommentSection } from "@/components/comment-section"
import { VideoRecommendations } from "@/components/video-recommendations"
import { getVideoDetails } from "@/lib/youtube"
import { createServerClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import { isUUID } from "@/lib/utils"

export default async function WatchPage({ params }: { params: { id: string } }) {
  const videoId = params.id
  const supabase = await createServerClient()

  try {
    // Verificar si el ID es un UUID (video de la base de datos) o un ID de YouTube
    const isDbVideo = isUUID(videoId)

    if (isDbVideo) {
      // Es un video de la base de datos
      const { data: dbVideo, error } = await supabase.from("videos").select("*").eq("id", videoId).maybeSingle()

      if (error || !dbVideo) {
        console.error("Error fetching video:", error)
        return notFound()
      }

      // Get profile information separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", dbVideo.user_id)
        .maybeSingle()

      // Combine the data
      const videoWithProfile = {
        ...dbVideo,
        profiles: profileData,
      }

      // Record a view
      try {
        await supabase.from("video_views").insert({
          video_id: dbVideo.id,
        })
      } catch (viewError) {
        console.error("Error recording view:", viewError)
      }

      // If it's a YouTube video stored in our database, get additional details
      let youtubeDetails = null
      if (dbVideo.youtube_id) {
        try {
          youtubeDetails = await getVideoDetails(dbVideo.youtube_id)
        } catch (ytError) {
          console.error("Error fetching YouTube details:", ytError)
        }
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer
              videoId={dbVideo.id}
              videoUrl={dbVideo.video_url}
              youtubeId={dbVideo.youtube_id}
              isUploaded={dbVideo.is_uploaded}
            />
            <VideoInfo video={videoWithProfile} youtubeDetails={youtubeDetails} isYoutubeVideo={!!dbVideo.youtube_id} />
            <CommentSection videoId={dbVideo.id} />
          </div>
          <div>
            <VideoRecommendations videoId={dbVideo.id} youtubeId={dbVideo.youtube_id} />
          </div>
        </div>
      )
    } else {
      // Es un ID de YouTube
      // No intentamos guardar en la base de datos para evitar errores de RLS
      const youtubeDetails = await getVideoDetails(videoId)

      if (!youtubeDetails) {
        return notFound()
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayer videoId={videoId} youtubeId={videoId} />
            <VideoInfo
              video={{ id: videoId, ...youtubeDetails.snippet }}
              youtubeDetails={youtubeDetails}
              isYoutubeVideo={true}
            />
            <CommentSection videoId={videoId} />
          </div>
          <div>
            <VideoRecommendations videoId={videoId} youtubeId={videoId} />
          </div>
        </div>
      )
    }
  } catch (error) {
    console.error("Error in watch page:", error)
    return notFound()
  }
}

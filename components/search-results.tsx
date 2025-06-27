import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { searchVideos } from "@/lib/youtube"
import { createServerClient } from "@/lib/supabase-server"

interface SearchResultsProps {
  query: string
}

export async function SearchResults({ query }: SearchResultsProps) {
  console.log(`Buscando videos con la consulta: "${query}"`)

  const supabase = createServerClient()

  // Buscar videos en nuestra base de datos
  let dbVideosWithProfiles = []
  try {
    const { data: dbVideos, error: dbError } = await supabase
      .from("videos")
      .select("*")
      .ilike("title", `%${query}%`)
      .order("view_count", { ascending: false })
      .limit(20)

    if (dbError) {
      console.error("Error buscando videos en la base de datos:", dbError)
    } else if (dbVideos && dbVideos.length > 0) {
      console.log(`Encontrados ${dbVideos.length} videos en la base de datos`)

      // Obtener perfiles de usuario por separado
      let profiles = []
      const userIds = dbVideos.map((video) => video.user_id).filter(Boolean)

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds)

        profiles = profilesData || []
      }

      // Combinar videos con sus perfiles
      dbVideosWithProfiles = dbVideos.map((video) => {
        const profile = profiles.find((p) => p.id === video.user_id)
        return {
          id: video.id,
          title: video.title,
          channelTitle: profile?.username || video.channel_title || "Unknown",
          thumbnailUrl: video.thumbnail_url,
          publishedAt: video.published_at || video.created_at,
          viewCount: video.view_count,
          description: video.description || "",
          isYoutubeVideo: !!video.youtube_id,
        }
      })
    }
  } catch (error) {
    console.error("Error con operaciones de base de datos:", error)
  }

  // Buscar videos en YouTube (datos de respaldo)
  const youtubeVideos = await searchVideos(query, 20)
  console.log(`Encontrados ${youtubeVideos.length} videos en YouTube`)

  // Combinar ambas fuentes
  const videos = [
    ...dbVideosWithProfiles,
    ...(youtubeVideos || []).map((video) => ({
      id: video.id.videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnailUrl: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      description: video.snippet.description,
      isYoutubeVideo: true,
    })),
  ]

  if (videos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No se encontraron videos para "{query}"</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {videos.map((video, index) => (
        <Link
          key={`${video.id}-${index}`}
          href={`/watch/${video.id}`}
          className="flex flex-col sm:flex-row gap-4 group"
        >
          <div className="relative aspect-video sm:w-64 rounded-lg overflow-hidden">
            <Image
              src={video.thumbnailUrl || "/placeholder.svg"}
              alt={video.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-medium line-clamp-2">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.channelTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {video.viewCount ? `${video.viewCount.toLocaleString()} views • ` : ""}
              {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
            </p>
            <p className="text-sm mt-2 line-clamp-2">{video.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

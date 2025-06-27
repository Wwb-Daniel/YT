"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { getPopularVideos } from "@/lib/youtube"
import { createClientSupabase } from "@/lib/supabase-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { FallbackVideos } from "@/components/fallback-videos"

export function VideoGrid() {
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [userRegion, setUserRegion] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Referencias para evitar múltiples cargas
  const loadingRef = useRef(false)
  const initialLoadDone = useRef(false)
  const regionDetected = useRef(false)

  // Detectar la región del usuario solo una vez
  useEffect(() => {
    if (!regionDetected.current) {
      regionDetected.current = true

      const detectRegion = async () => {
        try {
          const response = await fetch("https://ipapi.co/json/")
          const data = await response.json()
          console.log("Región detectada:", data.country_code)
          setUserRegion(data.country_code || "US")
        } catch (error) {
          console.error("Error detectando región:", error)
          setUserRegion("US") // Default to US if detection fails
        }
      }

      detectRegion()
    }
  }, [])

  // Cargar videos
  const loadVideos = useCallback(
    async (pageNumber: number) => {
      // Evitar cargas duplicadas
      if (loadingRef.current) {
        console.log("Ya se está cargando, ignorando solicitud")
        return
      }

      loadingRef.current = true
      setError(null)

      try {
        if (pageNumber === 1) {
          setIsLoading(true)
        } else {
          setLoadingMore(true)
        }

        console.log(`Cargando videos página ${pageNumber}, región: ${userRegion || "unknown"}`)

        // Obtener videos de la base de datos
        let dbVideosWithProfiles = []
        try {
          const supabase = createClientSupabase()
          const { data: dbVideos, error: dbError } = await supabase
            .from("videos")
            .select("*")
            .order("view_count", { ascending: false })
            .range((pageNumber - 1) * 8, pageNumber * 8 - 1)

          if (dbError) {
            console.error("Error obteniendo videos de la base de datos:", dbError.message || dbError)
            // Don't throw error, just continue with YouTube API
          } else if (dbVideos && dbVideos.length > 0) {
            console.log(`Obtenidos ${dbVideos.length} videos de la base de datos`)

            // Obtener perfiles de usuario por separado
            let profiles: any[] = []
            const userIds = dbVideos.map((video: any) => video.user_id).filter(Boolean)

            if (userIds.length > 0) {
              const { data: profilesData } = await supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", userIds)

              profiles = profilesData || []
            }

            // Combinar videos con sus perfiles
            dbVideosWithProfiles = dbVideos.map((video: any) => {
              const profile = profiles.find((p: any) => p.id === video.user_id)
              return {
                id: video.id,
                title: video.title,
                channelTitle: profile?.username || video.channel_title || "Unknown",
                thumbnailUrl: video.thumbnail_url,
                publishedAt: video.published_at || video.created_at,
                viewCount: video.view_count,
                isYoutubeVideo: !!video.youtube_id,
                source: "database",
              }
            })
          }
        } catch (dbError) {
          console.error("Error con operaciones de base de datos:", dbError)
          // Continue with YouTube API data instead of throwing
        }

        // Obtener videos de YouTube (ahora son datos de respaldo)
        let youtubeVideos = []
        try {
          // Pasar el número de página a la función para obtener diferentes videos
          const ytVideos = await getPopularVideos(8, userRegion || undefined, pageNumber)

          youtubeVideos = ytVideos.map((video: any) => ({
            id: video.id,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            thumbnailUrl: video.snippet.thumbnails.high.url,
            publishedAt: video.snippet.publishedAt,
            viewCount: video.statistics?.viewCount ? Number.parseInt(video.statistics.viewCount) : 0,
            isYoutubeVideo: true,
            source: "youtube",
          }))

          console.log(`Obtenidos ${youtubeVideos.length} videos de YouTube para la página ${pageNumber}`)
        } catch (ytError) {
          console.error("Error obteniendo videos de YouTube:", ytError)
        }

        // Combinar ambas fuentes
        const newVideos = [...dbVideosWithProfiles, ...youtubeVideos]
        console.log(`Total de nuevos videos: ${newVideos.length}`)

        if (newVideos.length === 0) {
          console.log("No se encontraron nuevos videos para esta página")
          if (pageNumber > 1) {
            setHasMore(false)
          } else {
            setError("No se pudieron cargar videos. Intenta de nuevo más tarde.")
          }
        } else {
          // Ordenar los videos
          const sortedVideos = newVideos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))

          if (pageNumber === 1) {
            setVideos(sortedVideos)
          } else {
            // Asegurarse de no duplicar videos
            const existingIds = new Set(videos.map((v) => v.id))
            const uniqueNewVideos = sortedVideos.filter((v) => !existingIds.has(v.id))

            console.log(`Agregando ${uniqueNewVideos.length} videos únicos nuevos`)

            if (uniqueNewVideos.length > 0) {
              setVideos((prev) => [...prev, ...uniqueNewVideos])
              setHasMore(true) // Asumimos que hay más si encontramos nuevos videos
            } else {
              console.log("No hay videos únicos nuevos para agregar")
              setHasMore(false)
            }
          }
        }
      } catch (error) {
        console.error("Error cargando videos:", error)
        setError("Error al cargar videos. Intenta de nuevo más tarde.")

        // Si hay un error y no tenemos videos, mostrar algunos videos de respaldo
        if (videos.length === 0) {
          const fallbackVideos = [
            {
              id: "dQw4w9WgXcQ",
              title: "Rick Astley - Never Gonna Give You Up",
              channelTitle: "Rick Astley",
              thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
              publishedAt: "2009-10-25T06:57:33Z",
              viewCount: 1234567,
              isYoutubeVideo: true,
            },
            {
              id: "9bZkp7q19f0",
              title: "PSY - GANGNAM STYLE",
              channelTitle: "PSY",
              thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
              publishedAt: "2012-07-15T07:46:32Z",
              viewCount: 4567890,
              isYoutubeVideo: true,
            },
          ]
          setVideos(fallbackVideos)
        }
      } finally {
        if (pageNumber === 1) {
          setIsLoading(false)
          initialLoadDone.current = true
        } else {
          setLoadingMore(false)
        }
        loadingRef.current = false
      }
    },
    [userRegion, videos],
  )

  // Función para cargar más videos (para el botón)
  const loadMoreVideos = () => {
    console.log("Botón 'Cargar más' presionado")
    if (!loadingRef.current && hasMore) {
      const nextPage = page + 1
      console.log(`Cargando página ${nextPage}`)
      setPage(nextPage)
      loadVideos(nextPage)
    }
  }

  // Configurar el observador de scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        !loadingRef.current &&
        hasMore &&
        initialLoadDone.current &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500
      ) {
        console.log("Scroll detectado cerca del final de la página")
        const nextPage = page + 1
        console.log(`Cargando página ${nextPage} por scroll`)
        setPage(nextPage)
        loadVideos(nextPage)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasMore, loadVideos, page])

  // Carga inicial
  useEffect(() => {
    if (!initialLoadDone.current && userRegion) {
      console.log("Carga inicial de videos")
      loadVideos(1)
    }
  }, [loadVideos, userRegion])

  if (isLoading && videos.length === 0) {
    return (
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
    )
  }

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No se encontraron videos</h2>
        <p className="text-muted-foreground mb-6">{error || "No hay videos disponibles en este momento."}</p>
        <Button onClick={() => loadVideos(1)}>Intentar de nuevo</Button>
      </div>
    )
  }

  return (
    <div>
      {userRegion && (
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando videos populares para tu región: <span className="font-medium">{userRegion}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video, index) => (
          <Link key={`${video.id}-${index}`} href={`/watch/${video.id}`} className="group">
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <Image
                src={video.thumbnailUrl || "/placeholder.svg"}
                alt={video.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="mt-2">
              <h3 className="font-medium line-clamp-2">{video.title}</h3>
              <p className="text-sm text-muted-foreground">{video.channelTitle}</p>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span>{video.viewCount ? `${video.viewCount.toLocaleString()} views` : "No views"}</span>
                <span className="mx-1">•</span>
                <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Botón para cargar más videos */}
      {hasMore && (
        <div className="flex justify-center my-8">
          <Button onClick={loadMoreVideos} disabled={loadingMore} className="flex items-center gap-2">
            {loadingMore ? "Cargando más videos..." : "Cargar más videos"}
            {loadingMore ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Indicador de carga para desplazamiento infinito */}
      {loadingMore && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 opacity-60">
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
      )}
    </div>
  )
}
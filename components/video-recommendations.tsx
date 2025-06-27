"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { createClientSupabase } from "@/lib/supabase-client"
import { Skeleton } from "@/components/ui/skeleton"
import { getRelatedVideos } from "@/lib/youtube"

interface VideoRecommendationsProps {
  videoId: string
  youtubeId?: string | null
}

export function VideoRecommendations({ videoId, youtubeId }: VideoRecommendationsProps) {
  const [videos, setVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRegion, setUserRegion] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Referencias para evitar múltiples cargas
  const loadingRef = useRef(false)
  const initialLoadDone = useRef(false)
  const regionDetected = useRef(false)

  // Elemento para observar el scroll
  const observerRef = useRef<HTMLDivElement>(null)

  // Detectar la región del usuario solo una vez
  useEffect(() => {
    if (!regionDetected.current) {
      regionDetected.current = true

      const detectRegion = async () => {
        try {
          const response = await fetch("https://ipapi.co/json/")
          const data = await response.json()
          console.log("Detected region for recommendations:", data.country_code)
          setUserRegion(data.country_code || "US")
        } catch (error) {
          console.error("Error detecting region:", error)
          setUserRegion("US") // Default to US if detection fails
        }
      }

      detectRegion()
    }
  }, [])

  // Configurar el observador de intersección para el scroll infinito
  useEffect(() => {
    if (!observerRef.current || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current && initialLoadDone.current) {
          console.log("Loading more recommendations due to scroll")
          setPage((prevPage) => prevPage + 1)
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    observer.observe(observerRef.current)

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [hasMore, loadingMore, initialLoadDone.current])

  // Cargar videos cuando cambia la página
  useEffect(() => {
    if (page > 1 && !loadingRef.current) {
      fetchRecommendedVideos(page)
    }
  }, [page])

  const fetchRecommendedVideos = async (pageNumber: number) => {
    // Evitar cargas duplicadas
    if (loadingRef.current) return
    loadingRef.current = true

    if (pageNumber === 1) {
      setIsLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      console.log(`Fetching recommended videos page ${pageNumber} for video ${videoId}`)
      const supabase = createClientSupabase()

      // Obtener videos de la base de datos
      let dbVideos: any[] = []
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .not("id", "eq", videoId)
          .order("view_count", { ascending: false })
          .range((pageNumber - 1) * 5, pageNumber * 5 - 1)

        if (error) {
          console.error("Error fetching videos:", error)
        } else {
          dbVideos = data || []
        }
      } catch (dbError) {
        console.error("Error with database operations:", dbError)
      }

      // Obtener perfiles para los videos
      const userIds = dbVideos.map((video) => video.user_id).filter(Boolean)
      let profiles: any[] = []

      if (userIds.length > 0) {
        try {
          const { data: profilesData } = await supabase.from("profiles").select("id, username").in("id", userIds)
          profiles = profilesData || []
        } catch (profileError) {
          console.error("Error fetching profiles:", profileError)
        }
      }

      // Combinar videos con perfiles
      const videosWithProfiles = dbVideos.map((video) => {
        const profile = profiles.find((p) => p.id === video.user_id)
        return {
          ...video,
          video_url: video.video_url,
          profiles: profile ? { username: profile.username } : null,
          source: "database",
        }
      })

      // Obtener videos relacionados de YouTube (datos de respaldo)
      let youtubeVideos = []
      if (youtubeId && pageNumber === 1) {
        try {
          const ytVideos = await getRelatedVideos(youtubeId)
          youtubeVideos = ytVideos.map((video: any) => ({
            id: video.id.videoId,
            title: video.snippet.title,
            thumbnail_url: video.snippet.thumbnails.high.url,
            channel_title: video.snippet.channelTitle,
            published_at: video.snippet.publishedAt,
            isYoutubeVideo: true,
            source: "youtube",
            video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          }))
        } catch (ytError) {
          console.error("Error fetching YouTube recommendations:", ytError)
        }
      }

      // Combinar ambas fuentes
      let allVideos = [...videosWithProfiles, ...youtubeVideos]

      // Ordenar videos de manera consistente
      allVideos = allVideos.sort((a, b) => {
        // Ordenar por fuente primero (database, youtube)
        if (a.source !== b.source) {
          return a.source === "database" ? -1 : 1
        }
        // Luego por número de vistas (mayor a menor)
        return (b.view_count || 0) - (a.view_count || 0)
      })

      console.log(`Loaded ${allVideos.length} recommended videos for page ${pageNumber}`)

      if (pageNumber === 1) {
        setVideos(allVideos)
      } else {
        // Asegurarse de no duplicar videos
        const existingIds = new Set(videos.map((v) => v.id))
        const uniqueNewVideos = allVideos.filter((v) => !existingIds.has(v.id))

        if (uniqueNewVideos.length > 0) {
          setVideos((prev) => [...prev, ...uniqueNewVideos])
        }
      }

      // Determinar si hay más videos para cargar
      setHasMore(allVideos.length >= 5)

      if (pageNumber === 1) {
        initialLoadDone.current = true
      }
    } catch (error) {
      console.error("Error fetching recommended videos:", error)
    } finally {
      if (pageNumber === 1) {
        setIsLoading(false)
      } else {
        setLoadingMore(false)
      }
      loadingRef.current = false
    }
  }

  // Cargar videos iniciales
  useEffect(() => {
    if (videoId && !initialLoadDone.current) {
      fetchRecommendedVideos(1)
    }
  }, [videoId, youtubeId, userRegion])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Recommended Videos</h2>
        <div className="space-y-4">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="w-40 h-24 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Recommended Videos</h2>
        <p className="text-center text-muted-foreground py-10">No recommendations found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">
        Recommended Videos {userRegion && <span className="text-sm text-muted-foreground">({userRegion})</span>}
      </h2>
      <div className="space-y-4">
        {videos.map((video, index) => (
          <Link key={`${video.id}-${index}`} href={`/watch/${video.id}`} className="flex gap-2 group">
            <div className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={video.thumbnail_url || "/placeholder.svg"}
                alt={video.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium line-clamp-2">{video.title}</h3>
              <p className="text-xs text-muted-foreground">
                {video.profiles?.username || video.channel_title || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">
                {video.view_count ? `${video.view_count.toLocaleString()} views • ` : ""}
                {formatDistanceToNow(new Date(video.created_at || video.published_at), { addSuffix: true })}
              </p>
            </div>
          </Link>
        ))}

        {/* Indicador de carga para scroll infinito */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="space-y-2">
              <Skeleton className="w-40 h-24 rounded-lg" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}

        {/* Elemento observado para el scroll infinito */}
        {hasMore && <div ref={observerRef} className="h-4" />}
      </div>
    </div>
  )
}

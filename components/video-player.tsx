"use client"

import { useEffect, useState, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter, usePathname } from "next/navigation"

interface VideoPlayerProps {
  videoId: string
  videoUrl?: string
  youtubeId?: string
  isUploaded?: boolean
}

export function VideoPlayer({ videoId, videoUrl, youtubeId, isUploaded }: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Custom video player hooks (declarados siempre)
  const [playing, setPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mejorar barra de progreso: manejo de seek, arrastre, hover y buffering
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const progressBarRef = useRef<HTMLInputElement>(null)

  // Volumen
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Play/pause handler
  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setPlaying(!playing)
  }

  // Update current time
  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Set duration
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // Buffering events
  const handleWaiting = () => setIsBuffering(true)
  const handlePlaying = () => setIsBuffering(false)

  // Seek handlers
  const handleSeekMouseDown = () => setIsSeeking(true)
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(false)
    let value = 0
    if ('changedTouches' in e) {
      // TouchEvent
      const touch = e.changedTouches[0]
      if (progressBarRef.current && duration) {
        const rect = progressBarRef.current.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const percent = Math.min(Math.max(x / rect.width, 0), 1)
        value = percent * duration
      }
    } else {
      // MouseEvent
      if (progressBarRef.current && duration) {
        const rect = progressBarRef.current.getBoundingClientRect()
        const x = (e as React.MouseEvent<HTMLInputElement>).clientX - rect.left
        const percent = Math.min(Math.max(x / rect.width, 0), 1)
        value = percent * duration
      }
    }
    if (videoRef.current) {
      videoRef.current.currentTime = value
    }
    setCurrentTime(value)
    setSeekTime(null)
  }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    setCurrentTime(time)
    setSeekTime(null)
  }

  // Hover preview (solo tiempo)
  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!progressBarRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.min(Math.max(x / rect.width, 0), 1)
    setHoverTime(percent * duration)
  }
  const handleProgressBarMouseLeave = () => setHoverTime(null)

  // Actualiza el valor del input range mientras se arrastra
  const progressValue = isSeeking && seekTime !== null ? seekTime : currentTime

  // Play/pause state sync
  useEffect(() => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }, [playing])

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Sincronizar volumen y mute con el video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // Cambiar volumen
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
    if (Number(e.target.value) === 0) setIsMuted(true)
    else setIsMuted(false)
  }

  // Mute/unmute
  const toggleMute = () => {
    setIsMuted((prev) => !prev)
    if (videoRef.current && videoRef.current.volume === 0) {
      setVolume(0.5)
    }
  }

  // Pantalla completa
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const handleFullscreen = () => {
    const el = playerContainerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Picture-in-Picture nativo
  const handlePiP = async () => {
    if (videoRef.current) {
      // @ts-ignore
      if (document.pictureInPictureElement) {
        // @ts-ignore
        document.exitPictureInPicture()
      } else if (videoRef.current.requestPictureInPicture) {
        // @ts-ignore
        await videoRef.current.requestPictureInPicture()
      }
    }
  }

  // Atajos de teclado (sin miniplayer)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return
      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break
        case 'arrowright': if (videoRef.current) videoRef.current.currentTime += 5; break
        case 'arrowleft': if (videoRef.current) videoRef.current.currentTime -= 5; break
        case 'm': toggleMute(); break
        case 'f': handleFullscreen(); break
        case 'p': handlePiP(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  useEffect(() => {
    console.log("VideoPlayer mounted");
    setIsMounted(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log("Loading finished");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // --- Siguiente video automático ---
  const [nextVideoId, setNextVideoId] = useState<string | null>(null)

  // Buscar el siguiente video recomendado al cargar el video actual
  useEffect(() => {
    async function fetchNextVideo() {
      // Si es un video de YouTube, puedes buscar relacionados por API, pero aquí solo ejemplo con base de datos
      if (isUploaded) {
        try {
          const res = await fetch(`/api/youtube/related?videoId=${videoId}`)
          const data = await res.json()
          if (data && data.length > 0) {
            setNextVideoId(data[0].id)
          } else {
            setNextVideoId(null)
          }
        } catch {
          setNextVideoId(null)
        }
      } else if (youtubeId) {
        // Si es YouTube, puedes usar la API de relacionados
        try {
          const res = await fetch(`/api/youtube/related?videoId=${youtubeId}`)
          const data = await res.json()
          if (data && data.length > 0) {
            setNextVideoId(data[0].id)
          } else {
            setNextVideoId(null)
          }
        } catch {
          setNextVideoId(null)
        }
      } else {
        setNextVideoId(null)
      }
    }
    fetchNextVideo()
  }, [videoId, youtubeId, isUploaded])

  // Al terminar el video, ir al siguiente automáticamente
  const router = useRouter()
  const handleEnded = () => {
    if (nextVideoId) {
      setTimeout(() => {
        router.push(`/watch/${nextVideoId}`)
      }, 3000)
    } else {
      setShowNoNextVideo(true)
    }
  }

  // Estado para mostrar controles
  const [showControls, setShowControls] = useState(true)
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null)

  // Manejar visibilidad de controles por inactividad
  useEffect(() => {
    if (!playing) {
      setShowControls(true)
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current)
        inactivityTimeout.current = null
      }
      return
    }
    const handleMouseMove = () => {
      setShowControls(true)
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current)
      inactivityTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 2000)
    }
    const container = playerContainerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', () => setShowControls(false))
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseleave', () => setShowControls(false))
      }
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current)
    }
  }, [playing])

  const [showNoNextVideo, setShowNoNextVideo] = useState(false)

  if (!isMounted) {
    return <div className="aspect-video bg-muted animate-pulse rounded-lg" />
  }

  if (isLoading) {
    return <Skeleton className="aspect-video rounded-lg" />
  }

  // If it's a YouTube video
  if (youtubeId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    )
  }

  // If it's an uploaded video
  if (isUploaded && videoUrl) {
    return (
      <div
        ref={playerContainerRef}
        className="aspect-video rounded-lg overflow-hidden bg-black relative flex flex-col transition-all duration-300"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          poster={`https://image.mux.com/${videoId}/thumbnail.jpg`}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setError("Video could not be loaded")}
          onClick={togglePlay}
          tabIndex={0}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onEnded={handleEnded}
        >
          Your browser does not support the video tag.
        </video>
        {showControls && (
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent px-4 pb-2 pt-6 flex flex-col transition-opacity duration-300" style={{opacity: showControls ? 1 : 0}}>
            {/* Progress Bar */}
            <div className="relative w-full flex items-center h-8">
              <input
                ref={progressBarRef}
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={progressValue}
                onChange={(e) => {
                  setSeekTime(Number(e.target.value))
                  handleSeek(e)
                }}
                onMouseDown={handleSeekMouseDown}
                onMouseUp={handleSeekMouseUp}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={handleSeekMouseUp}
                onMouseMove={handleProgressBarMouseMove}
                onMouseLeave={handleProgressBarMouseLeave}
                className="w-full h-2 bg-white rounded-full appearance-none outline-none cursor-pointer relative z-10"
                style={{
                  background: `linear-gradient(to right, #ef4444 ${(progressValue/duration)*100}%, #fff ${(progressValue/duration)*100}%)`,
                }}
              />
              {/* Ocultar el thumb del input range en todos los navegadores */}
              <style jsx>{`
                input[type='range']::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 0;
                  height: 0;
                  background: transparent;
                  border: none;
                  box-shadow: none;
                }
                input[type='range']:focus::-webkit-slider-thumb {
                  outline: none;
                }
                input[type='range']::-moz-range-thumb {
                  width: 0;
                  height: 0;
                  background: transparent;
                  border: none;
                  box-shadow: none;
                }
                input[type='range']:focus::-moz-range-thumb {
                  outline: none;
                }
                input[type='range']::-ms-thumb {
                  width: 0;
                  height: 0;
                  background: transparent;
                  border: none;
                  box-shadow: none;
                }
                input[type='range']:focus::-ms-thumb {
                  outline: none;
                }
                input[type='range']::-webkit-slider-runnable-track {
                  height: 8px;
                  border-radius: 4px;
                }
                input[type='range']::-ms-fill-lower {
                  background: #ef4444;
                  border-radius: 4px;
                }
                input[type='range']::-ms-fill-upper {
                  background: #fff;
                  border-radius: 4px;
                }
              `}</style>
              {/* Hover time preview */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-6 left-0 text-xs text-white bg-black/80 px-2 py-1 rounded shadow pointer-events-none"
                  style={{ left: `calc(${(hoverTime/duration)*100}% - 20px)` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>
            {/* Controls */}
            <div className="flex items-center gap-4 mt-2 w-full justify-between">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="text-white focus:outline-none hover:scale-110 transition-transform"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>
                  ) : (
                    <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                  )}
                </button>
                {/* Volume */}
                <button
                  onClick={toggleMute}
                  className="text-white focus:outline-none hover:scale-110 transition-transform"
                  aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12a4.5 4.5 0 0 0-4.5-4.5v9a4.5 4.5 0 0 0 4.5-4.5zm-6.5 4h-4v-8h4l5-5v18l-5-5z"/><line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
                  ) : volume < 0.5 ? (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                  ) : (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 accent-red-600 mx-2 cursor-pointer"
                />
                {/* Botón PiP */}
                <button
                  onClick={handlePiP}
                  className="text-white focus:outline-none hover:scale-110 transition-transform"
                  aria-label="Picture in Picture"
                >
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><rect x="13" y="13" width="6" height="4" rx="1" fill="#ef4444"/></svg>
                </button>
                {/* Botón pantalla completa */}
                <button
                  onClick={handleFullscreen}
                  className="text-white focus:outline-none hover:scale-110 transition-transform"
                  aria-label="Pantalla completa"
                >
                  {isFullscreen ? (
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M9 9L5 5M5 5v4M5 5h4M15 9l4-4m0 0v4m0-4h-4M9 15l-4 4m0 0v-4m0 4h4m6-4l4 4m0 0v-4m0 4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 8v4a2 2 0 0 0 2 2h4m6-18h4a2 2 0 0 1 2 2v4m0 8v4a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  )}
                </button>
              </div>
              {/* Time */}
              <span className="text-xs text-white font-mono">
                {formatTime(progressValue)} / {formatTime(duration)}
              </span>
              {/* Buffering */}
              {isBuffering && <span className="text-xs text-yellow-400 ml-2">Cargando...</span>}
              {/* Siguiente video */}
              {nextVideoId && (
                <button
                  onClick={() => router.push(`/watch/${nextVideoId}`)}
                  className="text-xs text-white bg-red-600 hover:bg-red-700 rounded px-3 py-1 ml-4"
                >
                  Siguiente video ▶
                </button>
              )}
            </div>
          </div>
        )}
        {showNoNextVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg font-bold z-20">
            No hay video recomendado para reproducir.
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">{error}</div>
        )}
      </div>
    )
  }

  // If it's a video from an external URL
  if (videoUrl) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-full"
          onError={() => setError("Video could not be loaded")}
        >
          Your browser does not support the video tag.
        </video>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">{error}</div>
        )}
      </div>
    )
  }

  // Fallback
  return (
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
      <p className="text-muted-foreground">Video not available</p>
    </div>
  )
}

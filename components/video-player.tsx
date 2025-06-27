"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClientSupabase } from "@/lib/supabase-client"

interface VideoPlayerProps {
  videoId: string
  videoUrl?: string
  youtubeId?: string
  isUploaded?: boolean
  recommendedVideos?: any[]
  autoplayDelay?: number
}

export function VideoPlayer({ videoId, videoUrl, youtubeId, isUploaded, recommendedVideos = [], autoplayDelay = 0 }: VideoPlayerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Custom video player hooks
  const [playing, setPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Progress bar and seeking
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState(0)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Volume controls
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  // UI states
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [nextVideoId, setNextVideoId] = useState<string | null>(null)
  const [showNoNextVideo, setShowNoNextVideo] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)

  const playerContainerRef = useRef<HTMLDivElement>(null)
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

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

  // Progress bar interaction
  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.min(Math.max(x / rect.width, 0), 1)
    setHoverTime(percent * duration)
    setHoverPosition(percent * 100)
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.min(Math.max(x / rect.width, 0), 1)
    const time = percent * duration
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null)
    setHoverPosition(0)
  }

  // Volume controls
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
    }
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (videoRef.current) {
      videoRef.current.muted = newMuted
      if (newMuted && volume > 0) {
        videoRef.current.dataset.previousVolume = volume.toString()
      } else if (!newMuted && volume === 0) {
        const prevVolume = Number.parseFloat(videoRef.current.dataset.previousVolume || "0.5")
        handleVolumeChange(prevVolume)
      }
    }
  }

  // Fullscreen
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

  // Picture-in-Picture
  const handlePiP = async () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture()
      }
    }
  }

  // Theater mode
  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode)
  }

  // Skip functions
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
    }
  }

  // Format time helper
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault()
          togglePlay()
          break
        case "arrowright":
          e.preventDefault()
          skipForward()
          break
        case "arrowleft":
          e.preventDefault()
          skipBackward()
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "f":
          e.preventDefault()
          handleFullscreen()
          break
        case "t":
          e.preventDefault()
          toggleTheaterMode()
          break
        case "p":
          e.preventDefault()
          handlePiP()
          break
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [playing])

  // Controls visibility
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
      }, 3000)
    }

    const container = playerContainerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", () => setShowControls(false))
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
        container.removeEventListener("mouseleave", () => setShowControls(false))
      }
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current)
    }
  }, [playing])

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  // Mount and loading
  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // Auto-next video logic
  const currentIndex = recommendedVideos.findIndex(v => v.id === videoId);
  const nextVideo = currentIndex >= 0 && currentIndex < recommendedVideos.length - 1 ? recommendedVideos[currentIndex + 1] : null;

  const handleEnded = useCallback(() => {
    if (nextVideo) {
      setTimeout(() => {
        router.push(`/watch/${nextVideo.id}`);
      }, autoplayDelay);
    } else {
      setShowNoNextVideo(true);
    }
  }, [nextVideo, router, autoplayDelay]);

  useEffect(() => {
    // Solo trackear vistas de videos de la base de datos (UUID v4)
    if (!videoId || videoId.length !== 36) return
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id ?? null
      supabase.from("video_views").insert({
        video_id: videoId,
        user_id: userId,
      }).then(({ error }) => {
        if (error) {
          console.error("Error insertando view:", error)
        } else {
          console.log("View insertada correctamente")
        }
      })
    })
  }, [videoId])

  if (!isMounted) {
    return (
      <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 animate-pulse rounded-xl shadow-2xl" />
    )
  }

  if (isLoading) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <div className="text-white/80 font-medium">Loading video...</div>
        </div>
      </div>
    )
  }

  // YouTube player
  if (youtubeId) {
    return (
      <div
        className={cn(
          "rounded-xl overflow-hidden shadow-2xl transition-all duration-500",
          isTheaterMode ? "aspect-[21/9]" : "aspect-video",
        )}
      >
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&modestbranding=1&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  // Custom video player
  if ((isUploaded && videoUrl) || videoUrl) {
    return (
      <div
        ref={playerContainerRef}
        className={cn(
          "relative rounded-xl overflow-hidden bg-black shadow-2xl transition-all duration-500 group",
          isTheaterMode ? "aspect-[21/9]" : "aspect-video",
          isFullscreen && "!aspect-auto !rounded-none",
        )}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          poster={isUploaded ? `https://image.mux.com/${videoId}/thumbnail.jpg` : undefined}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setError("Video could not be loaded")}
          onClick={togglePlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onEnded={handleEnded}
        />

        {/* Buffering Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white/90 text-sm font-medium">Buffering...</span>
            </div>
          </div>
        )}

        {/* Center Play Button */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all duration-300 shadow-2xl"
            >
              <svg width="32" height="32" fill="white" viewBox="0 0 24 24" className="ml-1">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </button>
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-all duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <button
              onClick={toggleTheaterMode}
              className="p-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-black/70 transition-all duration-200"
              title="Theater Mode (T)"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div
                ref={progressBarRef}
                className="relative h-2 bg-white/20 rounded-full cursor-pointer group/progress"
                onMouseMove={handleProgressBarMouseMove}
                onMouseLeave={handleProgressBarMouseLeave}
                onClick={handleProgressBarClick}
              >
                {/* Progress Track */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />

                {/* Progress Handle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-all duration-200 transform -translate-x-1/2"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />

                {/* Hover Preview */}
                {hoverTime !== null && (
                  <div
                    className="absolute -top-10 bg-black/80 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2"
                    style={{ left: `${hoverPosition}%` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:scale-110 transition-transform duration-200"
                  title={playing ? "Pause (Space)" : "Play (Space)"}
                >
                  {playing ? (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  )}
                </button>

                {/* Skip Backward */}
                <button
                  onClick={skipBackward}
                  className="p-2 text-white hover:scale-110 transition-transform duration-200"
                  title="Skip backward 10s (←)"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor">
                      10
                    </text>
                  </svg>
                </button>

                {/* Skip Forward */}
                <button
                  onClick={skipForward}
                  className="p-2 text-white hover:scale-110 transition-transform duration-200"
                  title="Skip forward 10s (→)"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                    <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor">
                      10
                    </text>
                  </svg>
                </button>

                {/* Volume Controls */}
                <div
                  className="flex items-center space-x-2"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:scale-110 transition-transform duration-200"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {isMuted || volume === 0 ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>

                  {/* Volume Slider */}
                  <div
                    className={cn(
                      "transition-all duration-300 overflow-hidden",
                      showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0",
                    )}
                  >
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Time Display */}
                <span className="text-white/90 text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Picture in Picture */}
                <button
                  onClick={handlePiP}
                  className="p-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-black/50 transition-all duration-200"
                  title="Picture in Picture (P)"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="13" y="13" width="6" height="4" rx="1" fill="currentColor" />
                  </svg>
                </button>

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className="p-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-black/50 transition-all duration-200"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  )}
                </button>

                {/* Next Video Button */}
                {nextVideo && (
                  <button
                    onClick={() => router.push(`/watch/${nextVideo.id}`)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                  >
                    Next Video →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* No Next Video Overlay */}
        {showNoNextVideo && recommendedVideos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-2xl font-bold mb-2">🎬</div>
              <div className="text-lg font-semibold mb-1">That's all for now!</div>
              <div className="text-white/70">No more recommended videos</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-lg font-semibold mb-2">Video Error</div>
              <div className="text-white/70">{error}</div>
            </div>
          </div>
        )}

        {/* Custom Styles */}
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .slider::-webkit-slider-track {
            background: linear-gradient(to right, #ef4444 0%, #ef4444 var(--progress, 0%), rgba(255,255,255,0.3) var(--progress, 0%), rgba(255,255,255,0.3) 100%);
            height: 4px;
            border-radius: 2px;
          }
          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .slider::-moz-range-track {
            background: rgba(255,255,255,0.3);
            height: 4px;
            border-radius: 2px;
          }
        `}</style>
      </div>
    )
  }

  // Fallback
  return (
    <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl flex items-center justify-center shadow-2xl">
      <div className="text-center text-white/70">
        <div className="text-4xl mb-4">📹</div>
        <p className="text-lg font-medium">Video not available</p>
      </div>
    </div>
  )
}

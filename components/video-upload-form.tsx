"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Upload,
  X,
  Play,
  ImageIcon,
  Video,
  Link,
  FileVideo,
  Clock,
  Eye,
  Globe,
  Loader2,
  CheckCircle,
  Info,
  Sparkles,
  Zap,
  Camera,
  Film,
  Monitor,
  Youtube,
  ExternalLink,
} from "lucide-react"
import { z } from "zod"

// Validation schemas
const videoFileSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  category: z.string().min(1, "Please select a category"),
  visibility: z.enum(["public", "unlisted", "private"]),
  tags: z.string().optional(),
})

const videoUrlSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  videoUrl: z.string().url("Please enter a valid URL"),
  thumbnailUrl: z.string().url("Please enter a valid thumbnail URL").optional().or(z.literal("")),
  category: z.string().min(1, "Please select a category"),
  visibility: z.enum(["public", "unlisted", "private"]),
})

interface VideoUploadFormProps {
  userId: string
}

interface VideoMetadata {
  duration?: number
  size?: number
  format?: string
  resolution?: string
  fps?: number
}

interface UploadStats {
  totalSize: number
  uploadedSize: number
  speed: number
  timeRemaining: number
}

const VIDEO_CATEGORIES = [
  { value: "education", label: "Education", icon: "📚" },
  { value: "entertainment", label: "Entertainment", icon: "🎬" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "gaming", label: "Gaming", icon: "🎮" },
  { value: "sports", label: "Sports", icon: "⚽" },
  { value: "technology", label: "Technology", icon: "💻" },
  { value: "lifestyle", label: "Lifestyle", icon: "✨" },
  { value: "business", label: "Business", icon: "💼" },
  { value: "other", label: "Other", icon: "📁" },
]

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can search for and view",
    icon: Globe,
  },
  {
    value: "unlisted",
    label: "Unlisted",
    description: "Anyone with the link can view",
    icon: Link,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can view",
    icon: Eye,
  },
]

export function VideoUploadForm({ userId }: VideoUploadFormProps) {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [activeTab, setActiveTab] = useState("file")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public")
  const [tags, setTags] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")

  // File handling
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Refs
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Extract video metadata
  const extractVideoMetadata = useCallback((file: File): Promise<VideoMetadata> => {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          size: file.size,
          format: file.type,
          resolution: `${video.videoWidth}x${video.videoHeight}`,
        })
        URL.revokeObjectURL(video.src)
      }
      video.src = URL.createObjectURL(file)
    })
  }, [])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const videoFile = files.find((file) => file.type.startsWith("video/"))
      const imageFile = files.find((file) => file.type.startsWith("image/"))

      if (videoFile) {
        await handleVideoFileSelection(videoFile)
      }
      if (imageFile && !thumbnailFile) {
        await handleThumbnailFileSelection(imageFile)
      }
    },
    [thumbnailFile],
  )

  // Handle video file selection
  const handleVideoFileSelection = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video file must be less than 500MB",
        variant: "destructive",
      })
      return
    }

    setVideoFile(file)
    const preview = URL.createObjectURL(file)
    setVideoPreview(preview)

    // Extract metadata
    try {
      const metadata = await extractVideoMetadata(file)
      setVideoMetadata(metadata)
    } catch (error) {
      console.error("Failed to extract video metadata:", error)
    }

    // Auto-generate title from filename if empty
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      setTitle(fileName.charAt(0).toUpperCase() + fileName.slice(1))
    }
  }

  // Handle thumbnail file selection
  const handleThumbnailFileSelection = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Thumbnail must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleVideoFileSelection(file)
    }
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleThumbnailFileSelection(file)
    }
  }

  // Clear files
  const clearVideoFile = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    setVideoMetadata(null)
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  const clearThumbnailFile = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    setThumbnailFile(null)
    setThumbnailPreview(null)
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

  // Validate forms
  const validateFileForm = () => {
    try {
      videoFileSchema.parse({
        title,
        description,
        category,
        visibility,
        tags,
      })
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const validateUrlForm = () => {
    try {
      videoUrlSchema.parse({
        title,
        description,
        videoUrl,
        thumbnailUrl,
        category,
        visibility,
      })
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  // Handle file upload
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload videos",
      })
      router.push("/login")
      return
    }

    if (!validateFileForm() || !videoFile) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload video file
      const videoFileName = `${userId}/${Date.now()}-${videoFile.name.replace(/\s+/g, "-")}`
      const { data: videoData, error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (videoError) throw videoError

      // Get public URL for the video
      const { data: videoUrlData } = supabase.storage.from("videos").getPublicUrl(videoFileName)

      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnailFile) {
        const thumbnailFileName = `${userId}/thumbnails/${Date.now()}-${thumbnailFile.name.replace(/\s+/g, "-")}`
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from("videos")
          .upload(thumbnailFileName, thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (thumbnailError) throw thumbnailError

        const { data: thumbUrl } = supabase.storage.from("videos").getPublicUrl(thumbnailFileName)
        thumbnailUrl = thumbUrl.publicUrl
      }

      // Create video record
      const { data, error } = await supabase
        .from("videos")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrlData.publicUrl,
          thumbnail_url: thumbnailUrl || null,
          youtube_id: null,
          category: category || null,
          visibility: visibility || null,
          tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : null,
          duration: videoMetadata?.duration || null,
          file_size: videoFile.size,
          resolution: videoMetadata?.resolution || null,
          is_uploaded: true,
          storage_path: videoFileName,
          published_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Video uploaded successfully! 🎉",
        description: "Your video has been uploaded and is ready to watch",
      })

      router.push(`/watch/${data.id}`)
    } catch (error: any) {
      console.error("Error uploading video:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle URL upload
  const handleUploadFromUrl = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload videos",
      })
      router.push("/login")
      return
    }

    if (!validateUrlForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Extract YouTube ID if it's a YouTube URL
      let youtubeId = null
      const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
      const match = videoUrl.match(youtubeRegex)

      if (match && match[1]) {
        youtubeId = match[1]
      }

      // Create video record
      const { data, error } = await supabase
        .from("videos")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrl.trim(),
          thumbnail_url: thumbnailUrl.trim() || null,
          youtube_id: youtubeId,
          category: category || null,
          visibility: visibility || null,
          is_uploaded: false,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Video added successfully! 🎉",
        description: "Your video has been added to your library",
      })

      router.push(`/watch/${data.id}`)
    } catch (error: any) {
      console.error("Error adding video:", error)
      toast({
        title: "Failed to add video",
        description: error.message || "Failed to add video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview)
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [videoPreview, thumbnailPreview])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Video className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Your Video</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your content with the world. Upload from your device or add videos from external platforms.
        </p>
      </div>

      {/* Upload Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Add from URL
          </TabsTrigger>
        </TabsList>

        {/* File Upload Tab */}
        <TabsContent value="file" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5" />
                Upload Video File
              </CardTitle>
              <CardDescription>
                Upload video files directly from your device. Supported formats: MP4, MOV, AVI, MKV (max 500MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadFile} className="space-y-6">
                {/* Drag & Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : videoFile
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {!videoFile ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-full">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Drop your video here</h3>
                        <p className="text-muted-foreground">or click to browse files</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-green-700 dark:text-green-400">File Selected</h3>
                        <p className="text-sm text-muted-foreground">{videoFile.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(videoFile.size)}</p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          Change File
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearVideoFile}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                </div>

                {/* Video Preview */}
                {videoPreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Play className="w-5 h-5" />
                        Video Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            ref={videoPreviewRef}
                            src={videoPreview}
                            controls
                            className="w-full h-full"
                            preload="metadata"
                          />
                        </div>

                        {/* Video Metadata */}
                        {videoMetadata && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {videoMetadata.duration && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{formatDuration(videoMetadata.duration)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <FileVideo className="w-4 h-4 text-muted-foreground" />
                              <span>{formatFileSize(videoMetadata.size || 0)}</span>
                            </div>
                            {videoMetadata.resolution && (
                              <div className="flex items-center gap-2 text-sm">
                                <Monitor className="w-4 h-4 text-muted-foreground" />
                                <span>{videoMetadata.resolution}</span>
                              </div>
                            )}
                            {videoMetadata.format && (
                              <div className="flex items-center gap-2 text-sm">
                                <Film className="w-4 h-4 text-muted-foreground" />
                                <span>{videoMetadata.format.split("/")[1]?.toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Thumbnail Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ImageIcon className="w-5 h-5" />
                      Thumbnail (Optional)
                    </CardTitle>
                    <CardDescription>Upload a custom thumbnail for your video</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => thumbnailInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex-1"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {thumbnailFile ? "Change Thumbnail" : "Upload Thumbnail"}
                        </Button>
                        {thumbnailFile && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={clearThumbnailFile}
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        className="hidden"
                        disabled={isUploading}
                      />

                      {thumbnailPreview && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-sm">
                          <img
                            src={thumbnailPreview || "/placeholder.svg"}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Video Details Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5" />
                      Video Details
                    </CardTitle>
                    <CardDescription>Add information about your video</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center gap-2">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter an engaging title for your video"
                        className={errors.title ? "border-destructive" : ""}
                        disabled={isUploading}
                        maxLength={100}
                      />
                      {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Make it catchy and descriptive</span>
                        <span>{title.length}/100</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your video content, what viewers can expect..."
                        className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`}
                        disabled={isUploading}
                        maxLength={1000}
                      />
                      {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Help viewers understand what your video is about</span>
                        <span>{description.length}/1000</span>
                      </div>
                    </div>

                    {/* Category and Visibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category <span className="text-destructive">*</span>
                        </Label>
                        <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                          <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {VIDEO_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                <div className="flex items-center gap-2">
                                  <span>{cat.icon}</span>
                                  <span>{cat.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select
                          value={visibility}
                          onValueChange={(value: "public" | "unlisted" | "private") => setVisibility(value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VISIBILITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="gaming, tutorial, review (separate with commas)"
                        disabled={isUploading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Add relevant tags to help people discover your video
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Progress */}
                {isUploading && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="font-medium">Uploading your video...</span>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowCancelDialog(true)}>
                            Cancel
                          </Button>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{uploadProgress}% complete</span>
                          {uploadStats && <span>{formatFileSize(uploadStats.speed)}/s</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isUploading || !videoFile} className="min-w-[200px]" size="lg">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Upload Video
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* URL Upload Tab */}
        <TabsContent value="url" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5" />
                Add Video from URL
              </CardTitle>
              <CardDescription>Add videos from YouTube, Vimeo, or other platforms by providing the URL</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadFromUrl} className="space-y-6">
                {/* Video URL */}
                <div className="space-y-2">
                  <Label htmlFor="video-url" className="flex items-center gap-2">
                    Video URL <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="video-url"
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`pr-10 ${errors.videoUrl ? "border-destructive" : ""}`}
                      disabled={isUploading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  {errors.videoUrl && <p className="text-sm text-destructive">{errors.videoUrl}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="w-3 h-3" />
                    <span>Supports YouTube, Vimeo, and other video platforms</span>
                  </div>
                </div>

                {/* Thumbnail URL */}
                <div className="space-y-2">
                  <Label htmlFor="thumbnail-url">Thumbnail URL (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="thumbnail-url"
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://example.com/thumbnail.jpg"
                      className={errors.thumbnailUrl ? "border-destructive" : ""}
                      disabled={isUploading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  {errors.thumbnailUrl && <p className="text-sm text-destructive">{errors.thumbnailUrl}</p>}
                </div>

                {/* Video Details */}
                <Separator />

                <div className="space-y-6">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Video Details
                  </h3>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title-url">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title-url"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter video title"
                      className={errors.title ? "border-destructive" : ""}
                      disabled={isUploading}
                      maxLength={100}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Make it descriptive and engaging</span>
                      <span>{title.length}/100</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description-url">Description</Label>
                    <Textarea
                      id="description-url"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the video content..."
                      className={`min-h-[120px] ${errors.description ? "border-destructive" : ""}`}
                      disabled={isUploading}
                      maxLength={1000}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Help viewers understand what the video is about</span>
                      <span>{description.length}/1000</span>
                    </div>
                  </div>

                  {/* Category and Visibility */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category-url">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility-url">Visibility</Label>
                      <Select
                        value={visibility}
                        onValueChange={(value: "public" | "unlisted" | "private") => setVisibility(value)}
                        disabled={isUploading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIBILITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <option.icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isUploading || !videoUrl} className="min-w-[200px]" size="lg">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Add Video
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Upload Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the upload? Your progress will be lost and you'll need to start over.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Upload</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsUploading(false)
                setUploadProgress(0)
                setShowCancelDialog(false)
              }}
            >
              Cancel Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

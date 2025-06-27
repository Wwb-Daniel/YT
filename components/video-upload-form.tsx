"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"

interface VideoUploadFormProps {
  userId: string
}

export function VideoUploadForm({ userId }: VideoUploadFormProps) {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false) // Declare isLoading variable

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is a video
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      })
      return
    }

    // Check if file is too large (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video file must be less than 100MB",
        variant: "destructive",
      })
      return
    }

    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const clearVideoFile = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    if (videoInputRef.current) videoInputRef.current.value = ""
  }

  const clearThumbnailFile = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    setThumbnailFile(null)
    setThumbnailPreview(null)
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
  }

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

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your video",
        variant: "destructive",
      })
      return
    }

    if (!videoUrl.trim()) {
      toast({
        title: "Video URL required",
        description: "Please enter a URL for your video",
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

      // Create video record in database
      const { data, error } = await supabase
        .from("videos")
        .insert({
          user_id: userId,
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          youtube_id: youtubeId,
          is_uploaded: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Insert error:", error)
        throw new Error("Failed to add video. Please try again.")
      }

      toast({
        title: "Video added successfully",
        description: "Your video has been added to your library",
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
    }
  }

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

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your video",
        variant: "destructive",
      })
      return
    }

    if (!videoFile) {
      toast({
        title: "Video file required",
        description: "Please select a video file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Upload video file to storage
      const videoFileName = `${userId}/${Date.now()}-${videoFile.name.replace(/\s+/g, "-")}`
      const { data: videoData, error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (videoError) throw videoError

      // Get public URL for the video
      const { data: videoUrl } = supabase.storage.from("videos").getPublicUrl(videoFileName)

      // Upload thumbnail if provided, otherwise use a default or generate one
      let thumbnailUrl = null
      if (thumbnailFile) {
        const thumbnailFileName = `${userId}/${Date.now()}-${thumbnailFile.name.replace(/\s+/g, "-")}`
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

      // Create video record in database
      const { data, error } = await supabase
        .from("videos")
        .insert({
          user_id: userId,
          title,
          description,
          video_url: videoUrl.publicUrl,
          thumbnail_url: thumbnailUrl,
          storage_path: videoFileName,
          is_uploaded: true,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Video uploaded successfully",
        description: "Your video has been uploaded and is now processing",
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

  return (
    <Tabs defaultValue="file" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="file">Upload File</TabsTrigger>
        <TabsTrigger value="url">Add from URL</TabsTrigger>
      </TabsList>

      <TabsContent value="file">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleUploadFile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description"
                  rows={4}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-file">Video File</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {videoFile ? "Change Video" : "Select Video"}
                  </Button>
                  {videoFile && (
                    <Button type="button" variant="ghost" size="icon" onClick={clearVideoFile} disabled={isUploading}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  ref={videoInputRef}
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                {videoFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {videoFile.name} ({Math.round(videoFile.size / 1024 / 1024)}MB)
                  </p>
                )}
                {videoPreview && (
                  <div className="mt-2 aspect-video bg-black rounded-md overflow-hidden">
                    <video src={videoPreview} controls className="w-full h-full" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail-file">Thumbnail (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {thumbnailFile ? "Change Thumbnail" : "Select Thumbnail"}
                  </Button>
                  {thumbnailFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={clearThumbnailFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  ref={thumbnailInputRef}
                  id="thumbnail-file"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                {thumbnailFile && <p className="text-sm text-muted-foreground">Selected: {thumbnailFile.name}</p>}
                {thumbnailPreview && (
                  <div className="mt-2 aspect-video bg-black rounded-md overflow-hidden">
                    <img
                      src={thumbnailPreview || "/placeholder.svg"}
                      alt="Thumbnail preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">{uploadProgress}%</p>
                </div>
              )}

              <Button type="submit" disabled={isUploading || !videoFile} className="w-full">
                {isUploading ? "Uploading..." : "Upload Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="url">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleUploadFromUrl} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title-url">Title</Label>
                <Input
                  id="title-url"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-url">Description</Label>
                <Textarea
                  id="description-url"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description"
                  rows={4}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="video-url"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setVideoUrl("")}
                    disabled={isUploading || !videoUrl}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail-url">Thumbnail URL (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="thumbnail-url"
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setThumbnailUrl("")}
                    disabled={isUploading || !thumbnailUrl}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isUploading || !videoUrl} className="w-full">
                {isUploading ? "Adding..." : "Add Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

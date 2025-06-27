"use client"

import { useState, useRef } from "react"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AvatarUploadProps {
  currentAvatarUrl?: string
  username?: string
  onAvatarChange: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, username, onAvatarChange }: AvatarUploadProps) {
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!user || !fileInputRef.current?.files?.[0]) return

    setIsUploading(true)
    setStorageError(null)

    try {
      const file = fileInputRef.current.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      console.log('=== AVATAR UPLOAD START ===')
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        fileName: fileName
      })
      console.log('User details:', {
        id: user.id,
        email: user.email
      })

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', session ? 'Valid' : 'None')

      // Skip bucket listing since we know it exists - try direct upload
      console.log('Attempting direct upload to avatars bucket...')
      
      // Upload to Supabase Storage directly
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        })

      console.log('Upload response:', { data, error })

      if (error) {
        console.error('Upload error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error
        })
        
        // Provide specific error messages
        if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          const errorMsg = 'Storage policies not configured. Please check the setup guide.'
          setStorageError(errorMsg)
          throw new Error(errorMsg)
        } else if (error.message.includes('bucket')) {
          const errorMsg = 'Storage bucket not found or not accessible.'
          setStorageError(errorMsg)
          throw new Error(errorMsg)
        } else if (error.message.includes('permission')) {
          const errorMsg = 'Permission denied. Please check your authentication and storage policies.'
          setStorageError(errorMsg)
          throw new Error(errorMsg)
        } else {
          setStorageError(error.message)
          throw new Error(error.message || 'Upload failed')
        }
      }

      // Get public URL
      console.log('Getting public URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Avatar uploaded successfully:', publicUrl)
      console.log('=== AVATAR UPLOAD COMPLETE ===')
      
      // Update the parent component
      onAvatarChange(publicUrl)
      
      // Clear preview
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      })

    } catch (error: any) {
      console.error('Avatar upload failed:', error)
      
      if (!storageError) {
        toast({
          title: "Error",
          description: error.message || "Failed to upload avatar",
          variant: "destructive",
        })
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setStorageError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col items-center gap-4">
      {storageError && (
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {storageError}
            <br />
            <a 
              href="/MANUAL_STORAGE_SETUP.md" 
              target="_blank" 
              className="underline hover:no-underline"
            >
              View setup guide
            </a>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || "/placeholder.svg"} alt={username} />
          <AvatarFallback>{username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        
        {previewUrl && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Image
        </Button>

        {previewUrl && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload Avatar"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
      </p>
    </div>
  )
} 
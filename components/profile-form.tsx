"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { AvatarUpload } from "./avatar-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Mail, MapPin, Calendar, Globe, Loader2, Save, X, Check } from "lucide-react"
import { z } from "zod"

// Validation schema
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  full_name: z.string().max(100, "Full name must be less than 100 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  avatar_url: z.string().url("Please enter a valid avatar URL").optional().or(z.literal("")),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface Profile {
  id: string
  username?: string
  full_name?: string
  bio?: string
  website?: string
  location?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface ProfileFormProps {
  profile: Profile | null
}

interface FormErrors {
  [key: string]: string
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { supabase, user, refreshProfile } = useSupabase()
  const { toast } = useToast()

  // Form state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  // Form data
  const [formData, setFormData] = useState<ProfileFormData>({
    username: profile?.username || "",
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    location: profile?.location || "",
    avatar_url: profile?.avatar_url || "",
  })

  // Initial form data for comparison
  const [initialData, setInitialData] = useState<ProfileFormData>(formData)

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      const newFormData = {
        username: profile.username || "",
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        website: profile.website || "",
        location: profile.location || "",
        avatar_url: profile.avatar_url || "",
      }
      setFormData(newFormData)
      setInitialData(newFormData)
    }
  }, [profile])

  // Check for changes
  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(initialData)
    setHasChanges(hasFormChanges)
  }, [formData, initialData])

  // Handle input changes
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    try {
      profileSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {}
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "No user found",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Prepare the update data
      const updateData = {
        id: user.id,
        username: formData.username.trim(),
        full_name: formData.full_name?.trim() || null,
        bio: formData.bio?.trim() || null,
        website: formData.website?.trim() || null,
        location: formData.location?.trim() || null,
        avatar_url: formData.avatar_url?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      // Use upsert to handle both insert and update
      const { data, error } = await supabase.from("profiles").upsert(updateData).select().single()

      if (error) {
        throw new Error(error.message || "Failed to update profile")
      }

      // Update initial data to reflect saved state
      setInitialData(formData)
      setHasChanges(false)

      // Refresh the profile state
      await refreshProfile()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      console.error("Profile update failed:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle avatar change
  const handleAvatarChange = (newAvatarUrl: string) => {
    handleInputChange("avatar_url", newAvatarUrl)
  }

  // Reset form
  const handleReset = () => {
    setFormData(initialData)
    setErrors({})
    setHasChanges(false)
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (formData.full_name) {
      return formData.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (formData.username) {
      return formData.username[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar_url || "/placeholder.svg"} alt={formData.username} />
              <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {formData.full_name || formData.username || "User"}
                {profile?.created_at && (
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Member since {new Date(profile.created_at).getFullYear()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </CardDescription>
              {formData.location && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {formData.location}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your profile information and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Profile Picture</Label>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <AvatarUpload
                    currentAvatarUrl={formData.avatar_url}
                    username={formData.username}
                    onAvatarChange={handleAvatarChange}
                  />
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar_url}
                      onChange={(e) => handleInputChange("avatar_url", e.target.value)}
                      className={errors.avatar_url ? "border-destructive" : ""}
                    />
                    {errors.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url}</p>}
                    <p className="text-xs text-muted-foreground">Enter a URL for your profile picture</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Basic Information</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    placeholder="Enter your username"
                    className={errors.username ? "border-destructive" : ""}
                    required
                  />
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                  <p className="text-xs text-muted-foreground">This will be your unique identifier</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter your full name"
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  className={`min-h-[100px] ${errors.bio ? "border-destructive" : ""}`}
                  maxLength={500}
                />
                {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Share a brief description about yourself</span>
                  <span>{formData.bio?.length || 0}/500</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className={`pl-10 ${errors.website ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, Country"
                      className={`pl-10 ${errors.location ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Unsaved changes
                  </Badge>
                )}
                {!hasChanges && formData.username && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    All changes saved
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {hasChanges && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset all changes? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button type="submit" disabled={isSaving || !hasChanges} className="min-w-[120px]">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

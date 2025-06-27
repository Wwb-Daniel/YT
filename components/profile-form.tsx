"use client"

import type React from "react"

import { useState } from "react"
import { useSupabase } from "./supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { AvatarUpload } from "./avatar-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProfileFormProps {
  profile: any
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { supabase, user, refreshProfile } = useSupabase()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState(profile?.username || "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")

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

    setIsLoading(true)

    try {
      console.log("User ID:", user.id)
      console.log("User email:", user.email)
      console.log("Updating profile:", { id: user.id, username, avatar_url: avatarUrl })
      
      // Check current session
      const { data: { session } } = await supabase.auth.getSession()
      console.log("Current session:", session)
      
      // Prepare the update data - only use fields that exist in the table
      const updateData = {
        id: user.id,
        username: username.trim(),
        avatar_url: avatarUrl.trim() || null
      }

      console.log("Update data:", updateData)

      // Use upsert to handle both insert and update
      const result = await supabase
        .from("profiles")
        .upsert(updateData)
        .select()
        .single()

      console.log("Update result:", result)

      if (result.error) {
        console.error("Profile update error:", result.error)
        throw new Error(result.error.message || "Failed to update profile")
      }

      console.log("Profile updated successfully:", result.data)

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
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
          <AvatarFallback>{username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-medium">{username || "User"}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            username={username}
            onAvatarChange={handleAvatarChange}
          />
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="avatar-url">Avatar URL</Label>
            <Input
              id="avatar-url"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Enter a URL for your profile picture</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}

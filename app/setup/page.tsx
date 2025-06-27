"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabase } from "@/lib/supabase-client"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const handleSetup = async () => {
    setIsLoading(true)
    try {
      const supabase = createClientSupabase()

      // Create profiles table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Create videos table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          video_url TEXT,
          thumbnail_url TEXT,
          youtube_id TEXT,
          channel_title TEXT,
          view_count INTEGER DEFAULT 0,
          is_uploaded BOOLEAN DEFAULT FALSE,
          storage_path TEXT,
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Create comments table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users ON DELETE CASCADE,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Create likes table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS likes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users ON DELETE CASCADE,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, video_id)
        );
      `)

      // Create video views table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS video_views (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users ON DELETE SET NULL,
          video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Create subscriptions table
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          subscriber_id UUID REFERENCES auth.users ON DELETE CASCADE,
          creator_id UUID REFERENCES auth.users ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(subscriber_id, creator_id)
        );
      `)

      // Set up RLS policies
      await supabase.query(`
        -- Enable RLS on all tables
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        -- Profiles: users can read all profiles, but only update their own
        CREATE POLICY "Public profiles are viewable by everyone" ON profiles
          FOR SELECT USING (true);

        CREATE POLICY "Users can update their own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);

        -- Videos: anyone can view videos, only owners can update/delete
        CREATE POLICY "Videos are viewable by everyone" ON videos
          FOR SELECT USING (true);

        CREATE POLICY "Users can insert their own videos" ON videos
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own videos" ON videos
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own videos" ON videos
          FOR DELETE USING (auth.uid() = user_id);

        -- Comments: anyone can view comments, only owners can update/delete
        CREATE POLICY "Comments are viewable by everyone" ON comments
          FOR SELECT USING (true);

        CREATE POLICY "Users can insert their own comments" ON comments
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own comments" ON comments
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own comments" ON comments
          FOR DELETE USING (auth.uid() = user_id);

        -- Likes: anyone can view likes, only owners can update/delete
        CREATE POLICY "Likes are viewable by everyone" ON likes
          FOR SELECT USING (true);

        CREATE POLICY "Users can insert their own likes" ON likes
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own likes" ON likes
          FOR DELETE USING (auth.uid() = user_id);

        -- Video views: anyone can view video views, only owners can update/delete
        CREATE POLICY "Video views are viewable by everyone" ON video_views
          FOR SELECT USING (true);

        CREATE POLICY "Anyone can insert video views" ON video_views
          FOR INSERT WITH CHECK (true);

        -- Subscriptions: anyone can view subscriptions, only owners can update/delete
        CREATE POLICY "Subscriptions are viewable by everyone" ON subscriptions
          FOR SELECT USING (true);

        CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
          FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

        CREATE POLICY "Users can delete their own subscriptions" ON subscriptions
          FOR DELETE USING (auth.uid() = subscriber_id);
      `)

      setIsComplete(true)
      toast({
        title: "Setup complete",
        description: "Database tables and policies have been created successfully.",
      })
    } catch (error) {
      console.error("Setup error:", error)
      toast({
        title: "Setup failed",
        description: "There was an error setting up the database. Please check the console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 flex items-center justify-center min-h-[calc(100vh-64px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>
            Set up the database tables and policies required for the YouTube clone application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">This will create the following tables:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>profiles</li>
            <li>videos</li>
            <li>comments</li>
            <li>likes</li>
            <li>video_views</li>
            <li>subscriptions</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            It will also set up the necessary Row Level Security (RLS) policies and triggers.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetup} disabled={isLoading || isComplete} className="w-full">
            {isLoading ? "Setting up..." : isComplete ? "Setup Complete" : "Run Setup"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

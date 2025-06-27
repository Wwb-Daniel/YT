import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { UserUploadedVideos } from "@/components/user-uploaded-videos"

export default async function MyVideosPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">My Videos</h1>
      <UserUploadedVideos userId={session.user.id} />
    </div>
  )
}

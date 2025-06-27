import { VideoGrid } from "@/components/video-grid"
import { Sidebar } from "@/components/sidebar"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Home() {
  return (
    <div className="flex">
      <Sidebar className="hidden md:block w-64 shrink-0" />
      <div className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Recommended Videos</h1>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-video rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
            </div>
          }
        >
          <VideoGrid />
        </Suspense>
      </div>
    </div>
  )
}

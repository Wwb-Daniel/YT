import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function VideoSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs Skeleton */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-muted rounded w-12 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1 animate-pulse" />
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Video Player and Info */}
          <div className="xl:col-span-3 space-y-6">
            {/* Video Player Skeleton */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
            </Card>

            {/* Video Info Skeleton */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
                    <div className="h-6 bg-muted rounded-full w-20 animate-pulse" />
                    <div className="h-6 bg-muted rounded-full w-12 animate-pulse" />
                  </div>

                  <Separator />

                  {/* Creator */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                    <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Skeleton */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-full animate-pulse" />
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Stats Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="h-5 bg-muted rounded w-24 animate-pulse mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <div className="space-y-4">
                <div className="h-5 bg-muted rounded w-32 animate-pulse" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-24 h-16 bg-muted rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

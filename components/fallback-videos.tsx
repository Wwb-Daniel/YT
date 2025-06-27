import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"

// Fallback videos to display when API calls fail
const fallbackVideos = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    channelTitle: "Rick Astley",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    publishedAt: "2009-10-25T06:57:33Z",
    viewCount: 1234567,
    isYoutubeVideo: true,
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE",
    channelTitle: "PSY",
    thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    publishedAt: "2012-07-15T07:46:32Z",
    viewCount: 4567890,
    isYoutubeVideo: true,
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    channelTitle: "Luis Fonsi",
    thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    publishedAt: "2017-01-12T15:00:21Z",
    viewCount: 7890123,
    isYoutubeVideo: true,
  },
  {
    id: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You",
    channelTitle: "Ed Sheeran",
    thumbnailUrl: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    publishedAt: "2017-01-30T05:00:01Z",
    viewCount: 5678901,
    isYoutubeVideo: true,
  },
  {
    id: "RgKAFK5djSk",
    title: "Wiz Khalifa - See You Again ft. Charlie Puth",
    channelTitle: "Wiz Khalifa",
    thumbnailUrl: "https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg",
    publishedAt: "2015-04-06T14:00:11Z",
    viewCount: 5432109,
    isYoutubeVideo: true,
  },
  {
    id: "OPf0YbXqDm0",
    title: "Mark Ronson - Uptown Funk ft. Bruno Mars",
    channelTitle: "Mark Ronson",
    thumbnailUrl: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
    publishedAt: "2014-11-19T14:00:01Z",
    viewCount: 4321098,
    isYoutubeVideo: true,
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Queen - Bohemian Rhapsody",
    channelTitle: "Queen Official",
    thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    publishedAt: "2008-08-01T11:06:40Z",
    viewCount: 1357924,
    isYoutubeVideo: true,
  },
  {
    id: "hT_nvWreIhg",
    title: "OneRepublic - Counting Stars",
    channelTitle: "OneRepublic",
    thumbnailUrl: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
    publishedAt: "2013-05-31T13:19:33Z",
    viewCount: 3579246,
    isYoutubeVideo: true,
  },
]

export function FallbackVideos() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {fallbackVideos.map((video) => (
        <Link key={video.id} href={`/watch/${video.id}`} className="group">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={video.thumbnailUrl || "/placeholder.svg"}
              alt={video.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <div className="mt-2">
            <h3 className="font-medium line-clamp-2">{video.title}</h3>
            <p className="text-sm text-muted-foreground">{video.channelTitle}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{video.viewCount ? `${video.viewCount.toLocaleString()} views` : "No views"}</span>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

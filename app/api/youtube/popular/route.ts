import { NextResponse } from "next/server"

// YouTube API key
const API_KEY = "AIzaSyAmau-y2nqiKErgM4UClQA5R9TzMrxfL7w"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const maxResults = searchParams.get("maxResults") || "20"
  const regionCode = searchParams.get("regionCode") || "US"
  const pageToken = searchParams.get("pageToken") || ""

  try {
    // Build the YouTube API URL
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=${maxResults}&regionCode=${regionCode}&key=${API_KEY}`

    if (pageToken) {
      url += `&pageToken=${pageToken}`
    }

    // Make the request to YouTube API
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from YouTube API:", error)

    // Return fallback data in case of error
    return NextResponse.json({
      items: getFallbackPopularVideos(),
      fallback: true,
      error: "Using fallback data (API error)",
    })
  }
}

// Fallback function with a few videos in case the API fails
function getFallbackPopularVideos() {
  return [
    {
      id: "dQw4w9WgXcQ",
      snippet: {
        title: "Rick Astley - Never Gonna Give You Up",
        channelTitle: "Rick Astley",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          },
        },
        publishedAt: "2009-10-25T06:57:33Z",
      },
      statistics: {
        viewCount: "1234567890",
      },
    },
    {
      id: "9bZkp7q19f0",
      snippet: {
        title: "PSY - GANGNAM STYLE",
        channelTitle: "PSY",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
          },
        },
        publishedAt: "2012-07-15T07:46:32Z",
      },
      statistics: {
        viewCount: "4567890123",
      },
    },
    {
      id: "kJQP7kiw5Fk",
      snippet: {
        title: "Luis Fonsi - Despacito ft. Daddy Yankee",
        channelTitle: "Luis Fonsi",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
          },
        },
        publishedAt: "2017-01-12T15:00:21Z",
      },
      statistics: {
        viewCount: "7890123456",
      },
    },
  ]
}

// Create a new file for getting related videos
import { NextResponse } from "next/server"

// YouTube API key
const API_KEY = "AIzaSyAmau-y2nqiKErgM4UClQA5R9TzMrxfL7w"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("videoId")
  const maxResults = searchParams.get("maxResults") || "10"

  if (!videoId) {
    return NextResponse.json({ error: "Parameter 'videoId' is required" }, { status: 400 })
  }

  try {
    // Build the YouTube API URL
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=${maxResults}&key=${API_KEY}`

    // Make the request to YouTube API
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching related videos:", error)

    // Return error response
    return NextResponse.json(
      {
        items: [],
        error: "Error fetching related videos",
      },
      { status: 500 },
    )
  }
}

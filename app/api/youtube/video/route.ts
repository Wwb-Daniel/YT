// Create a new file for getting video details
import { NextResponse } from "next/server"

// YouTube API key
const API_KEY = "AIzaSyAmau-y2nqiKErgM4UClQA5R9TzMrxfL7w"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("id")

  if (!videoId) {
    return NextResponse.json({ error: "Parameter 'id' is required" }, { status: 400 })
  }

  try {
    // Build the YouTube API URL
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`

    // Make the request to YouTube API
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.items && data.items.length > 0) {
      return NextResponse.json(data.items[0])
    } else {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching video details:", error)

    // Return error response
    return NextResponse.json(
      {
        error: "Error fetching video details",
      },
      { status: 500 },
    )
  }
}

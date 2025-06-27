// Create a new file for YouTube search API
import { NextResponse } from "next/server"

// YouTube API key
const API_KEY = "AIzaSyAmau-y2nqiKErgM4UClQA5R9TzMrxfL7w"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const maxResults = searchParams.get("maxResults") || "20"
  const regionCode = searchParams.get("regionCode") || "US"
  const pageToken = searchParams.get("pageToken") || ""

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    // Build the YouTube API URL
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&regionCode=${regionCode}&key=${API_KEY}`

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
    console.error("Error searching YouTube:", error)

    // Return empty results in case of error
    return NextResponse.json({
      items: [],
      fallback: true,
      error: "Error searching videos",
    })
  }
}

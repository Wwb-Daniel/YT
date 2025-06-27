// Replace the entire file with this updated version that uses the real YouTube API

// YouTube API key
const API_KEY = typeof process !== 'undefined' && process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY : "AIzaSyAmau-y2nqiKErgM4UClQA5R9TzMrxfL7w"
const BASE_URL = "https://www.googleapis.com/youtube/v3"

// Function to get popular videos with pagination
export async function getPopularVideos(maxResults = 20, regionCode?: string, page = 1) {
  console.log(`Getting popular videos: page ${page}, region ${regionCode}, max ${maxResults}`)

  try {
    const pageToken = page > 1 ? `&pageToken=${await getPageToken(page)}` : ""
    const regionParam = regionCode ? `&regionCode=${regionCode}` : ""

    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&maxResults=${maxResults}${regionParam}${pageToken}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Returning ${data.items.length} videos for page ${page}`)

    // Store the next page token if available
    if (data.nextPageToken) {
      storePageToken(page + 1, data.nextPageToken)
    }

    return data.items
  } catch (error) {
    console.error("Error fetching popular videos:", error)
    // Fall back to cached data or fallback videos
    return getFallbackPopularVideos()
  }
}

// Function to search videos
export async function searchVideos(query: string, maxResults = 20, regionCode?: string, page = 1) {
  console.log(`Searching videos: "${query}", page ${page}, region ${regionCode}, max ${maxResults}`)

  try {
    const pageToken = page > 1 ? `&pageToken=${await getPageToken(page, query)}` : ""
    const regionParam = regionCode ? `&regionCode=${regionCode}` : ""

    const response = await fetch(
      `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}${regionParam}${pageToken}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Found ${data.items.length} videos matching "${query}", returning for page ${page}`)

    // Store the next page token if available
    if (data.nextPageToken) {
      storePageToken(page + 1, data.nextPageToken, query)
    }

    return data.items
  } catch (error) {
    console.error("Error searching videos:", error)
    // Fall back to searching in fallback data
    return searchFallbackVideos(query, maxResults)
  }
}

// Function to get video details
export async function getVideoDetails(videoId: string) {
  console.log(`Getting video details: ${videoId}`)

  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.items && data.items.length > 0) {
      console.log(`Video found: ${data.items[0].snippet.title}`)
      return data.items[0]
    }

    throw new Error("Video not found")
  } catch (error) {
    console.error("Error fetching video details:", error)
    // Try to find the video in fallback data
    return getFallbackVideoDetails(videoId)
  }
}

// Function to get related videos
export async function getRelatedVideos(videoId: string, maxResults = 10) {
  if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
    console.error('Invalid videoId for getRelatedVideos:', videoId);
    return [];
  }
  console.log(`Getting related videos for:`, { videoId, maxResults, apiKey: API_KEY })

  try {
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=${maxResults}&key=${API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('YouTube API error body:', errorBody)
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Returning ${data.items.length} related videos`)

    return data.items
  } catch (error) {
    console.error("Error fetching related videos:", error)
    // Fall back to finding related videos in fallback data
    return getFallbackRelatedVideos(videoId, maxResults)
  }
}

// Helper functions for pagination
// In a real app, these would use a database or Redis
// Here we're using a simple in-memory cache
const pageTokens: Record<string, string> = {}

function storePageToken(page: number, token: string, query?: string) {
  const key = query ? `${query}_${page}` : `popular_${page}`
  pageTokens[key] = token
}

async function getPageToken(page: number, query?: string): Promise<string> {
  const key = query ? `${query}_${page}` : `popular_${page}`
  return pageTokens[key] || ""
}

// Fallback functions in case the API fails
function getFallbackPopularVideos() {
  return getAllFallbackVideos().slice(0, 20)
}

function searchFallbackVideos(query: string, maxResults = 20) {
  const lowerCaseQuery = query.toLowerCase()

  const matchingVideos = getAllFallbackVideos().filter(
    (video) =>
      video.snippet.title.toLowerCase().includes(lowerCaseQuery) ||
      video.snippet.channelTitle.toLowerCase().includes(lowerCaseQuery),
  )

  return matchingVideos.slice(0, maxResults).map((video) => ({
    id: { videoId: video.id },
    snippet: video.snippet,
  }))
}

function getFallbackVideoDetails(videoId: string) {
  const video = getAllFallbackVideos().find((v) => v.id === videoId)

  if (video) {
    return video
  }

  return {
    id: videoId,
    snippet: {
      title: "Video not found",
      channelTitle: "Unknown channel",
      description: "This video is not available in our fallback data.",
      publishedAt: new Date().toISOString(),
      thumbnails: {
        high: {
          url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        },
      },
    },
    statistics: {
      viewCount: "1000",
      likeCount: "50",
    },
  }
}

function getFallbackRelatedVideos(videoId: string, maxResults = 10) {
  return getAllFallbackVideos()
    .filter((v) => v.id !== videoId)
    .slice(0, maxResults)
    .map((video) => ({
      id: { videoId: video.id },
      snippet: video.snippet,
    }))
}

// Fallback videos database
function getAllFallbackVideos() {
  return [
    {
      id: "dQw4w9WgXcQ",
      snippet: {
        title: "Rick Astley - Never Gonna Give You Up",
        channelTitle: "Rick Astley",
        description: 'The official video for "Never Gonna Give You Up" by Rick Astley',
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          },
        },
        publishedAt: "2009-10-25T06:57:33Z",
      },
      statistics: {
        viewCount: "1234567890",
        likeCount: "12345678",
      },
    },
    {
      id: "9bZkp7q19f0",
      snippet: {
        title: "PSY - GANGNAM STYLE",
        channelTitle: "PSY",
        description: "Official music video for PSY - GANGNAM STYLE",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
          },
        },
        publishedAt: "2012-07-15T07:46:32Z",
      },
      statistics: {
        viewCount: "4567890123",
        likeCount: "45678901",
      },
    },
    // Keeping a few fallback videos for emergency cases
    {
      id: "kJQP7kiw5Fk",
      snippet: {
        title: "Luis Fonsi - Despacito ft. Daddy Yankee",
        channelTitle: "Luis Fonsi",
        description: "Official music video for Luis Fonsi - Despacito ft. Daddy Yankee",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
          },
        },
        publishedAt: "2017-01-12T15:00:21Z",
      },
      statistics: {
        viewCount: "7890123456",
        likeCount: "78901234",
      },
    },
    {
      id: "JGwWNGJdvx8",
      snippet: {
        title: "Ed Sheeran - Shape of You",
        channelTitle: "Ed Sheeran",
        description: "The official music video for Ed Sheeran - Shape Of You",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
          },
        },
        publishedAt: "2017-01-30T05:00:01Z",
      },
      statistics: {
        viewCount: "5678901234",
        likeCount: "56789012",
      },
    },
    {
      id: "RgKAFK5djSk",
      snippet: {
        title: "Wiz Khalifa - See You Again ft. Charlie Puth",
        channelTitle: "Wiz Khalifa",
        description: "The official music video for Wiz Khalifa - See You Again ft. Charlie Puth",
        thumbnails: {
          high: {
            url: "https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg",
          },
        },
        publishedAt: "2015-04-06T14:00:11Z",
      },
      statistics: {
        viewCount: "5432109876",
        likeCount: "54321098",
      },
    },
  ]
}
export interface ImageItem {
  id: number
  url: string
  thumbnailUrl: string
  width: number
  height: number
  title: string
  category: string
  likes: number
  author: string
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
}

export interface ImagesResponse {
  success: boolean
  data: {
    items: ImageItem[]
    pagination: PaginationInfo
  }
  timestamp: string
}

const API_BASE_URL = 'http://localhost:3001'

let abortControllers: Map<string, AbortController> = new Map()

export const cancelAllRequests = () => {
  abortControllers.forEach(controller => controller.abort())
  abortControllers.clear()
}

export const getImages = async (
  page: number = 1,
  pageSize: number = 10,
  category?: string
): Promise<ImagesResponse> => {
  const requestKey = `images-${page}-${pageSize}-${category || 'all'}`
  
  if (abortControllers.has(requestKey)) {
    abortControllers.get(requestKey)?.abort()
  }
  
  const controller = new AbortController()
  abortControllers.set(requestKey, controller)
  
  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    })
    
    if (category) {
      params.append('category', category)
    }
    
    const response = await fetch(`${API_BASE_URL}/api/images?${params.toString()}`, {
      signal: controller.signal
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch images')
    }
    
    return data
  } finally {
    abortControllers.delete(requestKey)
  }
}

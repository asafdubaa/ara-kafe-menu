import { Redis } from "@upstash/redis"

interface MenuItem {
  name_en: string
  description_en: string
  ingredients_en?: string
  name_tr: string
  description_tr: string
  ingredients_tr?: string
  price: string
}

export interface MenuData {
  [category: string]: MenuItem[]
}

export interface CategoryTitlesMap {
  [category: string]: { en: string; tr: string }
}

// Check if Upstash Redis environment variables are available
const hasRedisConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

let redis: Redis | null = null

// Log Redis configuration status
const redisConfigStatus = {
  hasConfig: hasRedisConfig,
  url: process.env.KV_REST_API_URL ? 'Set' : 'Not set',
  token: process.env.KV_REST_API_TOKEN ? 'Set' : 'Not set'
}
console.log('Redis Config Check:', redisConfigStatus)

// Initialize Redis if config is available
if (hasRedisConfig) {
  try {
    console.log('Initializing Redis client...')
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
    console.log('Redis client initialized successfully')
  } catch (error) {
    console.error("Redis initialization failed:", error)
  }
} else {
  console.warn('Redis configuration is incomplete. Falling back to localStorage.')
}

const MENU_KEY = "ara-kafe-menu-data"
const MENU_TITLES_KEY = "ara-kafe-menu-titles"

export const getMenuData = async (): Promise<MenuData> => {
  // Try Redis first if available
  if (redis) {
    try {
      const data = await redis.get<MenuData>(MENU_KEY)
      if (data) {
        console.log("Menu data loaded from Redis")
        return data
      }
    } catch (error) {
      console.error("Redis fetch failed, falling back to default data:", error)
    }
  }

  // Fallback to localStorage in browser or default JSON
  if (typeof window !== "undefined") {
    const savedData = localStorage.getItem("araKafeMenuData")
    if (savedData) {
      try {
        console.log("Menu data loaded from localStorage")
        return JSON.parse(savedData) as MenuData
      } catch (error) {
        console.error("Error parsing localStorage data:", error)
      }
    }
  }

  // Final fallback to default menu data
  console.log("Menu data loaded from default JSON")
  const defaultData = await import("@/data/menu-data.json")
  return defaultData.default as MenuData
}

export const saveMenuData = async (menuData: MenuData) => {
  let redisSaved = false
  let error: string | null = null

  // Try to save to Redis if available
  if (redis) {
    try {
      await redis.set(MENU_KEY, menuData)
      redisSaved = true
      console.log("Menu data saved to Redis")
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error saving to Redis'
      console.error("Redis save failed:", error)
    }
  }

  // Always save to localStorage as backup
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("araKafeMenuData", JSON.stringify(menuData))
      console.log("Menu data saved to localStorage")
    } catch (err) {
      const localStorageError = err instanceof Error ? err.message : 'Unknown error saving to localStorage'
      console.error("Error saving to localStorage:", localStorageError)
      error = error ? `${error}. Also, ${localStorageError}` : localStorageError
    }
  }

  // Additionally, try to persist to data/menu-data.json when running on the server (useful in dev/self-hosted)
  if (typeof window === "undefined") {
    try {
      const { writeFile } = await import('fs/promises')
      const pathModule = await import('path')
      const filePath = pathModule.join(process.cwd(), 'data', 'menu-data.json')
      await writeFile(filePath, JSON.stringify(menuData, null, 2), 'utf8')
      console.log('Menu data saved to data/menu-data.json')
    } catch (fsErr) {
      const fsError = fsErr instanceof Error ? fsErr.message : 'Unknown error writing JSON file'
      console.warn('Failed to write data/menu-data.json (likely read-only runtime):', fsError)
      // Do not override existing error unless none exists
      if (!error) error = fsError
    }
  }

  const storageLocation = redisSaved ? "Redis" : "localStorage"
  let message = ''
  
  if (error) {
    message = `Warning: ${error}. Changes may not be saved properly.`
  } else if (redisSaved) {
    message = '✅ Successfully saved to Redis! Changes are now live for all users!'
  } else {
    message = '⚠️ Saved to localStorage only. Redis is not configured.'
  }
  
  return {
    success: !error,
    storage: storageLocation,
    storageLocation: storageLocation,
    message: message,
    error: error || undefined
  }
}

export const getCategoryTitles = async (): Promise<CategoryTitlesMap> => {
  // Try Redis first
  if (redis) {
    try {
      const data = await redis.get<CategoryTitlesMap>(MENU_TITLES_KEY)
      if (data) {
        return data
      }
    } catch (error) {
      console.error("Redis fetch for titles failed:", error)
    }
  }

  // Try to load from file system as default
  try {
    const defaultTitles = await import("@/data/category-titles.json")
    return defaultTitles.default as CategoryTitlesMap
  } catch (e) {
    console.warn('No default category-titles.json found, returning empty titles map')
    return {}
  }
}

export const saveCategoryTitles = async (titles: CategoryTitlesMap) => {
  let error: string | null = null

  // Save to Redis if available
  if (redis) {
    try {
      await redis.set(MENU_TITLES_KEY, titles)
      console.log("Category titles saved to Redis")
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error saving titles to Redis'
      console.error("Redis save for titles failed:", error)
    }
  }

  // Persist to file on server
  if (typeof window === "undefined") {
    try {
      const { writeFile } = await import('fs/promises')
      const pathModule = await import('path')
      const filePath = pathModule.join(process.cwd(), 'data', 'category-titles.json')
      await writeFile(filePath, JSON.stringify(titles, null, 2), 'utf8')
      console.log('Category titles saved to data/category-titles.json')
    } catch (fsErr) {
      const fsError = fsErr instanceof Error ? fsErr.message : 'Unknown error writing titles JSON file'
      console.warn('Failed to write data/category-titles.json:', fsError)
      if (!error) error = fsError
    }
  }

  return {
    success: !error,
    message: error ? `Warning: ${error}` : 'Titles saved successfully'
  }
}

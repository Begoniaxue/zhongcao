import type { Movie } from '../types/movie'

const FAVORITES_KEY = 'movie_favorites'
const HISTORY_KEY = 'movie_history'
const MAX_HISTORY_ITEMS = 50

export interface HistoryItem extends Movie {
  browseTime: number
}

export function getFavorites(): Movie[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addFavorite(movie: Movie): void {
  const favorites = getFavorites()
  const exists = favorites.some(m => m.id === movie.id)
  if (!exists) {
    favorites.unshift(movie)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }
}

export function removeFavorite(movieId: string): void {
  const favorites = getFavorites()
  const filtered = favorites.filter(m => m.id !== movieId)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered))
}

export function isFavorite(movieId: string): boolean {
  const favorites = getFavorites()
  return favorites.some(m => m.id === movieId)
}

export function clearAllFavorites(): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([]))
}

export function toggleFavorite(movie: Movie): boolean {
  if (isFavorite(movie.id)) {
    removeFavorite(movie.id)
    return false
  } else {
    addFavorite(movie)
    return true
  }
}

export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addHistory(movie: Movie): void {
  const history = getHistory()
  const filtered = history.filter(m => m.id !== movie.id)
  const historyItem: HistoryItem = {
    ...movie,
    browseTime: Date.now()
  }
  filtered.unshift(historyItem)
  if (filtered.length > MAX_HISTORY_ITEMS) {
    filtered.splice(MAX_HISTORY_ITEMS)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
}

export function removeHistory(movieId: string): void {
  const history = getHistory()
  const filtered = history.filter(m => m.id !== movieId)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
}

export function clearAllHistory(): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]))
}

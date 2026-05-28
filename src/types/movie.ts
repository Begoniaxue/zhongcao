export interface Movie {
  id: string
  title: string
  year: string
  type: string
  poster: string
  rating?: string
  released?: string
  runtime?: string
  genre?: string
  director?: string
  writer?: string
  actors?: string
  plot?: string
  language?: string
  country?: string
  awards?: string
  imdbRating?: string
  imdbVotes?: string
}

export interface SearchResult {
  Search: Movie[]
  totalResults: string
  Response: string
}

export interface MovieDetail extends Movie {
  Rated?: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  imdbRating: string
  imdbVotes: string
}

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
  status?: 'showing' | 'coming'
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

export interface Cinema {
  id: string
  name: string
  address: string
  phone: string
  businessHours: string
  distance: number
  popularity: number
  minPrice: number
  hallTypes: ('IMAX' | 'Dolby' | 'Normal')[]
}

export interface Showtime {
  id: string
  cinemaId: string
  cinemaName: string
  date: string
  startTime: string
  endTime: string
  hallName: string
  hallType: 'IMAX' | 'Dolby' | 'Normal'
  remainingSeats: number
  price: number
}

export interface FilterOptions {
  genre: string
  yearRange: string
  minRating: string
  category: string
}

export type SeatStatus = 'available' | 'sold' | 'selected' | 'locked' | 'corner'

export interface Seat {
  id: string
  row: number
  col: number
  status: SeatStatus
  isCouple?: boolean
  price: number
}

export interface Hall {
  id: string
  name: string
  type: 'IMAX' | 'Dolby' | 'Normal'
  rows: number
  cols: number
  seats: Seat[][]
}

export interface SelectedSeat {
  id: string
  row: number
  col: number
  seatLabel: string
  price: number
}

export interface SeatLockInfo {
  locked: boolean
  lockedAt: number
  expireAt: number
  duration: number
}

export interface MovieOrder {
  id: string
  movieId: string
  movieTitle: string
  moviePoster: string
  cinemaId: string
  cinemaName: string
  hallId: string
  hallName: string
  showtimeId: string
  showDate: string
  startTime: string
  endTime: string
  seats: SelectedSeat[]
  totalPrice: number
  serviceFee: number
  finalPrice: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  createdAt: number
  expireAt: number
}

export interface PriceDetail {
  ticketPrice: number
  ticketCount: number
  serviceFee: number
  totalPrice: number
}

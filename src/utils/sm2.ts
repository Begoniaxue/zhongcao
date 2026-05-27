export interface SchedulingData {
  interval: number
  repetition: number
  easinessFactor: number
  dueDate: string
}

export enum Rating {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3
}

export const RATING_LABELS: Record<Rating, { label: string; icon: string; desc: string }> = {
  [Rating.AGAIN]: { label: '生疏', icon: '😵', desc: '完全忘了' },
  [Rating.HARD]: { label: '困难', icon: '🤔', desc: '勉强记得' },
  [Rating.GOOD]: { label: '熟悉', icon: '😊', desc: '轻松记住' },
  [Rating.EASY]: { label: '简单', icon: '🤩', desc: '太简单了' }
}

export function createInitialScheduling(): SchedulingData {
  return {
    interval: 0,
    repetition: 0,
    easinessFactor: 2.5,
    dueDate: formatDate(new Date())
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function calculateNextReview(
  current: SchedulingData,
  rating: Rating
): SchedulingData {
  let { interval, repetition, easinessFactor } = current

  const quality = rating + 1

  if (quality < 2) {
    repetition = 0
    interval = 1
  } else {
    if (repetition === 0) {
      interval = 1
    } else if (repetition === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetition++
  }

  easinessFactor = easinessFactor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02))
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3
  }

  const dueDate = formatDate(addDays(new Date(), interval))

  return {
    interval,
    repetition,
    easinessFactor: Number(easinessFactor.toFixed(2)),
    dueDate
  }
}

export function isDueToday(dueDate: string): boolean {
  const today = formatDate(new Date())
  return dueDate <= today
}

export function getIntervalDescription(interval: number): string {
  if (interval === 0) return '今天'
  if (interval === 1) return '明天'
  if (interval < 7) return `${interval}天后`
  if (interval < 30) return `${Math.round(interval / 7)}周后`
  if (interval < 365) return `${Math.round(interval / 30)}个月后`
  return `${Math.round(interval / 365)}年后`
}

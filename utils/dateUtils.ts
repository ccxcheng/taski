import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, isSameWeek, isToday } from 'date-fns'

export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday start
}

export const getWeekEnd = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 }) // Monday start
}

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date)
  }
}

export const formatWeekRange = (date: Date): string => {
  const { start, end } = getWeekRange(date)
  const startFormatted = format(start, 'MMMM d')
  const endFormatted = format(end, 'MMMM d, yyyy')
  return `${startFormatted} - ${endFormatted}`
}

export const getNextWeek = (date: Date): Date => {
  return addWeeks(date, 1)
}

export const getPreviousWeek = (date: Date): Date => {
  return subWeeks(date, 1)
}

export const isCurrentWeek = (date: Date): boolean => {
  return isSameWeek(date, new Date(), { weekStartsOn: 1 })
}

export const isTodayInWeek = (date: Date): boolean => {
  const { start, end } = getWeekRange(date)
  return isToday(date) || (date >= start && date <= end && isToday(new Date()))
}

export const getWeekKey = (date: Date): string => {
  return format(getWeekStart(date), 'yyyy-MM-dd')
} 
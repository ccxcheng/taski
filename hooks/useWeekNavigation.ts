import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { getWeekKey, getNextWeek, getPreviousWeek, isCurrentWeek } from '@/utils/dateUtils'
import { getWeekData, saveWeekData, createDefaultWeekData, migrateExistingData, WeekData } from '@/utils/storageUtils'

export const useWeekNavigation = () => {
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date())
  // Start null so server and client agree on the first render (no hydration
  // mismatch). useLayoutEffect below hydrates from localStorage before the
  // browser paints so there is still no visible flash of empty state.
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentWeekKey = getWeekKey(currentWeekDate)

  const loadWeekData = useCallback((weekDate: Date) => {
    const weekKey = getWeekKey(weekDate)
    let data = getWeekData(weekKey)

    if (!data) {
      data = createDefaultWeekData(weekKey)
      saveWeekData(weekKey, data)
    }

    setWeekData(data)
  }, [])

  const saveCurrentWeekData = useCallback((data: WeekData) => {
    saveWeekData(currentWeekKey, data)
    setWeekData(data)
  }, [currentWeekKey])

  const navigateToWeek = useCallback((weekDate: Date) => {
    setCurrentWeekDate(weekDate)
  }, [])

  const goToNextWeek = useCallback(() => {
    const nextWeek = getNextWeek(currentWeekDate)
    navigateToWeek(nextWeek)
  }, [currentWeekDate, navigateToWeek])

  const goToPreviousWeek = useCallback(() => {
    const prevWeek = getPreviousWeek(currentWeekDate)
    navigateToWeek(prevWeek)
  }, [currentWeekDate, navigateToWeek])

  const goToCurrentWeek = useCallback(() => {
    navigateToWeek(new Date())
  }, [navigateToWeek])

  const goToSpecificWeek = useCallback((date: Date) => {
    navigateToWeek(date)
  }, [navigateToWeek])

  // Hydrate from localStorage synchronously before the browser paints.
  // useLayoutEffect is client-only so it never runs during SSR, which is
  // exactly what we want — server and client both start with null, then the
  // client fills in local data before showing anything.
  useLayoutEffect(() => {
    migrateExistingData()
    const weekKey = getWeekKey(new Date())
    const data = getWeekData(weekKey) ?? createDefaultWeekData(weekKey)
    setWeekData(data)
  }, [])

  // Reload week data when the user navigates to a different week.
  // Skips the very first render since weekData is already hydrated above.
  const isFirstWeekChangeRef = useRef(true)
  useEffect(() => {
    if (isFirstWeekChangeRef.current) {
      isFirstWeekChangeRef.current = false
      return
    }
    loadWeekData(currentWeekDate)
  }, [currentWeekDate, loadWeekData])

  return {
    currentWeekDate,
    currentWeekKey,
    weekData,
    isLoading,
    isCurrentWeek: isCurrentWeek(currentWeekDate),
    saveCurrentWeekData,
    goToNextWeek,
    goToPreviousWeek,
    goToCurrentWeek,
    goToSpecificWeek,
  }
} 
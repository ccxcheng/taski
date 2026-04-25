import { useState, useEffect, useCallback } from 'react'
import { getWeekKey, getNextWeek, getPreviousWeek, isCurrentWeek } from '@/utils/dateUtils'
import { getWeekData, saveWeekData, createDefaultWeekData, migrateExistingData, WeekData } from '@/utils/storageUtils'

export const useWeekNavigation = () => {
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date())
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentWeekKey = getWeekKey(currentWeekDate)

  const loadWeekData = useCallback(async (weekDate: Date) => {
    const weekKey = getWeekKey(weekDate)
    let data = getWeekData(weekKey)
    
    if (!data) {
      // Create default data for this week
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

  // Initialize and migrate data on first load
  useEffect(() => {
    migrateExistingData()
    setIsLoading(false)
  }, [])

  // Load week data when week changes
  useEffect(() => {
    if (!isLoading) {
      loadWeekData(currentWeekDate)
    }
  }, [currentWeekDate, loadWeekData, isLoading])

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
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, getDay, subDays, addDays } from 'date-fns'
import { getWeekStart, isCurrentWeek } from '@/utils/dateUtils'
import { getAllWeekData } from '@/utils/storageUtils'
import { HabitAnalytics } from './HabitAnalytics'
import { useSounds } from '@/hooks/useSounds'

interface CalendarPickerProps {
  currentWeekDate: Date
  onWeekSelect: (date: Date) => void
  onGoToCurrentWeek: () => void
  isOpen: boolean
  onClose: () => void
  habits?: Array<{
    id: string
    name: string
    completed: ("completed" | "skipped" | false)[]
  }>
}

export const CalendarPicker = ({ currentWeekDate, onWeekSelect, onGoToCurrentWeek, isOpen, onClose, habits }: CalendarPickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(currentWeekDate))
  const [activeTab, setActiveTab] = useState<'calendar' | 'heatmap'>('calendar')
  const { playButton, playClose } = useSounds()
  const today = useMemo(() => new Date(), [])

  // Update month view when calendar opens or current week changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(startOfMonth(currentWeekDate))
    }
  }, [isOpen, currentWeekDate])

  // Memoize calendar days calculation - only recalculate when month changes
  const days = useMemo(() => {
    // Get the first Monday of the calendar view (may be in previous month)
    const monthStart = startOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    
    // Get the last Sunday of the calendar view (may be in next month)
    const monthEnd = endOfMonth(currentMonth)
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Sunday
    
    // Generate all days for the calendar grid (full weeks)
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  const handleDayClick = useCallback((day: Date) => {
    const weekStart = getWeekStart(day)
    onWeekSelect(weekStart)
    onClose()
  }, [onWeekSelect, onClose])

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }, [currentMonth])

  // Memoized heatmap calculation - only recalculates when activeTab or habits change
  const heatmapData = useMemo(() => {
    // Only calculate when heatmap tab is active
    if (activeTab !== 'heatmap' || !habits || habits.length === 0) return []
    
    const data = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 365) // Last 365 days
    
    // Get all stored week data
    const allWeekData = getAllWeekData()
    
    // Fixed: create new Date object for each iteration
    for (let i = 0; i <= 365; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      if (currentDate > today) break
      
      // Convert day of week: getDay() returns 0 (Sun) - 6 (Sat), we need 0 (Mon) - 6 (Sun)
      const jsDayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const mondayBasedDayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1 // 0 = Monday, 6 = Sunday
      
      // Find the week that contains this date
      const weekStart = getWeekStart(currentDate)
      const weekKey = weekStart.toISOString().split('T')[0]
      const weekData = allWeekData[weekKey]
      
      let completedCount = 0
      let totalCount = 0
      
      if (weekData && weekData.habits) {
        // Calculate completion for this specific day using Monday-based indexing
        weekData.habits.forEach(habit => {
          if (habit.completed && habit.completed[mondayBasedDayOfWeek] === "completed") {
            completedCount++
          }
          totalCount++
        })
      }
      
      const completionRate = totalCount > 0 ? completedCount / totalCount : 0
      
      data.push({
        date: new Date(currentDate),
        count: Math.round(completionRate * 100),
        level: completionRate === 0 ? 0 : 
               completionRate < 0.25 ? 1 :
               completionRate < 0.5 ? 2 :
               completionRate < 0.75 ? 3 : 4
      })
    }
    
    return data
  }, [activeTab, habits]) // Only recalculate when these change

    return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[99999]"
            onClick={() => { playClose(); onClose() }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl pointer-events-auto z-[99999] relative overflow-hidden"
              style={{ 
                width: activeTab === 'calendar' ? '380px' : '700px',
                maxWidth: '90vw'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'calendar' && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  >
                    {/* Blue header bar with Month Navigation */}
                    <div className="px-5 py-4 rounded-t-2xl" style={{ backgroundColor: '#0b268c' }}>
                      <div className="flex items-center justify-between">
                        {/* Left side: Month navigation */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { playButton(); goToPreviousMonth() }}
                            className="h-7 w-7 p-0"
                            style={{ color: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <ChevronLeft className="h-4 w-4 text-white" />
                          </Button>
                          <h4 className="text-base font-medium text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { playButton(); goToNextMonth() }}
                            className="h-7 w-7 p-0"
                            style={{ color: 'white' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <ChevronRight className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                        
                        {/* Right side: Sprout icon */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { playButton(); setActiveTab('heatmap') }}
                          className="h-8 w-8 p-0"
                          style={{ color: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Sprout className="h-5 w-5 text-white" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Calendar content */}
                    <div className="px-5 pb-5 pt-4">

              {/* Calendar Grid */}
              <div className="space-y-3">
                                 {/* Day Headers */}
                 <div className="grid grid-cols-7 gap-1.5">
                   {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                     // index is already Monday-based (Mon=0 ... Sun=6)
                     const todayJs = today.getDay() // 0=Sun ... 6=Sat
                     const todayMondayBasedIndex = todayJs === 0 ? 6 : todayJs - 1
                     const isTodayColumn = index === todayMondayBasedIndex

                     return (
                     <div key={day} className="text-center">
                       <div className={`text-xs font-medium uppercase tracking-wide ${
                         isTodayColumn
                           ? 'text-[#0b268c] font-semibold'
                           : index >= 5 ? 'text-gray-400' : 'text-gray-500'
                       }`}>
                         {day}
                       </div>
                     </div>
                     )
                   })}
                 </div>

                                 {/* Calendar Days */}
                 <div className="grid grid-cols-7 gap-1.5">
                  {days.map((day) => {
                    const dayWeekStart = getWeekStart(day)
                    const selectedWeekStart = getWeekStart(currentWeekDate)
                    const todayWeekStart = getWeekStart(today)
                    
                    // Check if this day is in the selected week (week being viewed in app)
                    const isInSelectedWeek = isSameDay(dayWeekStart, selectedWeekStart)
                    // Check if this day is in the current week (week containing today)
                    const isInCurrentWeek = isSameDay(dayWeekStart, todayWeekStart)
                    const isTodayDate = isToday(day)
                    const isInCurrentMonth = isSameMonth(day, currentMonth)
                    
                    let buttonClasses = 'aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 relative'
                    let style = {}
                     
                    // Highlight today (number + background) when visible in current month
                    if (isTodayDate && isInCurrentMonth) {
                      buttonClasses += ' text-[#0b268c] font-semibold ring-2 ring-[#0b268c]/25'
                      style = { backgroundColor: 'rgba(11, 38, 140, 0.12)' }
                    }

                     // Priority 1: Current week (week with today) - always blue
                    if (isInCurrentWeek && isInCurrentMonth) {
                      buttonClasses += ' text-[#0b268c] hover:bg-[#0b268c]/10 font-semibold'
                      // If today already set a slightly stronger highlight, keep it.
                      style = Object.keys(style).length ? style : { backgroundColor: 'rgba(11, 38, 140, 0.1)' }
                     } 
                     // Priority 2: Selected week (only if different from current week)
                     else if (isInSelectedWeek && isInCurrentMonth && !isInCurrentWeek) {
                       buttonClasses += ' bg-gray-100 text-gray-900 hover:bg-gray-200'
                     }
                     // Default styling for current month
                     else if (isInCurrentMonth) {
                       buttonClasses += ' text-gray-700 hover:bg-gray-50'
                     }
                     // Days from other months
                     else {
                       buttonClasses += ' text-gray-300'
                     }
                    
                    return (
                       <button
                         key={day.toISOString()}
                         onClick={() => { playButton(); handleDayClick(day) }}
                         className={buttonClasses}
                         style={style}
                       >
                        <span className="relative leading-none">
                          {isTodayDate && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: '#0b268c' }}></span>
                          )}
                          {format(day, 'd')}
                        </span>
                       </button>
                     )
                  })}
                </div>
                </div>
                </div>
                  </motion.div>
                )}

                {activeTab === 'heatmap' && (
                  <motion.div
                    key="heatmap"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    transition={{ duration: 0 }}
                  >
                    <div className="px-5 py-4 rounded-t-2xl" style={{ backgroundColor: '#0b268c' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <h4 className="text-base font-medium text-white">Analytics</h4>
                          <p className="text-xs text-white/80">Insights & Progress</p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { playButton(); setActiveTab('calendar') }}
                          className="h-8 w-8 p-0"
                          style={{ color: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Calendar className="h-5 w-5 text-white" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="px-5 pb-5 pt-4 max-h-[500px] overflow-y-auto">
                      <HabitAnalytics habits={habits} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </>
  )
}

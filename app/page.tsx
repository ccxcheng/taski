"use client"
import { isToday } from "date-fns"

import { Check, Pencil, RotateCcw, X, Trash2, ChevronLeft, ChevronRight, StickyNote, LogOut, User } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useWeekNavigation } from "@/hooks/useWeekNavigation"
import { WeekArrows } from "@/components/WeekNavigation/WeekArrows"
import { WeekDisplay } from "@/components/WeekNavigation/WeekDisplay"
import { CalendarPicker } from "@/components/WeekNavigation/CalendarPicker"
import { Calendar } from "lucide-react"
import { NoteContainer } from "@/components/StickyNotes/NoteContainer"
import { GratitudeTracker } from "@/components/Gratitude/GratitudeTracker"
import { HealthTracker } from "@/components/Gratitude/HealthTracker"
import { motion, AnimatePresence } from "framer-motion"
import { useStickyNotes } from "@/hooks/useStickyNotes"
import { updateTemplateFromCurrentWeek, resetTemplateToDefault, updateHabitStreaks } from "@/utils/storageUtils"
import { SillyCat } from "@/components/SillyCat/SillyCat"
import AuthModal from "@/components/Auth/AuthModal"
import { getCurrentUser, signOut, syncHabitsToSupabase, syncStickyNotesToSupabase, deleteStickyNoteFromSupabase, syncGratitudeToSupabase, syncHealthToSupabase, syncNotepadToSupabase, loadAllFromSupabase } from "@/utils/supabaseSync"
import { mergeHabits, mergeNotes, mergeWeekTextArray, mergeNotepad } from "@/utils/syncHelpers"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/contexts/ThemeContext"
import { ProfileMenu } from "@/components/ProfileMenu"
import { GlobalNotepad } from "@/components/GlobalNotepad/GlobalNotepad"
import { NotebookPen } from "lucide-react"
import { getButtonClasses, getCheckboxClasses, getFloatingButtonClasses, getProgressBarClasses, getTextClasses, getHeadingClasses } from "@/utils/themeUtils"
import { useSounds } from "@/hooks/useSounds"

type Habit = {
  id: string
  name: string
  completed: ("completed" | "skipped" | false)[]
  currentStreak: number
  longestStreak: number
  lastCompletedDate?: string
}

function NewHabitRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [newHabitName, setNewHabitName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { playButton } = useSounds()

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleAdd = () => {
    if (newHabitName.trim()) {
      onAdd(newHabitName.trim())
      setNewHabitName("")
    }
  }

  return (
    <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-4 mb-4 items-center">
      <div className="flex items-center">
        <Input
          ref={inputRef}
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="New habit name"
          className="h-8 text-sm mr-2 focus:border-accent-green focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
        />
        <motion.button
          onClick={() => { playButton(); handleAdd() }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="px-3 py-1.5 bg-accent-green hover:accent-green text-white text-sm font-medium rounded-md transition-colors duration-200"
        >
          Add
        </motion.button>
      </div>
      {Array(7)
        .fill(null)
        .map((_, index) => (
          <div key={index} className="flex justify-center">
            <div className="w-6 h-6 rounded border-2 border-gray-200 opacity-50" />
          </div>
        ))}
    </div>
  )
}

export default function HabitTracker() {
  const { theme, currentTheme } = useTheme()
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const [currentTime, setCurrentTime] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [showGratitude, setShowGratitude] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('showGratitude') === 'true'
  })
  const [showHealth, setShowHealth] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('showHealth') === 'true'
  })
  const [isNotepadOpen, setIsNotepadOpen] = useState(false)
  const [notepadContent, setNotepadContent] = useState('')
  const [isNotepadSyncing, setIsNotepadSyncing] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const weekDataRef = useRef<any>(null)
  // Single flag: true once Supabase load+merge has completed for the current
  // (user, weekKey) pair. Reset when the user or week changes. Sync effects
  // are gated on this so they never fire before the initial merge runs.
  const hasInitialSyncedRef = useRef<string | null>(null)

  // Use the new week navigation hook
  const {
    currentWeekDate,
    currentWeekKey,
    weekData,
    isLoading,
    isCurrentWeek,
    saveCurrentWeekData,
    goToNextWeek,
    goToPreviousWeek,
    goToCurrentWeek,
    goToSpecificWeek,
  } = useWeekNavigation()

  const habits = weekData?.habits || []
  weekDataRef.current = weekData

  // Sticky notes hook
  const {
    addNote,
  } = useStickyNotes(weekData, saveCurrentWeekData)

  const { playButton, playTaskDone, playConfetti, playStickyNote, playTabOpen, playMenuOpen, playMenuClose } = useSounds()

  const handleAddStickyNote = () => {
    playStickyNote()
    addNote('note')
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        setUser(user)
        
        if (user) {
          const { data } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user.id)
            .single()
          
          if (data) {
            setDisplayName(data.display_name)
          }
        }
      } catch (error) {
        console.error('❌ Error getting user:', error)
      }
    }
    
    loadUserData()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Single load + merge: runs once per (user, weekKey) when both are ready.
  // Pulls all data from Supabase in parallel, merges with local state per the
  // rules in syncHelpers.ts, and saves the merged result locally. The sync
  // effects below then push the merged state back up to Supabase.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !weekData) return
    const syncKey = `${user.id}:${currentWeekKey}`
    if (hasInitialSyncedRef.current === syncKey) return

    let cancelled = false
    loadAllFromSupabase(currentWeekKey, currentWeekDate).then(remote => {
      if (cancelled || !weekDataRef.current) return

      const localHabits = weekDataRef.current.habits ?? []
      const localNotes = weekDataRef.current.notes ?? []
      const localGratitude = weekDataRef.current.gratitude ?? Array(7).fill('')
      const localHealth = weekDataRef.current.health ?? Array(7).fill('')

      const mergedHabits = remote.habits ? mergeHabits(localHabits, remote.habits) : localHabits
      const mergedNotes = remote.notes ? mergeNotes(localNotes, remote.notes) : localNotes
      const mergedGratitude = remote.gratitude
        ? mergeWeekTextArray(localGratitude, remote.gratitude)
        : localGratitude
      const mergedHealth = remote.health
        ? mergeWeekTextArray(localHealth, remote.health)
        : localHealth

      saveCurrentWeekData({
        ...weekDataRef.current,
        habits: mergedHabits,
        notes: mergedNotes,
        gratitude: mergedGratitude,
        health: mergedHealth,
      })

      if (remote.notepad !== null) {
        setNotepadContent(prev => mergeNotepad(prev, remote.notepad!))
      }

      // Mark this (user, weekKey) as initially synced AFTER state is updated;
      // sync effects gate on this so they don't fire before the merge.
      hasInitialSyncedRef.current = syncKey
    })

    return () => {
      cancelled = true
    }
  }, [user, weekData, currentWeekKey, currentWeekDate, saveCurrentWeekData])

  // ─────────────────────────────────────────────────────────────────────────
  // Sync effects (1s debounced). Each watches one slice of state and pushes
  // it to Supabase. All gated on hasInitialSyncedRef so they never run
  // before the initial merge has completed for the current week.
  // ─────────────────────────────────────────────────────────────────────────
  const syncKey = user ? `${user.id}:${currentWeekKey}` : null
  const isSyncReady = syncKey !== null && hasInitialSyncedRef.current === syncKey

  useEffect(() => {
    if (!isSyncReady || !weekData || habits.length === 0) return
    const t = setTimeout(() => syncHabitsToSupabase(habits, currentWeekDate), 1000)
    return () => clearTimeout(t)
  }, [isSyncReady, habits, currentWeekDate, weekData])

  useEffect(() => {
    if (!isSyncReady || !weekData?.notes) return
    const t = setTimeout(() => syncStickyNotesToSupabase(weekData.notes), 1000)
    return () => clearTimeout(t)
  }, [isSyncReady, weekData?.notes])

  useEffect(() => {
    if (!isSyncReady || !weekData?.gratitude) return
    const t = setTimeout(() => syncGratitudeToSupabase(currentWeekKey, weekData.gratitude!), 1000)
    return () => clearTimeout(t)
  }, [isSyncReady, weekData?.gratitude, currentWeekKey])

  useEffect(() => {
    if (!isSyncReady || !weekData?.health) return
    const t = setTimeout(() => syncHealthToSupabase(currentWeekKey, weekData.health!), 1000)
    return () => clearTimeout(t)
  }, [isSyncReady, weekData?.health, currentWeekKey])

  useEffect(() => {
    if (!isSyncReady) return
    setIsNotepadSyncing(true)
    const t = setTimeout(() => {
      syncNotepadToSupabase(notepadContent).then(() => setIsNotepadSyncing(false))
    }, 1000)
    return () => clearTimeout(t)
  }, [isSyncReady, notepadContent])



  const handleNameUpdate = (newName: string) => {
    setDisplayName(newName)
  }

  const handleToggleGratitude = () => {
    setShowGratitude(prev => {
      const next = !prev
      localStorage.setItem('showGratitude', String(next))
      return next
    })
  }

  const handleToggleHealth = () => {
    setShowHealth(prev => {
      const next = !prev
      localStorage.setItem('showHealth', String(next))
      return next
    })
  }

  const handleGratitudeUpdate = (dayIndex: number, value: string) => {
    if (!weekData) return
    const current = weekData.gratitude ?? Array(7).fill('')
    const updated = current.map((v: string, i: number) => (i === dayIndex ? value : v))
    saveCurrentWeekData({ ...weekData, gratitude: updated })
  }

  const handleHealthUpdate = (dayIndex: number, value: string) => {
    if (!weekData) return
    const current = weekData.health ?? Array(7).fill('')
    const updated = current.map((v: string, i: number) => (i === dayIndex ? value : v))
    saveCurrentWeekData({ ...weekData, health: updated })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setDisplayName('')
      window.location.reload()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const currentDay = currentWeekDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const currentDayIndex = days.indexOf(currentDay)
  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const remainingTasks = habits.filter((habit) => habit.completed[currentDayIndex] === false).length

  // Calculate visible days for mobile (show current day and 1 day on each side = 3 days total)
  const visibleDayIndices = isMobile ? (() => {
    const indices = []
    // Try to show current day in the middle with 1 day on each side
    for (let i = Math.max(0, currentDayIndex - 1); i <= Math.min(6, currentDayIndex + 1); i++) {
      indices.push(i)
    }
    // If we don't have 3 days, add more from the end
    while (indices.length < 3 && indices.length < 7) {
      if (indices[0] > 0) {
        indices.unshift(indices[0] - 1)
      } else if (indices[indices.length - 1] < 6) {
        indices.push(indices[indices.length - 1] + 1)
      } else {
        break
      }
    }
    return indices
  })() : [0, 1, 2, 3, 4, 5, 6]

  const toggleHabit = (habitId: string, dayIndex: number) => {
    if (editMode || !weekData) return // Prevent toggling in edit mode

    let togglingToComplete = false

    const updatedHabits = habits.map((habit) => {
      if (habit.id === habitId) {
        const newCompleted = [...habit.completed]
        if (newCompleted[dayIndex] === false) {
          newCompleted[dayIndex] = "completed"
          togglingToComplete = true
        } else if (newCompleted[dayIndex] === "completed") {
          newCompleted[dayIndex] = "skipped"
        } else {
          newCompleted[dayIndex] = false
        }
        return { ...habit, completed: newCompleted }
      }
      return habit
    })

    // Play sound for completing a task
    if (togglingToComplete) {
      const allNowDone = updatedHabits.every((h) => h.completed[dayIndex] === "completed")
      if (allNowDone) {
        playConfetti()
      } else {
        playTaskDone()
      }
    }

    // Update streaks after changing completion status
    const habitsWithStreaks = updateHabitStreaks(updatedHabits)

    saveCurrentWeekData({
      ...weekData,
      habits: habitsWithStreaks,
    })
  }

  const resetHabits = () => {
    if (!weekData) return

    const resetHabits = habits.map((habit) => ({
      ...habit,
      completed: Array(7).fill(false),
    }))

    saveCurrentWeekData({
      ...weekData,
      habits: resetHabits,
    })
  }

  const startEditing = (habit: Habit) => {
    setEditingId(habit.id)
    setEditingName(habit.name)
  }

  const saveHabitName = () => {
    if (editingId && weekData) {
      const updatedHabits = habits.map((habit) => (habit.id === editingId ? { ...habit, name: editingName } : habit))
      const updatedWeekData = {
        ...weekData,
        habits: updatedHabits,
      }
      saveCurrentWeekData(updatedWeekData)
      
      // Update template if this is the current week
      if (isCurrentWeek) {
        updateTemplateFromCurrentWeek(updatedWeekData)
      }
      
      setEditingId(null)
    }
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName("")
  }

  const deleteHabit = (habitId: string) => {
    if (!weekData) return

    const updatedHabits = habits.filter((habit) => habit.id !== habitId)
    const updatedWeekData = {
      ...weekData,
      habits: updatedHabits,
    }
    saveCurrentWeekData(updatedWeekData)
    
    // Update template if this is the current week
    if (isCurrentWeek) {
      updateTemplateFromCurrentWeek(updatedWeekData)
    }
  }

  const toggleEditMode = () => {
    setEditMode(!editMode)
    if (editingId) {
      cancelEditing()
    }
  }

  const addHabit = (name: string) => {
    if (!weekData) return

    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completed: Array(7).fill(false),
      currentStreak: 0,
      longestStreak: 0,
    }

    const updatedWeekData = {
      ...weekData,
      habits: [...habits, newHabit],
    }
    saveCurrentWeekData(updatedWeekData)
    
    // Update template if this is the current week
    if (isCurrentWeek) {
      updateTemplateFromCurrentWeek(updatedWeekData)
    }
  }

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  const totalTasks = habits.length
  const completedTasks = habits.filter((habit) => habit.completed[currentDayIndex] === "completed").length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Track if this is the first render for animations
  const [hasAnimated, setHasAnimated] = useState(false)
  
  useEffect(() => {
    // After habits render for first time, disable future animations
    if (!isLoading && habits.length > 0 && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true)
      }, 700) // Wait for stagger animation to complete
      return () => clearTimeout(timer)
    }
  }, [isLoading, habits.length, hasAnimated])
  
  const shouldAnimate = !hasAnimated

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentTheme === 'glass' ? theme.colors.bg : theme.colors.bg }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.text.primary }}></div>
          <p style={{ color: theme.colors.text.muted }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen p-4 sm:p-6 md:p-8 pt-12 sm:pt-14 md:pt-16" 
      style={{ 
        background: currentTheme === 'glass' ? theme.colors.bg : theme.colors.bg,
        fontFamily: theme.fonts.body 
      }}
    >
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-[9999] flex items-center gap-6">
        {/* Global Notepad Button */}
        <motion.button
          onClick={() => { playMenuOpen(); setIsNotepadOpen(true) }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer transition-opacity hover:opacity-80"
          title="Open Notepad"
        >
          <NotebookPen className="w-5 h-5" style={{ color: '#0b268c' }} />
        </motion.button>
        <ProfileMenu
          user={user}
          displayName={displayName}
          onSignOut={handleSignOut}
          onSignIn={() => setIsAuthModalOpen(true)}
          onNameUpdate={handleNameUpdate}
          showGratitude={showGratitude}
          onToggleGratitude={handleToggleGratitude}
          showHealth={showHealth}
          onToggleHealth={handleToggleHealth}
        />
      </div>

      {/* Header with Week Navigation */}
      <div className="mb-8 sm:mb-12 md:mb-16">
        {/* Week navigation with arrows around the date */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { playButton(); goToPreviousWeek() }}
            className="p-0 cursor-pointer flex items-center justify-center transition-colors"
            style={{ color: '#D1D5DB' }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
          >
            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.button>
          
          <WeekDisplay
            currentWeekDate={currentWeekDate}
            isCurrentWeek={isCurrentWeek}
          />
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { playButton(); goToNextWeek() }}
            className="p-0 cursor-pointer flex items-center justify-center transition-colors"
            style={{ color: '#D1D5DB' }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = '#D1D5DB'}
          >
            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.button>
        </div>

        <h1 className={`text-center mb-2 text-2xl sm:text-2xl md:text-3xl ${getHeadingClasses(theme)}`}>{currentTime}</h1>
        <motion.h2 
          className={`w-fit mx-auto mb-2 text-sm sm:text-base cursor-pointer transition-colors px-2`}
          style={{ color: theme.colors.text.primary }}
          whileHover={{ scale: 1.02, color: theme.colors.text.primary }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { playButton(); goToCurrentWeek() }}
        >
          today is {new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()},{" "}
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" }).toLowerCase()}
        </motion.h2>
        <p className={`text-center mb-3 sm:mb-4 text-sm sm:text-base ${getTextClasses(theme, 'muted')}`}>you have {remainingTasks} tasks remaining</p>

        {/* Progress Bar */}
        <div className="w-full sm:w-11/12 md:w-3/4 mx-auto px-4 sm:px-0">
          <div className={getProgressBarClasses(theme).container}>
            <div
              className={getProgressBarClasses(theme).fill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>


      </div>

      {/* Habit Grid */}
      <div className="max-w-5xl mx-auto overflow-x-auto overflow-y-hidden">
        {/* Week Numbers */}
        <div className={`grid ${isMobile ? `grid-cols-[minmax(100px,1fr)_repeat(3,minmax(50px,1fr))]` : 'grid-cols-[minmax(120px,200px)_repeat(7,minmax(40px,1fr))] sm:grid-cols-[minmax(150px,200px)_repeat(7,1fr)]'} gap-2 sm:gap-3 md:gap-4 mb-0.5`}>
          <div /> {/* Empty cell for alignment */}
          {visibleDayIndices.map((dayIndex) => {
            const dayDate = new Date(currentWeekDate)
            // Adjust to Monday start (weekStartsOn: 1)
            const mondayOffset = currentWeekDate.getDay() === 0 ? -6 : 1 - currentWeekDate.getDay()
            dayDate.setDate(currentWeekDate.getDate() + mondayOffset + dayIndex)
            return (
              <div
                key={dayIndex}
                className={`text-center text-xs sm:text-sm font-medium`}
                style={{ color: isToday(dayDate) ? '#0b268c' : '#374151' }}
              >
                {dayDate.getDate()}
              </div>
            )
          })}
        </div>

        {/* Days Header */}
        <div className={`grid ${isMobile ? `grid-cols-[minmax(100px,1fr)_repeat(3,minmax(50px,1fr))]` : 'grid-cols-[minmax(120px,200px)_repeat(7,minmax(40px,1fr))] sm:grid-cols-[minmax(150px,200px)_repeat(7,1fr)]'} gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4`}>
          <div /> {/* Empty cell for alignment */}
          {visibleDayIndices.map((dayIndex) => {
            const day = days[dayIndex]
            return (
              <div
                key={dayIndex}
                className={`text-center text-xs sm:text-sm md:text-base ${isCurrentWeek && day === todayDay ? 'font-bold' : 'font-medium'}`}
                style={{ color: isCurrentWeek && day === todayDay ? '#0b268c' : '#374151' }}
              >
                {isMobile ? day.slice(0, 3) : day}
              </div>
            )
          })}
        </div>

        {/* Habits Grid */}
        {habits.map((habit) => (
            <motion.div
              key={habit.id}
              initial={shouldAnimate ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`grid ${isMobile ? `grid-cols-[minmax(100px,1fr)_repeat(3,minmax(50px,1fr))]` : 'grid-cols-[minmax(120px,200px)_repeat(7,minmax(40px,1fr))] sm:grid-cols-[minmax(150px,200px)_repeat(7,1fr)]'} gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 items-center`}
            >
              <div className="flex items-center">
                {editingId === habit.id ? (
                  <div className="flex items-center w-full">
                    <Input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveHabitName()
                        if (e.key === "Escape") cancelEditing()
                      }}
                      className="h-7 sm:h-8 text-xs sm:text-sm mr-1 sm:mr-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                    />
                    <Button size="icon" variant="ghost" onClick={() => { playButton(); saveHabitName() }} className="h-8 w-8">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { playButton(); cancelEditing() }} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-grow text-xs sm:text-sm md:text-base ${getTextClasses(theme, 'primary')}`}>{habit.name}</span>
                    {editMode && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => { playButton(); startEditing(habit) }} className={`h-6 w-6 sm:h-8 sm:w-8 ml-1 sm:ml-2 ${getTextClasses(theme, 'muted')}`}>
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { playButton(); deleteHabit(habit.id) }} className={`h-6 w-6 sm:h-8 sm:w-8 ${getTextClasses(theme, 'muted')}`}>
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
              {visibleDayIndices.map((dayIndex) => (
                <motion.div 
                  key={dayIndex} 
                  className="flex justify-center"
                  initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={shouldAnimate ? { 
                    duration: 0.3, 
                    delay: dayIndex * 0.05,
                    ease: "easeOut"
                  } : { duration: 0 }}
                >
                  <motion.button
                    onClick={() => toggleHabit(habit.id, dayIndex)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={getCheckboxClasses(
                      theme, 
                      habit.completed[dayIndex] === "completed" ? "completed" 
                        : habit.completed[dayIndex] === "skipped" ? "skipped" 
                        : "empty",
                      editMode
                    )}
                    disabled={editMode}
                  >
                    {habit.completed[dayIndex] === "completed" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Check className={`${currentTheme === 'glass' ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-white`} />
                      </motion.div>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          ))}

        {/* New Habit Row */}
        {editMode && <NewHabitRow onAdd={addHabit} />}
      </div>

      {/* Gratitude Tracker */}
      <AnimatePresence>
        {showGratitude && weekData && (
          <GratitudeTracker
            gratitude={weekData.gratitude ?? Array(7).fill('')}
            onUpdate={handleGratitudeUpdate}
            visibleDayIndices={visibleDayIndices}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* Health Tracker */}
      <AnimatePresence>
        {showHealth && weekData && (
          <HealthTracker
            health={weekData.health ?? Array(7).fill('')}
            onUpdate={handleHealthUpdate}
            visibleDayIndices={visibleDayIndices}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 flex flex-col gap-2 sm:gap-3 md:gap-4 z-40">
        
        
        <motion.button
          onClick={() => { playButton(); toggleEditMode() }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={getFloatingButtonClasses(theme, editMode)}
        >
          <Pencil className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${editMode ? "rotate-45" : ""}`} />
        </motion.button>
      </div>

      {/* Sticky Note Button */}
      <div className="fixed bottom-[88px] right-4 sm:bottom-[108px] sm:right-6 md:bottom-24 md:right-8 z-40">
        <motion.button
          onClick={handleAddStickyNote}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={getFloatingButtonClasses(theme, false)}
        >
          <StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>
      </div>

      {/* Calendar Button */}
      <div className="fixed bottom-[132px] right-4 sm:bottom-[156px] sm:right-6 md:bottom-40 md:right-8 z-40">
        <motion.button
          onClick={() => { playTabOpen(); setIsCalendarOpen(true) }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={getFloatingButtonClasses(theme, false)}
        >
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.button>
      </div>

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <CalendarPicker
          currentWeekDate={currentWeekDate}
          onWeekSelect={(date) => {
            goToSpecificWeek(date)
            setIsCalendarOpen(false)
          }}
          onGoToCurrentWeek={() => {
            goToCurrentWeek()
            setIsCalendarOpen(false)
          }}
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          habits={habits}
        />
      )}

      {/* Sticky Notes Container */}
      {weekData && (
        <NoteContainer
          weekData={weekData}
          saveWeekData={saveCurrentWeekData}
          onSupabaseDelete={user ? (noteId) => deleteStickyNoteFromSupabase(noteId) : undefined}
        />
      )}

      {/* Silly Cat */}
      <SillyCat 
        completedToday={completedTasks} 
        totalHabits={totalTasks}
        onDoubleClick={() => { handleToggleGratitude(); handleToggleHealth() }}
      />

      {/* Global Notepad */}
      <GlobalNotepad
        isOpen={isNotepadOpen}
        onClose={() => { playMenuClose(); setIsNotepadOpen(false) }}
        content={notepadContent}
        onChange={setNotepadContent}
        isSyncing={isNotepadSyncing}
      />

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
    </div>
  )
}


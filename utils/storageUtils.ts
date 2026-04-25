export interface WeekData {
  weekStart: string; // ISO string
  habits: Habit[];
  notes: StickyNote[];
}

export interface Habit {
  id: string;
  name: string;
  completed: ("completed" | "skipped" | false)[];
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // ISO date string
}

export interface StickyNote {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  type: 'reminder' | 'goal' | 'note';
  weekId?: string; // Optional for week-specific notes
}

const STORAGE_KEY = 'habitTrackerData'
const TEMPLATE_KEY = 'habitTemplate'
const TEMPLATE_VERSION_KEY = 'habitTemplateVersion' // Tracks when template was last updated

export const saveWeekData = (weekKey: string, data: WeekData): void => {
  try {
    const allData = getAllWeekData()
    allData[weekKey] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData))
  } catch (error) {
    console.error('Error saving week data:', error)
  }
}

export const getWeekData = (weekKey: string): WeekData | null => {
  try {
    const allData = getAllWeekData()
    const existingData = allData[weekKey]
    
    if (existingData) {
      // Check if this week should get the updated template
      const template = getHabitTemplate()
      const templateVersion = getTemplateVersion()
      
      if (template && templateVersion) {
        // Only apply template to weeks >= the template version week
        // This ensures past weeks aren't modified, but current and future weeks get updates
        if (weekKey >= templateVersion) {
          const updatedWeekData: WeekData = {
            ...existingData,
            habits: template.map(habit => ({
              ...habit,
              completed: existingData.habits.find(h => h.id === habit.id)?.completed || Array(7).fill(false), // Preserve completion data if habit exists
              currentStreak: existingData.habits.find(h => h.id === habit.id)?.currentStreak || 0,
              longestStreak: existingData.habits.find(h => h.id === habit.id)?.longestStreak || 0,
            }))
          }
          // Save the updated data
          saveWeekData(weekKey, updatedWeekData)
          return updatedWeekData
        }
      }
      
      return existingData
    }
    
    return null
  } catch (error) {
    console.error('Error getting week data:', error)
    return null
  }
}

export const getAllWeekData = (): Record<string, WeekData> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Error getting all week data:', error)
    return {}
  }
}

// Template management functions
// These functions allow the current week's habits to serve as a template for future weeks
export const saveHabitTemplate = (habits: Habit[]): void => {
  try {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(habits))
  } catch (error) {
    console.error('Error saving habit template:', error)
  }
}

export const getHabitTemplate = (): Habit[] | null => {
  try {
    const template = localStorage.getItem(TEMPLATE_KEY)
    return template ? JSON.parse(template) : null
  } catch (error) {
    console.error('Error getting habit template:', error)
    return null
  }
}

export const saveTemplateVersion = (weekKey: string): void => {
  try {
    localStorage.setItem(TEMPLATE_VERSION_KEY, weekKey)
  } catch (error) {
    console.error('Error saving template version:', error)
  }
}

export const getTemplateVersion = (): string | null => {
  try {
    return localStorage.getItem(TEMPLATE_VERSION_KEY)
  } catch (error) {
    console.error('Error getting template version:', error)
    return null
  }
}

export const updateTemplateFromCurrentWeek = (weekData: WeekData): void => {
  // Extract just the habit structure (without completion data) for the template
  const templateHabits = weekData.habits.map(habit => ({
    id: habit.id,
    name: habit.name,
    completed: Array(7).fill(false), // Reset completion for template
    currentStreak: 0,
    longestStreak: 0
  }))
  saveHabitTemplate(templateHabits)
  // Save the week key as the template version - this week and future weeks will use this template
  saveTemplateVersion(weekData.weekStart)
}

export const resetTemplateToDefault = (): void => {
  // Reset template to the original default habits
  const defaultHabits = getDefaultHabits()
  saveHabitTemplate(defaultHabits)
  // Save current week as template version
  const currentWeekKey = new Date().toISOString().split('T')[0]
  saveTemplateVersion(currentWeekKey)
}

// Streak calculation utilities
export const calculateStreak = (completed: ("completed" | "skipped" | false)[]): number => {
  let streak = 0
  // Count backwards from the end to find the current streak
  for (let i = completed.length - 1; i >= 0; i--) {
    if (completed[i] === "completed") {
      streak++
    } else {
      break
    }
  }
  return streak
}

export const updateHabitStreaks = (habits: Habit[]): Habit[] => {
  return habits.map(habit => {
    const currentStreak = calculateStreak(habit.completed)
    const longestStreak = Math.max(habit.longestStreak, currentStreak)
    
    return {
      ...habit,
      currentStreak,
      longestStreak
    }
  })
}

export const migrateExistingData = (): void => {
  try {
    // Check if old format exists
    const oldHabits = localStorage.getItem('habits')
    if (oldHabits) {
      const habits = JSON.parse(oldHabits)
      const currentWeekKey = new Date().toISOString().split('T')[0]
      
      // Create new format
      const weekData: WeekData = {
        weekStart: currentWeekKey,
        habits,
        notes: []
      }
      
      // Save in new format
      saveWeekData(currentWeekKey, weekData)
      
      // Also save as template for future weeks
      updateTemplateFromCurrentWeek(weekData)
      
      // Remove old format
      localStorage.removeItem('habits')
    }
    
    // Ensure template version exists for existing users
    if (!getTemplateVersion() && getHabitTemplate()) {
      const currentWeekKey = new Date().toISOString().split('T')[0]
      saveTemplateVersion(currentWeekKey)
    }
  } catch (error) {
    console.error('Error migrating existing data:', error)
  }
}

export const getDefaultHabits = (): Habit[] => [
  { id: "1", name: "sleep before 1", completed: Array(7).fill(false), currentStreak: 0, longestStreak: 0 },
  { id: "2", name: "journal", completed: Array(7).fill(false), currentStreak: 0, longestStreak: 0 },
  { id: "3", name: "physical therapy", completed: Array(7).fill(false), currentStreak: 0, longestStreak: 0 },
  { id: "4", name: "write", completed: Array(7).fill(false), currentStreak: 0, longestStreak: 0 },
  { id: "5", name: "draw", completed: Array(7).fill(false), currentStreak: 0, longestStreak: 0 },
]

export const createDefaultWeekData = (weekStart: string): WeekData => {
  // First try to use the saved template
  const template = getHabitTemplate()
  const habits = template || getDefaultHabits()
  
  return {
    weekStart,
    habits: habits.map(habit => ({
      ...habit,
      completed: Array(7).fill(false) // Reset completion for new week
    })),
    notes: []
  }
} 
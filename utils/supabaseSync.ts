import { supabase } from '@/lib/supabase'
import type { Habit, StickyNote } from '@/utils/storageUtils'
import type { DbHabit, DbDailyCompletion, DbStickyNote, DbGratitude, DbHealth, DbNotepad } from '@/lib/supabase'
import { format } from 'date-fns'

export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const syncHabitsToSupabase = async (habits: Habit[], currentWeekDate: Date) => {
  if (!supabase) return false
  const user = await getCurrentUser()
  if (!user) return

  try {
    const dbHabits: Partial<DbHabit>[] = habits.map(habit => ({
      id: habit.id,
      user_id: user.id,
      name: habit.name,
      current_streak: habit.currentStreak,
      longest_streak: habit.longestStreak,
      last_completed_date: habit.lastCompletedDate || null,
    }))

    const { error: habitsError } = await supabase
      .from('habits')
      .upsert(dbHabits, { onConflict: 'id' })

    if (habitsError) throw habitsError

    // Delete any habits in Supabase that no longer exist locally
    const localIds = habits.map(h => h.id)
    const { data: remoteHabits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id)
    if (remoteHabits) {
      const staleIds = (remoteHabits as { id: string }[])
        .map(h => h.id)
        .filter(id => !localIds.includes(id))
      if (staleIds.length > 0) {
        await supabase.from('habits').delete().in('id', staleIds)
      }
    }

    const completions: Partial<DbDailyCompletion>[] = []
    
    habits.forEach(habit => {
      habit.completed.forEach((status, dayIndex) => {
        const dayDate = new Date(currentWeekDate)
        const mondayOffset = currentWeekDate.getDay() === 0 ? -6 : 1 - currentWeekDate.getDay()
        dayDate.setDate(currentWeekDate.getDate() + mondayOffset + dayIndex)
        
        completions.push({
          user_id: user.id,
          habit_id: habit.id,
          date: format(dayDate, 'yyyy-MM-dd'),
          completed: status === 'completed',
          status: status === 'completed' ? 'completed' : status === 'skipped' ? 'skipped' : 'incomplete',
        })
      })
    })

    if (completions.length > 0) {
      const { error: completionsError } = await supabase
        .from('daily_completions')
        .upsert(completions, { onConflict: 'habit_id,date' })

      if (completionsError) throw completionsError
    }

    return true
  } catch (error) {
    console.error('Error syncing habits to Supabase:', error)
    return false
  }
}

export const loadHabitsFromSupabase = async (currentWeekDate: Date): Promise<Habit[] | null> => {
  if (!supabase) return null
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const { data: dbHabits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (habitsError) throw habitsError

    const habitIds = (dbHabits as DbHabit[]).map((h: DbHabit) => h.id)
    
    const mondayOffset = currentWeekDate.getDay() === 0 ? -6 : 1 - currentWeekDate.getDay()
    const weekStart = new Date(currentWeekDate)
    weekStart.setDate(currentWeekDate.getDate() + mondayOffset)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const { data: dbCompletions, error: completionsError } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('user_id', user.id)
      .in('habit_id', habitIds)
      .gte('date', format(weekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'))

    if (completionsError) throw completionsError

    const habits: Habit[] = dbHabits.map((dbHabit: DbHabit) => {
      const completed = Array(7).fill(false).map((_, dayIndex) => {
        const dayDate = new Date(weekStart)
        dayDate.setDate(weekStart.getDate() + dayIndex)
        const dateStr = format(dayDate, 'yyyy-MM-dd')
        
        const completion = dbCompletions.find(
          (c: DbDailyCompletion) => c.habit_id === dbHabit.id && c.date === dateStr
        )
        
        if (!completion) return false
        if (completion.status === 'completed') return 'completed'
        if (completion.status === 'skipped') return 'skipped'
        return completion.completed ? 'completed' : false
      })

      return {
        id: dbHabit.id,
        name: dbHabit.name,
        completed: completed as ("completed" | "skipped" | false)[],
        currentStreak: dbHabit.current_streak,
        longestStreak: dbHabit.longest_streak,
        lastCompletedDate: dbHabit.last_completed_date || undefined,
      }
    })

    return habits
  } catch (error) {
    console.error('Error loading habits from Supabase:', error)
    return null
  }
}

export const syncStickyNotesToSupabase = async (notes: StickyNote[]) => {
  if (!supabase) return false
  const user = await getCurrentUser()
  if (!user) return

  try {
    const dbNotes: Partial<DbStickyNote>[] = notes.map(note => ({
      id: note.id,
      user_id: user.id,
      content: note.content,
      position_x: note.position.x,
      position_y: note.position.y,
      size_width: note.size.width,
      size_height: note.size.height,
      color: note.color,
      type: note.type,
    }))

    const { error } = await supabase
      .from('sticky_notes')
      .upsert(dbNotes, { onConflict: 'id' })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error syncing sticky notes to Supabase:', error)
    return false
  }
}

export const loadStickyNotesFromSupabase = async (): Promise<StickyNote[] | null> => {
  if (!supabase) return null
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const { data: dbNotes, error } = await supabase
      .from('sticky_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    const notes: StickyNote[] = dbNotes.map((dbNote: DbStickyNote) => ({
      id: dbNote.id,
      content: dbNote.content,
      position: {
        x: dbNote.position_x,
        y: dbNote.position_y,
      },
      size: {
        width: dbNote.size_width,
        height: dbNote.size_height,
      },
      color: dbNote.color,
      type: dbNote.type as 'reminder' | 'goal' | 'note',
    }))

    return notes
  } catch (error) {
    console.error('Error loading sticky notes from Supabase:', error)
    return null
  }
}

export const deleteStickyNoteFromSupabase = async (noteId: string) => {
  if (!supabase) return false
  const user = await getCurrentUser()
  if (!user) return

  try {
    const { error } = await supabase
      .from('sticky_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting sticky note from Supabase:', error)
    return false
  }
}

export const syncGratitudeToSupabase = async (weekStart: string, entries: string[]) => {
  if (!supabase) return false
  const user = await getCurrentUser()
  if (!user) return false

  try {
    const { error } = await supabase
      .from('gratitude')
      .upsert(
        { user_id: user.id, week_start: weekStart, entries },
        { onConflict: 'user_id,week_start' }
      )
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error syncing gratitude to Supabase:', error)
    return false
  }
}

export const loadGratitudeFromSupabase = async (weekStart: string): Promise<string[] | null> => {
  if (!supabase) return null
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const { data, error } = await supabase
      .from('gratitude')
      .select('entries')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return Array(7).fill('') // no row yet
      throw error
    }

    return (data as DbGratitude).entries ?? Array(7).fill('')
  } catch (error) {
    console.error('Error loading gratitude from Supabase:', error)
    return null
  }
}

export const syncHealthToSupabase = async (weekStart: string, entries: string[]) => {
  if (!supabase) return false
  const user = await getCurrentUser()
  if (!user) return false

  try {
    const { error } = await supabase
      .from('health')
      .upsert(
        { user_id: user.id, week_start: weekStart, entries },
        { onConflict: 'user_id,week_start' }
      )
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error syncing health to Supabase:', error)
    return false
  }
}

export const loadHealthFromSupabase = async (weekStart: string): Promise<string[] | null> => {
  if (!supabase) return null
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const { data, error } = await supabase
      .from('health')
      .select('entries')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // no row yet — let sync effect push local up
      throw error
    }

    return (data as DbHealth).entries ?? null
  } catch (error) {
    console.error('Error loading health from Supabase:', error)
    return null
  }
}

export const syncNotepadToSupabase = async (content: string) => {
  if (!supabase) return false
  const user = await getCurrentUser()
  if (!user) return false

  try {
    const { error } = await supabase
      .from('notepad')
      .upsert({ user_id: user.id, content }, { onConflict: 'user_id' })
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error syncing notepad to Supabase:', error)
    return false
  }
}

export const loadNotepadFromSupabase = async (): Promise<string | null> => {
  if (!supabase) return null
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const { data, error } = await supabase
      .from('notepad')
      .select('content')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return '' // no row yet
      throw error
    }

    return (data as DbNotepad).content ?? ''
  } catch (error) {
    console.error('Error loading notepad from Supabase:', error)
    return null
  }
}

export interface AllSupabaseData {
  habits: Habit[] | null
  notes: StickyNote[] | null
  gratitude: string[] | null
  health: string[] | null
  notepad: string | null
}

// Single entry point: pull all data in parallel. Each field is null if its
// fetch failed; never throws.
export const loadAllFromSupabase = async (
  weekKey: string,
  weekDate: Date
): Promise<AllSupabaseData> => {
  const [habits, notes, gratitude, health, notepad] = await Promise.all([
    loadHabitsFromSupabase(weekDate),
    loadStickyNotesFromSupabase(),
    loadGratitudeFromSupabase(weekKey),
    loadHealthFromSupabase(weekKey),
    loadNotepadFromSupabase(),
  ])
  return { habits, notes, gratitude, health, notepad }
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-project-url' && 
  supabaseAnonKey !== 'your-anon-key'

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

export interface DbHabit {
  id: string
  user_id: string
  name: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  created_at: string
  updated_at: string
}

export interface DbDailyCompletion {
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  status: string
  created_at: string
}

export interface DbStickyNote {
  id: string
  user_id: string
  content: string
  position_x: number
  position_y: number
  size_width: number
  size_height: number
  color: string
  type: string
  created_at: string
  updated_at: string
}

export interface DbGratitude {
  user_id: string
  week_start: string
  entries: string[]
  created_at: string
  updated_at: string
}

export interface DbHealth {
  user_id: string
  week_start: string
  entries: string[]
  created_at: string
  updated_at: string
}

export interface DbNotepad {
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

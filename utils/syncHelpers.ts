import type { Habit, StickyNote } from '@/utils/storageUtils'

// Habit completion state ranking — completed wins over skipped wins over untouched.
const habitRank = (s: 'completed' | 'skipped' | false): number =>
  s === 'completed' ? 2 : s === 'skipped' ? 1 : 0

export const mergeHabits = (local: Habit[], remote: Habit[]): Habit[] => {
  if (remote.length === 0) return local
  if (local.length === 0) return remote

  return remote.map(rh => {
    const lh = local.find(h => h.id === rh.id)
    if (!lh) return rh
    const completed = rh.completed.map((rc, i) => {
      const lc = lh.completed[i]
      return habitRank(lc) > habitRank(rc) ? lc : rc
    }) as ('completed' | 'skipped' | false)[]
    return { ...rh, completed }
  })
}

// Sticky notes: union by ID. Remote wins for conflicts; local-only additions are preserved.
export const mergeNotes = (local: StickyNote[], remote: StickyNote[]): StickyNote[] => {
  const byId = new Map<string, StickyNote>()
  for (const n of local) byId.set(n.id, n)
  for (const n of remote) byId.set(n.id, n) // remote overrides local for shared IDs
  return Array.from(byId.values())
}

// Per-cell string array (gratitude, health): remote cell wins if it has content;
// local cell preserved if remote is blank.
export const mergeWeekTextArray = (local: string[], remote: string[]): string[] => {
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    const r = (remote[i] ?? '').trim()
    const l = local[i] ?? ''
    out.push(r.length > 0 ? remote[i] : l)
  }
  return out
}

// Notepad: remote wins if non-empty, else keep local.
export const mergeNotepad = (local: string, remote: string): string => {
  return remote.trim().length > 0 ? remote : local
}

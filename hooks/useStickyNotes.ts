import { useState, useCallback } from 'react'
import { StickyNote } from '@/utils/storageUtils'

export const useStickyNotes = (weekData: any, saveWeekData: (data: any) => void) => {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)

  // Simple spawn position - just near the add button
  const getSpawnPosition = (existingNotes: StickyNote[]) => {
    const noteWidth = 200
    const noteHeight = 150
    
    // Simple: spawn near the add button (bottom right)
    const baseX = window.innerWidth - noteWidth - 80 // 80px from right edge
    const baseY = 300 // Fixed position 300px from top of screen
    
    // Fallback to base position
    return { x: baseX, y: baseY }
  }

  const addNote = useCallback((type: 'reminder' | 'goal' | 'note' = 'note') => {
    if (!weekData) return

    const spawnPosition = getSpawnPosition(weekData.notes || [])

    const newNote: StickyNote = {
      id: Date.now().toString(),
      content: '',
      position: spawnPosition,
      size: { width: 200, height: 150 },
      color: getColorForType(type),
      type,
    }

    const updatedData = {
      ...weekData,
      notes: [...weekData.notes, newNote]
    }

    saveWeekData(updatedData)
    setEditingNote(newNote.id)
  }, [weekData, saveWeekData])

  const updateNote = useCallback((noteId: string, updates: Partial<StickyNote>) => {
    if (!weekData) return

    const updatedData = {
      ...weekData,
      notes: weekData.notes.map((note: StickyNote) =>
        note.id === noteId ? { ...note, ...updates } : note
      )
    }

    saveWeekData(updatedData)
  }, [weekData, saveWeekData])

  const deleteNote = useCallback((noteId: string) => {
    if (!weekData) return

    const updatedData = {
      ...weekData,
      notes: weekData.notes.filter((note: StickyNote) => note.id !== noteId)
    }

    saveWeekData(updatedData)
    setSelectedNote(null)
    setEditingNote(null)
  }, [weekData, saveWeekData])

  const moveNote = useCallback((noteId: string, position: { x: number; y: number }) => {
    updateNote(noteId, { position })
  }, [updateNote])

  const resizeNote = useCallback((noteId: string, size: { width: number; height: number }) => {
    updateNote(noteId, { size })
  }, [updateNote])

  const selectNote = useCallback((noteId: string | null) => {
    setSelectedNote(noteId)
  }, [])

  const startEditing = useCallback((noteId: string) => {
    setEditingNote(noteId)
  }, [])

  const stopEditing = useCallback(() => {
    setEditingNote(null)
  }, [])

  const getColorForType = (type: 'reminder' | 'goal' | 'note'): string => {
    switch (type) {
      case 'reminder':
        return '#fce7f3' // Pink
      case 'goal':
        return '#dbeafe' // Blue
      case 'note':
      default:
        return '#fef3c7' // Yellow
    }
  }

  return {
    notes: weekData?.notes || [],
    selectedNote,
    editingNote,
    addNote,
    updateNote,
    deleteNote,
    moveNote,
    resizeNote,
    selectNote,
    startEditing,
    stopEditing,
    getColorForType,
  }
} 
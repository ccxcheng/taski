import { StickyNote, StickyNote as StickyNoteIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNote as StickyNoteComponent } from './StickyNote'
import { useStickyNotes } from '@/hooks/useStickyNotes'
import { Button } from '@/components/ui/button'
import { StickyNote as StickyNoteType } from '@/utils/storageUtils'

interface NoteContainerProps {
  weekData: any
  saveWeekData: (data: any) => void
}

export const NoteContainer = ({ weekData, saveWeekData }: NoteContainerProps) => {
  const {
    notes,
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
  } = useStickyNotes(weekData, saveWeekData)

  const handleAddNote = () => {
    addNote('note')
  }

  const handleNoteEdit = (noteId: string) => {
    startEditing(noteId)
  }

  const handleNoteUpdate = (noteId: string, updates: any) => {
    updateNote(noteId, updates)
  }

  const handleNoteDelete = (noteId: string) => {
    deleteNote(noteId)
  }

  const handleNoteMove = (noteId: string, position: { x: number; y: number }) => {
    moveNote(noteId, position)
  }

  const handleNoteResize = (noteId: string, size: { width: number; height: number }) => {
    resizeNote(noteId, size)
  }

  const handleBackgroundClick = () => {
    selectNote(null)
    stopEditing()
  }

  return (
    <>
      {/* Notes */}
      {notes.map((note: StickyNoteType) => (
        <StickyNoteComponent
          key={note.id}
          note={note}
          isSelected={selectedNote === note.id}
          isEditing={editingNote === note.id}
          onSelect={() => {}} // Not used in new implementation
          onEdit={() => handleNoteEdit(note.id)}
          onUpdate={(updates) => handleNoteUpdate(note.id, updates)}
          onDelete={() => handleNoteDelete(note.id)}
          onMove={(position) => handleNoteMove(note.id, position)}
          onResize={(size) => handleNoteResize(note.id, size)}
        />
      ))}
    </>
  )
} 
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import { StickyNote as StickyNoteType } from '@/utils/storageUtils'
import { Button } from '@/components/ui/button'

interface StickyNoteProps {
  note: StickyNoteType
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onEdit: () => void
  onUpdate: (updates: Partial<StickyNoteType>) => void
  onDelete: () => void
  onMove: (position: { x: number; y: number }) => void
  onResize: (size: { width: number; height: number }) => void
}

export const StickyNote = ({
  note,
  isSelected,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onMove,
  onResize,
}: StickyNoteProps) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const finalPositionRef = useRef<{ x: number; y: number } | null>(null)
  const finalSizeRef = useRef<{ width: number; height: number } | null>(null)

  const colorOptions = [
    { name: 'Yellow', value: '#fef3c7' },
    { name: 'Pink', value: '#fce7f3' },
    { name: 'Blue', value: '#dbeafe' },
    { name: 'Green', value: '#dcfce7' },
    { name: 'Purple', value: '#f3e8ff' },
    { name: 'Orange', value: '#fed7aa' },
  ]

  // Ultra-optimized drag logic - direct DOM manipulation, no React re-renders
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.tagName === 'TEXTAREA') {
      return
    }
    
    isDraggingRef.current = true
    dragOffsetRef.current = { 
      x: e.clientX - note.position.x, 
      y: e.clientY - note.position.y 
    }
    setDragStart({ x: e.clientX, y: e.clientY }) // Just for cursor change
    
    // Apply will-change for GPU acceleration
    if (noteRef.current) {
      noteRef.current.style.willChange = 'transform'
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !noteRef.current) return

    // Cancel previous frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    // Use requestAnimationFrame + direct DOM manipulation
    rafRef.current = requestAnimationFrame(() => {
      if (!noteRef.current) return
      
      const newX = e.clientX - dragOffsetRef.current.x
      const newY = e.clientY - dragOffsetRef.current.y

      // Simple viewport constraints
      const maxX = window.innerWidth - note.size.width
      const maxY = window.innerHeight - note.size.height
      
      const clampedX = Math.max(0, Math.min(newX, maxX))
      const clampedY = Math.max(0, Math.min(newY, maxY))

      // Direct DOM manipulation - no React re-render!
      noteRef.current.style.transform = `translate(${clampedX - note.position.x}px, ${clampedY - note.position.y}px)`
      
      // Store final position for save
      finalPositionRef.current = { x: clampedX, y: clampedY }
    })
  }, [note.size.width, note.size.height, note.position.x, note.position.y])

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return
    
    // Save final position to localStorage
    if (finalPositionRef.current) {
      onMove(finalPositionRef.current)
    }
    
    // Cleanup
    isDraggingRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    // Reset transform and remove will-change
    if (noteRef.current) {
      noteRef.current.style.transform = ''
      noteRef.current.style.willChange = ''
    }
    
    setDragStart(null)
    finalPositionRef.current = null
  }, [onMove])

  useEffect(() => {
    if (dragStart) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      }
    }
  }, [dragStart, handleMouseMove, handleMouseUp])

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    onEdit()
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    isResizingRef.current = true
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: note.size.width,
      height: note.size.height,
    })
    
    // Apply will-change for GPU acceleration
    if (noteRef.current) {
      noteRef.current.style.willChange = 'width, height'
    }
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || !noteRef.current) return

    // Cancel previous frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    // Use requestAnimationFrame + direct DOM manipulation
    rafRef.current = requestAnimationFrame(() => {
      if (!noteRef.current) return
      
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      const newWidth = Math.max(150, resizeStart.width + deltaX)
      const newHeight = Math.max(100, resizeStart.height + deltaY)

      // Direct DOM manipulation - no React re-render!
      noteRef.current.style.width = `${newWidth}px`
      noteRef.current.style.height = `${newHeight}px`
      
      // Store final size for save
      finalSizeRef.current = { width: newWidth, height: newHeight }
    })
  }, [resizeStart])

  const handleResizeEnd = useCallback(() => {
    if (!isResizingRef.current) return
    
    // Save final size to localStorage
    if (finalSizeRef.current) {
      onResize(finalSizeRef.current)
    }
    
    // Cleanup
    isResizingRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    // Remove will-change
    if (noteRef.current) {
      noteRef.current.style.willChange = ''
    }
    
    setIsResizing(false)
    finalSizeRef.current = null
  }, [onResize])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove, { passive: true })
      document.addEventListener('mouseup', handleResizeEnd, { passive: true })
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  const handleColorChange = (color: string) => {
    onUpdate({ color })
    setShowColorPicker(false)
  }

  const handleColorPickerToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowColorPicker(!showColorPicker)
  }

  return (
    <motion.div
      ref={noteRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      initial={{ opacity: 0, scale: 1, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.15, 
        ease: "easeOut"
      }}
      style={{
        position: 'fixed',
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        height: note.size.height,
        zIndex: isSelected ? 5 : 1,
        cursor: dragStart ? 'grabbing' : 'grab',
      }}
      className="hover:shadow-lg transition-shadow duration-200"
    >
      <div 
        className="w-full h-full rounded-lg shadow-md p-4 relative border border-gray-200"
        style={{ backgroundColor: note.color || '#fef3c7' }}
      >
        {/* X Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="absolute top-2 right-2 h-5 w-5 p-0 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 rounded opacity-0 hover:opacity-100 transition-all duration-200"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Color Picker Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleColorPickerToggle}
          className="absolute top-2 right-8 h-5 w-5 p-0 bg-white hover:bg-gray-50 text-gray-400 rounded opacity-0 hover:opacity-100 transition-all duration-200 shadow-sm"
        >
          <Palette className="h-3 w-3" />
        </Button>

        {/* Color Picker Palette */}
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-8 right-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
          >
            <div className="grid grid-cols-3 gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className="w-6 h-6 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Content */}
        {isEditing ? (
          <textarea
            value={note.content}
            onChange={handleContentChange}
            className="w-full h-full resize-none bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-500 pt-6"
            placeholder=""
            autoFocus
            onBlur={() => onUpdate({ content: note.content })}
          />
        ) : (
          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed pt-6">
            {note.content}
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
        )}

        {/* Resize handle */}
        <div
          className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity duration-200"
          onMouseDown={handleResizeStart}
        >
          <div className="w-full h-full flex items-end justify-end">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  )
} 
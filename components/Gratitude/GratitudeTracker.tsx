import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface GratitudeTrackerProps {
  gratitude: string[]
  onUpdate: (dayIndex: number, value: string) => void
  visibleDayIndices: number[]
  isMobile: boolean
}

export const GratitudeTracker = ({
  gratitude,
  onUpdate,
  visibleDayIndices,
  isMobile,
}: GratitudeTrackerProps) => {
  const [localValues, setLocalValues] = useState<string[]>(() =>
    gratitude.length === 7 ? [...gratitude] : Array(7).fill('')
  )
  const debounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})
  const pendingCursorRef = useRef<{ dayIndex: number; pos: number } | null>(null)

  // Sync incoming prop changes (e.g. week navigation, Supabase load)
  useEffect(() => {
    if (gratitude.length === 7) {
      setLocalValues([...gratitude])
    }
  }, [gratitude])

  const resize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  // Resize all visible textareas whenever localValues change
  useEffect(() => {
    visibleDayIndices.forEach((dayIndex) => {
      resize(textareaRefs.current[dayIndex] ?? null)
    })
    // Restore cursor position after controlled re-render
    if (pendingCursorRef.current) {
      const { dayIndex, pos } = pendingCursorRef.current
      const el = textareaRefs.current[dayIndex]
      if (el) {
        el.selectionStart = pos
        el.selectionEnd = pos
      }
      pendingCursorRef.current = null
    }
  })

  const applyChange = useCallback(
    (dayIndex: number, value: string) => {
      setLocalValues((prev) => {
        const next = [...prev]
        next[dayIndex] = value
        return next
      })
      clearTimeout(debounceRefs.current[dayIndex])
      debounceRefs.current[dayIndex] = setTimeout(() => {
        onUpdate(dayIndex, value)
      }, 400)
    },
    [onUpdate]
  )

  const handleFocus = useCallback(
    (dayIndex: number) => {
      if (!localValues[dayIndex]) {
        pendingCursorRef.current = { dayIndex, pos: 2 }
        applyChange(dayIndex, '• ')
      }
    },
    [localValues, applyChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, dayIndex: number) => {
      const textarea = e.currentTarget

      if (e.key === 'Enter') {
        e.preventDefault()
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const value = localValues[dayIndex] ?? ''
        const newValue = value.substring(0, start) + '\n• ' + value.substring(end)
        const newPos = start + 3 // '\n• ' is 3 chars
        pendingCursorRef.current = { dayIndex, pos: newPos }
        applyChange(dayIndex, newValue)
      }

      if (e.key === 'Backspace') {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const value = localValues[dayIndex] ?? ''
        // If cursor is right after a bullet at the start of a line, remove it and the preceding newline
        if (start === end && start >= 3 && value.substring(start - 3, start) === '\n• ') {
          e.preventDefault()
          const newValue = value.substring(0, start - 3) + value.substring(end)
          pendingCursorRef.current = { dayIndex, pos: start - 3 }
          applyChange(dayIndex, newValue)
        }
      }
    },
    [localValues, applyChange]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-5xl mx-auto mt-6 mb-4 px-0"
    >
      <div
        className={`grid ${
          isMobile
            ? 'grid-cols-[minmax(100px,1fr)_repeat(3,minmax(50px,1fr))]'
            : 'grid-cols-[minmax(120px,200px)_repeat(7,minmax(40px,1fr))] sm:grid-cols-[minmax(150px,200px)_repeat(7,1fr)]'
        } gap-2 sm:gap-3 md:gap-4 items-start`}
      >
        {/* Label column */}
        <div className="flex items-start pt-2">
          <span className="text-xs sm:text-sm text-gray-400 italic select-none">
            today, i'm grateful for...
          </span>
        </div>

        {/* One textarea per visible day */}
        {visibleDayIndices.map((dayIndex, i) => (
          <motion.div
            key={dayIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
          >
            <textarea
              ref={(el) => { textareaRefs.current[dayIndex] = el }}
              value={localValues[dayIndex] ?? ''}
              onChange={(e) => applyChange(dayIndex, e.target.value)}
              onFocus={() => handleFocus(dayIndex)}
              onKeyDown={(e) => handleKeyDown(e, dayIndex)}
              placeholder="..."
              rows={1}
              className="w-full resize-none overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 placeholder-gray-300 focus:border-gray-300 focus:bg-white focus:outline-none transition-colors scrollbar-hide leading-relaxed"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

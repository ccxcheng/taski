'use client'
import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface GlobalNotepadProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onChange: (value: string) => void
  isSyncing?: boolean
}

export function GlobalNotepad({ isOpen, onClose, content, onChange, isSyncing }: GlobalNotepadProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localContent, setLocalContent] = useState(content)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value)
    onChange(e.target.value)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="notepad-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
          onClick={handleBackdropClick}
        >
          <motion.div
            key="notepad-modal"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#fff' }}
          >
            {/* Blue header bar */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: '#0b268c' }}
            >
              <div className="flex items-center gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" />
                  <rect width="16" height="20" x="4" y="2" rx="2" />
                  <path d="M16 2v20" />
                </svg>
                <span className="text-white font-semibold text-sm tracking-wide">notes</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-colors rounded-md p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="p-5">
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={handleChange}
                placeholder="what's on your mind?"
                className="w-full resize-none outline-none text-gray-700 text-sm leading-relaxed placeholder:text-gray-300"
                style={{
                  minHeight: '320px',
                  fontFamily: 'inherit',
                  background: 'transparent',
                  border: 'none',
                }}
                spellCheck
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

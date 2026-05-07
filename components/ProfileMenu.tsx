import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Palette, Check, Pencil, X, Heart, Activity } from 'lucide-react'
import { useTheme, type ThemeName } from '@/contexts/ThemeContext'
import React from 'react'
import { supabase } from '@/lib/supabase'
import { useSounds } from '@/hooks/useSounds'

interface ProfileMenuProps {
  user: any
  displayName: string
  onSignOut: () => void
  onSignIn: () => void
  onNameUpdate: (newName: string) => void
  showGratitude: boolean
  onToggleGratitude: () => void
  showHealth: boolean
  onToggleHealth: () => void
}

export function ProfileMenu({ user, displayName, onSignOut, onSignIn, onNameUpdate, showGratitude, onToggleGratitude, showHealth, onToggleHealth }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isEditingName, setIsEditingName] = React.useState(false)
  const [editedName, setEditedName] = React.useState(displayName)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const { currentTheme, theme, setTheme, availableThemes } = useTheme()
  const { playMenuOpen, playMenuClose } = useSounds()
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        playMenuClose()
        setIsOpen(false)
        setIsEditingName(false)
        setEditedName(displayName)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, displayName])
  
  React.useEffect(() => {
    setEditedName(displayName)
  }, [displayName])

  const handleSaveName = async () => {
    if (!editedName.trim() || !user) return
    if (!supabase) {
      setSaveError('Not connected')
      return
    }
    setSaveError(null)
    try {
      const trimmed = editedName.trim()

      const [{ error: profileError }, { error: authError }] = await Promise.all([
        supabase
          .from('user_profiles')
          .upsert({ id: user.id, display_name: trimmed }),
        supabase.auth.updateUser({
          data: { display_name: trimmed },
        }),
      ])

      if (profileError) throw profileError
      if (authError) throw authError

      onNameUpdate(trimmed)
      setIsEditingName(false)
    } catch (err: any) {
      console.error('Error updating name:', err)
      setSaveError(err.message || 'Failed to save')
    }
  }
  
  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditedName(displayName)
    setSaveError(null)
  }

  const getMenuClasses = () => {
    if (currentTheme === 'glass') {
      return `rounded-2xl bg-white/40 backdrop-blur-md border border-white/60`
    }
    if (currentTheme === 'neomorphic') {
      return `rounded-soft shadow-soft bg-soft-bg`
    }
    return `rounded-xl shadow-lg bg-white border border-gray-200`
  }

  const getMenuItemClasses = (isActive: boolean = false) => {
    if (currentTheme === 'glass') {
      return `px-4 py-3 hover:bg-white/30 transition-colors flex items-center gap-3 text-gray-700 ${
        isActive ? 'font-medium' : 'font-light'
      }`
    }
    if (currentTheme === 'neomorphic') {
      return `px-4 py-3 hover:bg-soft-light transition-colors flex items-center gap-3 text-soft-dark ${
        isActive ? 'font-medium' : 'font-light'
      }`
    }
    return `px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700 ${
      isActive ? 'font-medium' : ''
    }`
  }

  return (
    <div ref={menuRef} className="relative">
      <div 
        onClick={() => {
          if (user) {
            if (isOpen) { playMenuClose(); setIsOpen(false) }
            else { playMenuOpen(); setIsOpen(true) }
          } else {
            onSignIn()
          }
        }}
        className="cursor-pointer transition-opacity hover:opacity-80"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
          <path
            d="M12 2 Q14 10 22 12 Q14 14 12 22 Q10 14 2 12 Q10 10 12 2Z"
            fill="#0b268c"
          />
        </svg>
      </div>

      <AnimatePresence>
        {isOpen && user && (
          <div className={`absolute ${currentTheme === 'neomorphic' ? 'top-10 -right-6 p-8' : currentTheme === 'glass' ? 'top-10 -right-6 p-6' : 'top-10 right-0'} z-[10000]`}>
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`w-64 ${currentTheme === 'neomorphic' || currentTheme === 'glass' ? '' : 'overflow-hidden'} ${getMenuClasses()}`}
            >
            <div className={`px-4 py-3 border-b ${currentTheme === 'glass' ? 'border-white/40' : currentTheme === 'neomorphic' ? 'border-soft-light' : 'border-gray-200'}`}>
              <div className="mb-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Display Name</label>
              </div>
              {isEditingName ? (
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => { setEditedName(e.target.value); setSaveError(null) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Save"
                    >
                      <Check className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  {saveError && (
                    <p className="mt-1 text-xs text-red-500">{saveError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium ${currentTheme === 'glass' ? 'text-gray-800' : currentTheme === 'neomorphic' ? 'text-soft-dark' : 'text-gray-900'}`}>
                      {displayName || 'User'}
                    </p>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className={`text-xs ${currentTheme === 'glass' ? 'text-gray-600' : currentTheme === 'neomorphic' ? 'text-soft-mid' : 'text-gray-500'}`}>
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            <div className={`py-2 border-b ${currentTheme === 'glass' ? 'border-white/40' : currentTheme === 'neomorphic' ? 'border-soft-light' : 'border-gray-200'}`}>
              <button
                onClick={() => { onToggleGratitude(); setIsOpen(false) }}
                className={`w-full ${getMenuItemClasses(showGratitude)}`}
              >
                <Heart className="w-4 h-4" />
                <span className="flex-1 text-left text-sm">Gratitude Tracker</span>
                {showGratitude && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => { onToggleHealth(); setIsOpen(false) }}
                className={`w-full ${getMenuItemClasses(showHealth)}`}
              >
                <Activity className="w-4 h-4" />
                <span className="flex-1 text-left text-sm">Health Tracker</span>
                {showHealth && <Check className="w-4 h-4" />}
              </button>
            </div>

            <div className={`py-2 border-b ${currentTheme === 'glass' ? 'border-white/40' : currentTheme === 'neomorphic' ? 'border-soft-light' : 'border-gray-200'}`}>
              <div className={`px-4 py-2 text-xs font-medium uppercase tracking-wide ${
                currentTheme === 'glass' ? 'text-gray-600' : currentTheme === 'neomorphic' ? 'text-soft-mid' : 'text-gray-500'
              }`}>
                <Palette className="inline w-3 h-3 mr-2" />
                Theme
              </div>
              {availableThemes.map((themeName) => {
                const { themes } = require('@/contexts/ThemeContext')
                const themeConfig = themes[themeName]
                return (
                  <button
                    key={themeName}
                    onClick={() => {
                      setTheme(themeName)
                      setIsOpen(false)
                    }}
                    className={`w-full ${getMenuItemClasses(currentTheme === themeName)}`}
                  >
                    <span className="flex-1 text-left text-sm">{themeConfig.displayName}</span>
                    {currentTheme === themeName && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  playMenuClose()
                  onSignOut()
                  setIsOpen(false)
                }}
                className={`w-full ${getMenuItemClasses()}`}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

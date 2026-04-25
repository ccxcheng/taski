import { useCallback } from 'react'

const selectSounds = [
  '/button.wav',
  '/select 2.wav',
  '/select 3.wav',
  '/select 4.wav',
  '/select 6.wav',
  '/select 7.wav',
  '/select 8.wav',
]

const taskDoneSounds = [
  '/task done.wav',
  '/task done 2.wav',
  '/task done 3.wav',
  '/task done 4.wav',
  '/task done 5.wav',
  '/task done 6.wav',
  '/task done 7.wav',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function play(src: string, volume = 1) {
  try {
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  } catch {}
}

export function useSounds() {
  const playButton = useCallback(() => {
    play(pick(selectSounds), 0.55)
  }, [])

  const playTaskDone = useCallback(() => {
    play(pick(taskDoneSounds), 0.7)
  }, [])

  const playConfetti = useCallback(() => {
    play('/confetti.wav', 0.8)
  }, [])

  const playStickyNote = useCallback(() => {
    play('/sticky note.wav', 0.7)
  }, [])

  const playTabOpen = useCallback(() => {
    play('/menu open.wav', 0.6)
  }, [])

  const playMenuOpen = useCallback(() => {
    play('/menu open.wav', 0.6)
  }, [])

  const playMenuClose = useCallback(() => {
    play('/close.wav', 0.6)
  }, [])

  const playCalendar = useCallback(() => {
    play('/tab open.wav', 0.45)
  }, [])

  const playClose = useCallback(() => {
    play('/close.wav', 0.6)
  }, [])

  const playBoop = useCallback(() => {
    play('/boop.mp3', 0.7)
  }, [])

  return {
    playButton,
    playTaskDone,
    playConfetti,
    playStickyNote,
    playTabOpen,
    playMenuOpen,
    playMenuClose,
    playCalendar,
    playClose,
    playBoop,
  }
}

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useSounds } from '@/hooks/useSounds'

interface SillyCatProps {
  completedToday: number
  totalHabits: number
  onDoubleClick?: () => void
}

const CLICK_MESSAGES = [
  'meow!',
  ':3',
  'do your work!!',
  'you got this!',
  'zzz',
  'hehehe',
  'stop that!'
]

const COMPLETION_MESSAGES = [
  'good job!',
  'yay!',
  'nice work!',
  'keep going!',
  'proud of you!',
  'amazing! :3'
]

const TIME_MESSAGES: { [key: number]: string[] } = {
  0: ['midnight!!', 'go to bed... zzz', 'it is so late :3'],
  1: ['still awake?', 'night owl moment', 'shhh... quiet hours'],
  2: ['2am brain is lying to you', 'close the tabs...', 'sleep pls zzz'],
  3: ['if you are reading this... go eep', '3am gremlin time', 'zzzzzz'],
  4: ['early bird? or no sleep?', 'tiny nap time?', 'be gentle with yourself'],
  5: ['the sun is thinking about it', 'wake up slowly~', 'good morning (kinda)!'],
  6: ['good morning!', 'new day loading...', 'stretchy stretch :3'],
  7: ['breakfast time!', 'go eat something yummy', 'fuel up!!'],
  8: ['focus time!', 'one small step at a time', 'you can do it! :3'],
  9: ['check your posture!', 'shoulders down, breathe', 'tiny reset moment'],
  10: ['good morning!', 'rise and shine!', 'new day! :3'],
  11: ['drink some water!', 'stay hydrated!', 'water break time!'],
  12: ['lunch time!', 'time to eat!', 'feed me too! :3'],
  13: ['ok back to it~', 'do one easy task first', 'you got this!!'],
  14: ['afternoon slump?', 'stretch time!', 'remember to move!'],
  15: ['eyes off screen for a sec', 'blink blink!', 'little break? :3'],
  16: ['you are still here!!', 'proud of you', 'keep it going~'],
  17: ['get up and stretch!', 'move around!', 'stretch break!'],
  18: ['dinner soon?', 'eat something real!', 'no crumbs in keyboard :3'],
  19: ['evening check-in!', 'how are we doing?', 'tiny tidy time~'],
  20: ['evening time~', 'almost done!', 'wrap it up soon!'],
  21: ['wind down a bit', 'save and close some things', 'you did enough today :3'],
  22: ['night mode time', 'dim the lights~', 'cozy hours!!'],
  23: ['time to get ready for bed!', 'sleep soon!', 'bedtime! zzz']
}

export const SillyCat = ({ completedToday, totalHabits, onDoubleClick }: SillyCatProps) => {
  const { playBoop } = useSounds()
  const [showHappyAnimation, setShowHappyAnimation] = useState(false)
  const [position, setPosition] = useState(0)
  const [direction, setDirection] = useState(1)
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false)
  const lastCompletedCountRef = useRef(0)
  const [showSpeechBubble, setShowSpeechBubble] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [lastHourChecked, setLastHourChecked] = useState(-1)
  const isInitialLoadRef = useRef(true)

  const completionRate = totalHabits > 0 ? completedToday / totalHabits : 0
  const shouldBeHappy = completionRate >= 1

  // Mark as not initial load after mount (ref avoids stale closure issues)
  useEffect(() => {
    const timer = setTimeout(() => { isInitialLoadRef.current = false }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Show random message helper
  const showMessage = (message: string) => {
    if (isInitialLoadRef.current) return
    setCurrentMessage(message)
    setShowSpeechBubble(true)
    setTimeout(() => setShowSpeechBubble(false), 1200)
  }

  // Handle cat click
  const handleCatClick = () => {
    playBoop()
    setShowHappyAnimation(true)
    setTimeout(() => setShowHappyAnimation(false), 700)
    
    const randomMessage = CLICK_MESSAGES[Math.floor(Math.random() * CLICK_MESSAGES.length)]
    showMessage(randomMessage)
  }

  // Check for time-based messages
  useEffect(() => {
    const checkTimeMessages = () => {
      if (isInitialLoadRef.current) return
      
      const currentHour = new Date().getHours()
      
      if (currentHour !== lastHourChecked && TIME_MESSAGES[currentHour]) {
        // 30% chance to show message when hour changes
        if (Math.random() < 0.3) {
          const messages = TIME_MESSAGES[currentHour]
          const randomMessage = messages[Math.floor(Math.random() * messages.length)]
          showMessage(randomMessage)
        }
        setLastHourChecked(currentHour)
      }
    }

    // Check every minute
    const interval = setInterval(checkTimeMessages, 60000)
    
    return () => clearInterval(interval)
  }, [lastHourChecked])

  // Show happy animation and confetti when all habits are completed
  useEffect(() => {
    if (shouldBeHappy && !hasTriggeredConfetti) {
      setShowHappyAnimation(true)
      setHasTriggeredConfetti(true)
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      
      // Don't set timeout - cat stays happy when all tasks complete
    }
  }, [completedToday, shouldBeHappy, hasTriggeredConfetti])

  // Show happy animation when any task is completed (but not when all tasks are complete)
  useEffect(() => {
    if (completedToday > lastCompletedCountRef.current && !shouldBeHappy) {
      lastCompletedCountRef.current = completedToday
      setShowHappyAnimation(true)
      if (Math.random() < 0.5) {
        const randomMessage = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
        showMessage(randomMessage)
      }
      setTimeout(() => setShowHappyAnimation(false), 700)
    }
    if (!shouldBeHappy && completedToday < lastCompletedCountRef.current) {
      // habits were un-completed or reset — sync the ref down
      lastCompletedCountRef.current = completedToday
    }
  }, [completedToday, shouldBeHappy])

  // Reset confetti trigger when habits are incomplete
  useEffect(() => {
    if (!shouldBeHappy) {
      setHasTriggeredConfetti(false)
    }
  }, [shouldBeHappy])

  // Simple movement animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = prev + direction * 0.5
        if (newPos > 20 || newPos < -20) {
          setDirection(-direction)
          return prev
        }
        return newPos
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [direction])

  return (
    <motion.div
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-50"
      animate={{ x: position }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none"
          >
            <div className="speech-bubble px-3 py-1.5 whitespace-nowrap">
              <p className="text-xs sm:text-sm font-medium text-gray-800">{currentMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        onClick={handleCatClick}
        onDoubleClick={onDoubleClick}
        animate={{ 
          scale: showHappyAnimation ? [1, 1.1, 1] : 1,
          rotate: showHappyAnimation ? [0, 5, -5, 0] : 0,
          y: showHappyAnimation ? [0, -3, 0] : 0
        }}
        transition={{ 
          duration: showHappyAnimation ? 0.3 : 0.5, 
          repeat: showHappyAnimation ? 0 : 0,
          repeatDelay: 0
        }}
        className="cursor-pointer select-none"
        title={shouldBeHappy ? "Yay! All habits completed! 🎉" : "Click me or complete your habits to make me happy! 😸"}
      >
        <img 
          src={shouldBeHappy || showHappyAnimation ? "/sleepycat-awake.png" : "/sleepycat.png"} 
          alt="Silly Cat"
          width="40"
          height="40"
          className="pointer-events-none w-10 h-10 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]"
        />
      </motion.div>
    </motion.div>
  )
}

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface WeekArrowsProps {
  onPrevious: () => void
  onNext: () => void
  canGoPrevious?: boolean
  canGoNext?: boolean
}

export const WeekArrows = ({ onPrevious, onNext, canGoPrevious = true, canGoNext = true }: WeekArrowsProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-md">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </motion.div>
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
} 
import { formatWeekRange, isCurrentWeek } from '@/utils/dateUtils'
import { motion } from 'framer-motion'

interface WeekDisplayProps {
  currentWeekDate: Date
  isCurrentWeek: boolean
}

export const WeekDisplay = ({ currentWeekDate, isCurrentWeek }: WeekDisplayProps) => {
  const weekRange = formatWeekRange(currentWeekDate)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-700 lowercase px-2">
        {weekRange}
      </h3>
    </motion.div>
  )
} 
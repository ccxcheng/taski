import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { Activity, Award } from 'lucide-react'
import { getAllWeekData } from '@/utils/storageUtils'
import { getWeekStart } from '@/utils/dateUtils'

interface HabitAnalyticsProps {
  habits?: Array<{
    id: string
    name: string
    completed: ("completed" | "skipped" | false)[]
  }>
}

export function HabitAnalytics({ habits }: HabitAnalyticsProps) {
  const analytics = useMemo(() => {
    if (!habits || habits.length === 0) {
      return {
        avgThisWeek: 0,
        avgLastWeek: 0,
        habitBreakdown: [],
        heatmapByDay: [],
        weeklyData: []
      }
    }

    const today = new Date()
    const allWeekData = getAllWeekData()
    
    const weeks = []
    for (let i = 51; i >= 0; i--) {
      const weekDate = subDays(today, i * 7)
      const weekStart = getWeekStart(weekDate)
      weeks.push(weekStart)
    }
    
    const weeklyData = []
    const currentWeekStart = getWeekStart(today)
    
    for (let i = 7; i >= 0; i--) {
      const weekDate = subDays(today, i * 7)
      const weekStart = getWeekStart(weekDate)
      const weekKey = weekStart.toISOString().split('T')[0]
      const isCurrentWeek = weekKey === currentWeekStart.toISOString().split('T')[0]
      
      let weekCompletion = 0
      
      if (isCurrentWeek && habits && habits.length > 0) {
        const totalPossible = habits.length * 7
        let completed = 0
        habits.forEach(habit => {
          if (habit.completed) {
            completed += habit.completed.filter(c => c === 'completed').length
          }
        })
        weekCompletion = totalPossible > 0 ? (completed / totalPossible) * 100 : 0
      } else {
        const weekData = allWeekData[weekKey]
        if (weekData && weekData.habits && weekData.habits.length > 0) {
          const totalPossible = weekData.habits.length * 7
          let completed = 0
          weekData.habits.forEach(habit => {
            if (habit.completed) {
              completed += habit.completed.filter(c => c === 'completed').length
            }
          })
          weekCompletion = totalPossible > 0 ? (completed / totalPossible) * 100 : 0
        }
      }
      
      weeklyData.push({
        week: 8 - i,
        completion: Math.round(weekCompletion),
        isCurrentWeek: isCurrentWeek
      })
    }
    
    const heatmapByDay = []
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const weekCompletions = weeks.map((weekStart) => {
        const weekKey = weekStart.toISOString().split('T')[0]
        const weekData = allWeekData[weekKey]
        
        const actualDate = new Date(weekStart)
        actualDate.setDate(weekStart.getDate() + dayIndex)
        
        if (!weekData || !weekData.habits) return { completion: 0, date: actualDate }
        
        let completedCount = 0
        let totalCount = 0
        
        weekData.habits.forEach(habit => {
          if (habit.completed && habit.completed[dayIndex]) {
            if (habit.completed[dayIndex] === 'completed') completedCount++
            totalCount++
          }
        })
        
        const completion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        
        return { 
          completion, 
          date: actualDate
        }
      })
      
      heatmapByDay.push({
        day: dayNames[dayIndex],
        weeks: weekCompletions
      })
    }
    
    const currentWeekData = weeklyData[weeklyData.length - 1]
    const lastWeekData = weeklyData[weeklyData.length - 2]
    
    const habitBreakdown = habits.map(habit => {
      const completed = habit.completed.filter(c => c === 'completed').length
      return {
        name: habit.name,
        completion: Math.round((completed / 7) * 100),
        completed,
        total: 7
      }
    }).sort((a, b) => b.completion - a.completion)
    
    return {
      avgThisWeek: currentWeekData?.completion || 0,
      avgLastWeek: lastWeekData?.completion || 0,
      habitBreakdown,
      heatmapByDay,
      weeklyData
    }
  }, [habits])
  
  const { avgThisWeek, avgLastWeek, habitBreakdown, heatmapByDay, weeklyData } = analytics
  const percentChange = avgLastWeek > 0 ? ((avgThisWeek - avgLastWeek) / avgLastWeek) * 100 : 0
  
  const getHeatColor = (completion: number) => {
    if (completion === 0) return 'bg-gray-100'
    if (completion < 20) return 'bg-[#0b268c]/20'
    if (completion < 40) return 'bg-[#0b268c]/35'
    if (completion < 60) return 'bg-[#0b268c]/50'
    if (completion < 80) return 'bg-[#0b268c]/70'
    if (completion < 100) return 'bg-[#0b268c]/85'
    return 'bg-[#0b268c]'
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <p className="text-sm text-gray-700 font-medium">Avg this week</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgThisWeek}<span className="text-lg font-normal">%</span></p>
          {percentChange !== 0 && (
            <p className={`text-sm font-medium mt-1 ${percentChange > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(0)}% vs last week
            </p>
          )}
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Habits completed</p>
            <p className="text-2xl font-bold text-gray-900">
              {habitBreakdown.reduce((sum, h) => sum + h.completed, 0)}
              <span className="text-sm font-normal text-gray-500"> / {habitBreakdown.length * 7}</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Last 8 weeks</h4>
          <p className="text-xs text-gray-500 mb-3">Weekly completion rate</p>
          
          <div className="flex items-end justify-between gap-1.5 h-24">
            {weeklyData.map((week) => {
              const height = Math.max(week.completion, 3)
              return (
                <div key={week.week} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '96px' }}>
                  <div className="w-full relative" style={{ height: '70px' }}>
                    <div className="w-full bg-gray-100 rounded-md absolute bottom-0 left-0" style={{ height: '70px' }}></div>
                    {week.completion > 0 && (
                      <div 
                        className="w-full rounded-md transition-all bg-[#0b268c] absolute bottom-0 left-0"
                        style={{ height: `${height}%`, maxHeight: '70px' }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    week.isCurrentWeek ? 'bg-gray-900 text-white' : 'text-gray-500'
                  }`}>
                    {week.week}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {habitBreakdown.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            This Week's Progress
          </h4>
          <div className="space-y-2.5">
            {habitBreakdown.map((habit, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate">{habit.name}</span>
                  <span className="text-xs font-bold text-gray-900">{habit.completion}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${habit.completion}%`,
                      backgroundColor: '#0b268c'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {heatmapByDay.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Year Overview</h4>
            <p className="text-xs text-gray-500 mt-0.5">Daily completion rate across all habits</p>
          </div>
          <div>
            <div className="space-y-[3px]">
              {heatmapByDay.map((dayData) => (
                <div key={dayData.day} className="flex gap-[3px]">
                  {dayData.weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className={`w-[10px] h-[10px] rounded-[2px] ${getHeatColor(week.completion)} transition-all hover:ring-1 hover:ring-[#0b268c] hover:scale-125 cursor-pointer`}
                      title={`${format(week.date, 'MMM dd, yyyy')}: ${week.completion}% complete`}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[10px] text-gray-500 font-medium">Less</span>
              <div className="flex gap-[2px]">
                <div className="w-[10px] h-[10px] bg-gray-100 rounded-[2px] border border-gray-200"></div>
                <div className="w-[10px] h-[10px] bg-[#0b268c]/20 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-[#0b268c]/35 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-[#0b268c]/50 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-[#0b268c]/70 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-[#0b268c]/85 rounded-[2px]"></div>
                <div className="w-[10px] h-[10px] bg-[#0b268c] rounded-[2px]"></div>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

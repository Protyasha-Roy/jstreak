import { format, eachDayOfInterval, isSameDay, getYear, getDate } from 'date-fns'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface HeatmapProps {
  data: Array<{
    date: Date
    wordCount: number
  }>
  colorScheme?: Record<string, string>
  onDateClick?: (date: Date) => void
}

const defaultColorScheme: Record<string, string> = {
  '1': 'bg-[#FF1493] text-white',    // January - Deep Pink
  '2': 'bg-[#FF4500] text-white',    // February - Orange Red
  '3': 'bg-[#9400D3] text-white',    // March - Dark Violet
  '4': 'bg-[#00FF00] text-white',    // April - Lime
  '5': 'bg-[#1E90FF] text-white',    // May - Dodger Blue
  '6': 'bg-[#FFD700] text-white',    // June - Gold
  '7': 'bg-[#FF69B4] text-white',    // July - Hot Pink
  '8': 'bg-[#32CD32] text-white',    // August - Lime Green
  '9': 'bg-[#FF8C00] text-white',    // September - Dark Orange
  '10': 'bg-[#8A2BE2] text-white',   // October - Blue Violet
  '11': 'bg-[#00BFFF] text-white',   // November - Deep Sky Blue
  '12': 'bg-[#FF0000] text-white',   // December - Red
}

const intensityClasses: Record<number, string> = {
  0: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  1: 'opacity-60',
  2: 'opacity-70',
  3: 'opacity-80',
  4: 'opacity-90',
  5: 'opacity-100'
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function Heatmap({ data, colorScheme = defaultColorScheme, onDateClick }: HeatmapProps) {
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()))
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const getDaysForMonth = (year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const firstDayOfMonth = startDate.getDay()
    
    // Add empty days at the start to align with weekday
    const emptyDays = Array(firstDayOfMonth).fill(null)
    return [...emptyDays, ...days]
  }

  const getIntensity = (wordCount: number): number => {
    if (!wordCount) return 0
    if (wordCount <= 100) return 1
    if (wordCount <= 300) return 2
    if (wordCount <= 600) return 3
    if (wordCount <= 1000) return 4
    return 5
  }

  const handleYearChange = (increment: number) => {
    setDirection(increment > 0 ? 'right' : 'left')
    setIsAnimating(true)
    setSelectedYear(prev => prev + increment)
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleYearChange(-1)}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">{selectedYear}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleYearChange(1)}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-1 transition-all duration-500 md:gap-2",
          direction === 'left' && isAnimating && "-translate-x-full opacity-0",
          direction === 'right' && isAnimating && "translate-x-full opacity-0",
          !isAnimating && "translate-x-0 opacity-100"
        )}
        onTransitionEnd={() => {
          setIsAnimating(false)
          setDirection(null)
        }}
      >
        <div className="grid grid-cols-2 gap-0.5 md:grid-cols-3 md:gap-1">
          {months.map(monthNum => (
            <div key={monthNum} className="space-y-0.5">
              <div className="flex items-center gap-2 pl-0.5">
                <h4 className="text-[8px] md:text-[9px] font-medium text-foreground">
                  {format(new Date(selectedYear, monthNum - 1), 'MMM')}
                </h4>
                <div className={cn('w-1 h-1 md:w-1.5 md:h-1.5 rounded-sm', colorScheme[monthNum.toString()])} />
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((day, i) => (
                  <div key={i} className="text-[6px] text-center text-muted-foreground font-medium w-2.5 h-2.5 md:w-3.5 md:h-3.5 flex items-center justify-center">
                    {day}
                  </div>
                ))}
                {getDaysForMonth(selectedYear, monthNum).map((day, index) => {
                  if (!day) return <div key={`empty-${monthNum}-${index}`} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                  
                  const entryForDate = data.find(entry => 
                    isSameDay(new Date(entry.date), day)
                  )
                  const intensity = entryForDate ? getIntensity(entryForDate.wordCount) : 0

                  return (
                    <TooltipProvider key={day.toISOString()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              if (day <= today) {
                                onDateClick?.(day)
                              }
                            }}
                            className={cn(
                              'w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-[1px] transition-all text-[6px] md:text-[7px] flex items-center justify-center',
                              intensity > 0 ? colorScheme[monthNum.toString()] : 'bg-gray-50 dark:bg-black/50',
                              intensity > 0 ? intensityClasses[intensity] : intensityClasses[0],
                              day.getTime() > new Date().getTime() ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
                            )}
                          >
                            <span className="flex items-center justify-center w-full h-full">
                              {getDate(day)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-2 text-xs">
                          <div className="space-y-1">
                            <p className="font-medium">{format(day, 'MMM d, yyyy')}</p>
                            {entryForDate && (
                              <p className="text-muted-foreground">
                                {entryForDate.wordCount} words
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

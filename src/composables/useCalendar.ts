import { ref, computed } from 'vue'

export function useCalendar() {
  const currentDate = ref(new Date())

  // Generate calendar days for a month
  const generateMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    
    // Pad beginning of month with previous month's days
    const startingDay = firstDay.getDay()
    for (let i = 0; i < startingDay; i++) {
      const prevMonthDay = new Date(year, month, -startingDay + i + 1)
      days.push({ 
        date: prevMonthDay, 
        isCurrentMonth: false 
      })
    }
    
    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDay = new Date(year, month, i)
      days.push({ 
        date: currentDay, 
        isCurrentMonth: true 
      })
    }
    
    // Pad end of month with next month's days
    const remainingCells = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i)
      days.push({ 
        date: nextMonthDay, 
        isCurrentMonth: false 
      })
    }
    
    return days
  }

  const monthDays = computed(() => generateMonthDays(currentDate.value))

  // Group days into weeks
  const monthWeeks = computed(() => {
    const weeks = []
    for (let i = 0; i < monthDays.value.length; i += 7) {
      weeks.push(monthDays.value.slice(i, i + 7))
    }
    return weeks
  })

  const goToPrevMonth = () => {
    currentDate.value = new Date(
      currentDate.value.getFullYear(), 
      currentDate.value.getMonth() - 1, 
      1
    )
  }

  const goToNextMonth = () => {
    currentDate.value = new Date(
      currentDate.value.getFullYear(), 
      currentDate.value.getMonth() + 1, 
      1
    )
  }

  return {
    currentDate,
    monthDays,
    monthWeeks,
    goToPrevMonth,
    goToNextMonth
  }
}
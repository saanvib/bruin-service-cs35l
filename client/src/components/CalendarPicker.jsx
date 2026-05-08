import { useState } from 'react'
import './CalendarPicker.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getCalendarDays(firstOfMonth) {
  const year = firstOfMonth.getFullYear()
  const month = firstOfMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks = []
  let week = new Array(firstOfMonth.getDay()).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(new Date(year, month, d))
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function formatDate(day) {
  const yyyy = day.getFullYear()
  const mm = String(day.getMonth() + 1).padStart(2, '0')
  const dd = String(day.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Returns the CSS class names for a given day cell
function getDayClassName(day, today, oneMonthOut, selectedDate) {
  if (!day) return 'calendar-day empty'

  const classes = ['calendar-day']

  if (day < today) {
    classes.push('past')
  } else if (selectedDate === formatDate(day)) {
    classes.push('selected')
  } else if (day.getTime() === today.getTime()) {
    classes.push('today')
  } else if (day > oneMonthOut) {
    classes.push('beyond')
  }

  return classes.join(' ')
}

export default function CalendarPicker({ selectedDate, onSelectDate }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const oneMonthOut = new Date(today)
  oneMonthOut.setMonth(oneMonthOut.getMonth() + 1)

  const [viewedMonth, setViewedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [outOfRangeMsg, setOutOfRangeMsg] = useState('')

  const weeks = getCalendarDays(viewedMonth)

  const isCurrentMonth =
    viewedMonth.getFullYear() === today.getFullYear() &&
    viewedMonth.getMonth() === today.getMonth()

  function goToPrevMonth() {
    if (isCurrentMonth) return
    setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1))
  }

  function handleDayClick(day) {
    if (!day) return
    if (day < today) return // past: silently ignore

    if (day > oneMonthOut) {
      setOutOfRangeMsg('Bookings are only available within the next month.')
      return
    }

    setOutOfRangeMsg('')
    onSelectDate(formatDate(day))
  }

  const monthLabel = viewedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="calendar-header">
        <button onClick={goToPrevMonth} disabled={isCurrentMonth} aria-label="Previous month">
          &lt;
        </button>
        <h3>{monthLabel}</h3>
        <button onClick={goToNextMonth} aria-label="Next month">
          &gt;
        </button>
      </div>

      <div className="calendar-grid">
        {DAYS.map(d => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}

        {weeks.flat().map((day, i) => (
          <div
            key={i}
            className={getDayClassName(day, today, oneMonthOut, selectedDate)}
            onClick={() => handleDayClick(day)}
          >
            {day ? day.getDate() : ''}
          </div>
        ))}
      </div>

      {outOfRangeMsg && (
        <p className="calendar-out-of-range-msg">{outOfRangeMsg}</p>
      )}
    </div>
  )
}
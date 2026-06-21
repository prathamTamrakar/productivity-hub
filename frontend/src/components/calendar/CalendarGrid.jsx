import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format } from 'date-fns';
import DayCell from './DayCell';

const CalendarGrid = ({ currentDate, tasks, onDayClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'd';
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();

  return (
    <div className="calendar-grid-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)' }}>
        {weekDays.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const dayTasks = tasks.filter(t => t.date === format(day, 'yyyy-MM-dd'));
          // Sort day tasks by time
          dayTasks.sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
          });

          return (
            <DayCell
              key={day.toString()}
              date={day}
              tasks={dayTasks}
              isCurrentMonth={isSameMonth(day, monthStart)}
              isToday={isSameDay(day, today)}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;

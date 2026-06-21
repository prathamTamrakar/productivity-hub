import React from 'react';
import { format } from 'date-fns';

const DayCell = ({ date, tasks, isCurrentMonth, isToday, onClick }) => {
  const visibleTasks = tasks.slice(0, 3);
  const remainingCount = tasks.length - 3;

  return (
    <div 
      className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
      onClick={() => onClick(date)}
    >
      <div className="calendar-day-number">
        {format(date, 'd')}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {visibleTasks.map((task) => (
          <div key={task.id} className={`task-pill ${task.priority}`}>
            {task.time && <span style={{ opacity: 0.8, marginRight: '4px' }}>{task.time}</span>}
            {task.title}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="task-pill" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
            + {remainingCount} more
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCell;

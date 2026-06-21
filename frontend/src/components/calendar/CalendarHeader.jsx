import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../common/Button';

const CalendarHeader = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  currentView,
  onViewChange,
  onAddTask
}) => {
  return (
    <div className="calendar-header-bar">
      <div className="calendar-nav">
        <h2 className="calendar-title">{format(currentDate, 'MMMM yyyy')}</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={onPrevMonth} />
          <Button variant="ghost" size="sm" onClick={onToday}>Today</Button>
          <Button variant="ghost" size="sm" icon={ChevronRight} onClick={onNextMonth} />
        </div>
      </div>
      
      <div className="calendar-actions">
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '2px', borderRadius: 'var(--radius-md)', gap: '2px' }}>
          <Button 
            variant={currentView === 'month' ? 'secondary' : 'ghost'} 
            size="sm" 
            icon={CalendarIcon}
            onClick={() => onViewChange('month')}
          >
            Month
          </Button>
          <Button 
            variant={currentView === 'week' ? 'secondary' : 'ghost'} 
            size="sm" 
            icon={ListIcon}
            onClick={() => onViewChange('week')}
          >
            Week
          </Button>
          <Button 
            variant={currentView === 'day' ? 'secondary' : 'ghost'} 
            size="sm" 
            icon={Maximize2}
            onClick={() => onViewChange('day')}
          >
            Day
          </Button>
        </div>
        <Button variant="primary" size="sm" onClick={onAddTask}>
          + Add Task
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;

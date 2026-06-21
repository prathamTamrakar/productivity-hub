import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import api from '../api/client';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import TaskForm from '../components/calendar/TaskForm';
import DayView from '../components/calendar/DayView';
import './pages.css';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // month, week, day
  const [tasks, setTasks] = useState([]);
  
  // Modals state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasksForMonth(currentDate);
  }, [currentDate]);

  const fetchTasksForMonth = async (date) => {
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const res = await api.get(`/api/tasks?month=${month}&year=${year}`);
      setTasks(res.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error(error);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setIsDayViewOpen(true);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleTaskSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.id}`, taskData);
        toast.success('Task updated');
      } else {
        await api.post('/api/tasks', taskData);
        toast.success('Task created');
      }
      setIsTaskFormOpen(false);
      fetchTasksForMonth(currentDate);
      
      // If we just added/edited a task for the currently viewed day, update that view's tasks implicitly by fetching
      if (isDayViewOpen && taskData.date !== format(selectedDate, 'yyyy-MM-dd')) {
        // Just note that day view might show stale data for a split second, handled by global refetch
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save task');
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchTasksForMonth(currentDate);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasksForMonth(currentDate);
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
    // Don't close DayView so when form closes, they are back in DayView
  };

  const tasksForSelectedDate = tasks.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <motion.div className="calendar-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <CalendarHeader 
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddTask={handleAddTask}
      />
      
      {currentView === 'month' && (
        <CalendarGrid 
          currentDate={currentDate} 
          tasks={tasks} 
          onDayClick={handleDayClick} 
        />
      )}
      
      {currentView === 'week' && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Week view coming soon...
        </div>
      )}

      {currentView === 'day' && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please use the Month view and click on a day to see its details.
        </div>
      )}

      <TaskForm 
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        selectedDate={selectedDate}
      />

      <DayView
        isOpen={isDayViewOpen}
        onClose={() => setIsDayViewOpen(false)}
        date={selectedDate}
        tasks={tasksForSelectedDate}
        onTaskClick={openEditTask}
        onStatusChange={handleTaskStatusChange}
        onDelete={handleTaskDelete}
      />
    </motion.div>
  );
};

export default CalendarPage;

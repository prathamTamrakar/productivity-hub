import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

const TaskForm = ({ isOpen, onClose, onSubmit, task, selectedDate }) => {
  const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: defaultDate,
    time: '',
    priority: 'medium',
    category: 'Personal',
    status: 'pending',
    is_important: false,
    notify_email: false,
    reminder_offset: 60
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        date: task.date || defaultDate,
        time: task.time || '',
        priority: task.priority || 'medium',
        category: task.category || 'Personal',
        status: task.status || 'pending',
        is_important: task.is_important || false,
        notify_email: task.notify_email || false,
        reminder_offset: task.reminder_offset || 60
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: defaultDate,
        time: '',
        priority: 'medium',
        category: 'Personal',
        status: 'pending',
        is_important: false,
        notify_email: false,
        reminder_offset: 60
      });
    }
  }, [task, selectedDate, isOpen]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit}>{task ? 'Update Task' : 'Create Task'}</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} footer={footer}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input 
          label="Title" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          placeholder="What needs to be done?"
        />
        
        <div className="input-group">
          <label>Description</label>
          <textarea 
            className="input" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={3} 
            placeholder="Add details..."
          />
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              type="date" 
              label="Date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              type="time" 
              label="Time" 
              name="time" 
              value={formData.time} 
              onChange={handleChange} 
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Priority</label>
            <select className="select" name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="important">Important</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Category</label>
            <select className="select" name="category" value={formData.category} onChange={handleChange}>
              <option value="Personal">Personal</option>
              <option value="Job Search">Job Search</option>
              <option value="Study">Study</option>
              <option value="Project">Project</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="input-group">
          <label>Status</label>
          <select className="select" name="status" value={formData.status} onChange={handleChange}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="is_important" 
              checked={formData.is_important} 
              onChange={handleChange} 
            />
            <span style={{ fontSize: '14px' }}>Mark as Important (sends email reminder automatically)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="notify_email" 
              checked={formData.notify_email} 
              onChange={handleChange} 
            />
            <span style={{ fontSize: '14px' }}>Send Email Reminder</span>
          </label>
        </div>

        {(formData.notify_email || formData.is_important) && (
          <div className="input-group" style={{ marginTop: '8px' }}>
            <label>Reminder Timing (Before Due Time)</label>
            <select className="select" name="reminder_offset" value={formData.reminder_offset} onChange={handleChange}>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default TaskForm;

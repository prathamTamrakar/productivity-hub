import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, Pencil, Trash2, CalendarX2 } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';

const DayView = ({ date, tasks, onTaskClick, onStatusChange, onDelete, onClose, isOpen }) => {
  if (!isOpen) return null;
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tasks for ${format(date, 'MMMM d, yyyy')}`}>
      {sortedTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          <CalendarX2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No tasks scheduled for this day.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedTasks.map(task => (
            <div 
              key={task.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                padding: '16px', 
                background: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}
            >
              <button 
                onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)' }}
              >
                {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.6 : 1 }}>
                    {task.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onTaskClick(task)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Pencil size={16} /></button>
                    <button onClick={() => onDelete(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {task.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {task.time}
                    </div>
                  )}
                  <Badge size="sm" variant={task.priority === 'low' ? 'default' : task.priority === 'medium' ? 'medium' : task.priority === 'high' ? 'high' : 'important'}>
                    {task.priority}
                  </Badge>
                  <span style={{ opacity: 0.7 }}>{task.category}</span>
                </div>
                
                {task.description && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default DayView;

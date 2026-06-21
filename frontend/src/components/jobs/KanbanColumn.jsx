import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import JobCard from './JobCard';

const KanbanColumn = ({ status, title, jobs, onJobClick, color }) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div className="kanban-column">
      <div className="kanban-column-header" style={{ borderBottomColor: `var(--${color})` }}>
        <span>{title}</span>
        <span style={{ 
          background: 'var(--bg-secondary)', 
          padding: '2px 8px', 
          borderRadius: '12px', 
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          {jobs.length}
        </span>
      </div>
      
      <div ref={setNodeRef} className="kanban-column-content">
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => onJobClick(job)} />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            Drop applications here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

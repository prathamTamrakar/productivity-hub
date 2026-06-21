import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, DollarSign, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const JobCard = ({ job, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id, data: job });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`job-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
    >
      <div className="job-card-header">
        <div>
          <div className="job-card-title">{job.company}</div>
          <div className="job-card-role">{job.role}</div>
        </div>
        <div 
          {...attributes} 
          {...listeners}
          style={{ cursor: 'grab', color: 'var(--text-muted)', padding: '4px', margin: '-4px -4px 0 0' }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
      </div>
      
      <div className="job-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} />
          {format(parseISO(job.application_date), 'MMM d, yyyy')}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {job.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <MapPin size={12} />
              <span style={{ fontSize: '11px', textTransform: 'capitalize' }}>{job.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;

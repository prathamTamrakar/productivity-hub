import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay 
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import JobCard from './JobCard';

const COLUMNS = [
  { id: 'applied', title: 'Applied', color: 'primary' },
  { id: 'interview', title: 'Interviewing', color: 'warning' },
  { id: 'offer', title: 'Offer', color: 'success' },
  { id: 'rejected', title: 'Rejected', color: 'danger' }
];

const KanbanBoard = ({ jobs, onStatusChange, onJobClick }) => {
  const [activeJob, setActiveJob] = React.useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const job = jobs.find(j => j.id === active.id);
    setActiveJob(job);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveJob(null);
    
    if (!over) return;

    const jobId = active.id;
    // 'over.id' could be a column id or another job id.
    // If it's another job, we find its status. If it's a column, that's the status.
    const overId = over.id;
    const isOverAColumn = COLUMNS.some(c => c.id === overId);
    
    let newStatus = '';
    
    if (isOverAColumn) {
      newStatus = overId;
    } else {
      const overJob = jobs.find(j => j.id === overId);
      if (overJob) {
        newStatus = overJob.status;
      }
    }

    const activeJobData = jobs.find(j => j.id === jobId);
    
    if (activeJobData && activeJobData.status !== newStatus && newStatus) {
      onStatusChange(jobId, newStatus);
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn 
            key={col.id}
            status={col.id}
            title={col.title}
            color={col.color}
            jobs={jobs.filter(j => j.status === col.id)}
            onJobClick={onJobClick}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeJob ? (
          <div style={{ transform: 'rotate(3deg)', opacity: 0.8, boxShadow: 'var(--shadow-lg)' }}>
            <JobCard job={activeJob} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;

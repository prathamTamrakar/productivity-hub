import React from 'react';
import { format, parseISO } from 'date-fns';
import { ExternalLink, MapPin, DollarSign, Calendar, Clock, Pencil, Trash2, Building } from 'lucide-react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

const JobDetail = ({ job, isOpen, onClose, onEdit, onDelete }) => {
  if (!job || !isOpen) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'applied': return 'primary';
      case 'interview': return 'warning';
      case 'offer': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Close</Button>
      <Button variant="danger" icon={Trash2} onClick={() => {
        if(window.confirm('Are you sure you want to delete this application?')) {
          onDelete(job.id);
        }
      }}>Delete</Button>
      <Button variant="primary" icon={Pencil} onClick={() => onEdit(job)}>Edit</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Details" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>{job.company}</h2>
            <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>{job.role}</div>
          </div>
          <Badge variant={getStatusColor(job.status)}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied On</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{format(parseISO(job.application_date), 'MMMM d, yyyy')}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Job Type</div>
              <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{job.job_type?.replace('-', ' ') || 'Off campus'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Location</div>
              <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{job.location || 'N/A'}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Salary Range</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{job.salary_range || 'N/A'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--text-muted)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Follow-up Date</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                {job.follow_up_date ? format(parseISO(job.follow_up_date), 'MMMM d, yyyy') : 'None set'}
              </div>
            </div>
          </div>

        </div>

        {job.job_url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={16} color="var(--primary)" />
            <a href={job.job_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              View Original Job Posting
            </a>
          </div>
        )}

        {job.notes && (
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Notes</h4>
            <div style={{ 
              background: 'var(--bg-tertiary)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--text-secondary)'
            }}>
              {job.notes}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default JobDetail;

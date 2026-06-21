import React from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import Badge from '../common/Badge';

const JobTable = ({ jobs, onJobClick, onDelete }) => {
  if (jobs.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        No applications found matching your filters.
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'applied': return 'primary';
      case 'interview': return 'warning';
      case 'offer': return 'success';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Company</th>
              <th style={{ padding: '16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Role</th>
              <th style={{ padding: '16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Type</th>
              <th style={{ padding: '16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Date Applied</th>
              <th style={{ padding: '16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr 
                key={job.id} 
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => onJobClick(job)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '16px', fontWeight: 600 }}>{job.company}</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{job.role}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '12px', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {job.job_type?.replace('-', ' ') || 'Off campus'}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                  {format(parseISO(job.application_date), 'MMM d, yyyy')}
                </td>
                <td style={{ padding: '16px' }}>
                  <Badge size="sm" variant={getStatusColor(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onJobClick(job); }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', marginRight: '8px' }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(window.confirm('Delete this application?')) onDelete(job.id); 
                    }} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobTable;

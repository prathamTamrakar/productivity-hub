import React from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import Badge from '../common/Badge';

const JobTable = ({ jobs, onJobClick, onDelete }) => {
  if (jobs.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px' }}>
        No applications found matching your current filters.
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'applied': return 'important';
      case 'interview': return 'medium';
      case 'offer': return 'success';
      case 'rejected': return 'high';
      default: return 'default';
    }
  };

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Company</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Role</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Type</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Date Applied</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Status</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr 
                key={job.id} 
                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => onJobClick(job)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: '13px' }}>{job.company}</td>
                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '13px' }}>{job.role}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', textTransform: 'capitalize', border: '1px solid var(--border)' }}>
                    {job.job_type?.replace('-', ' ') || 'Off campus'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace' }}>
                  {format(parseISO(job.application_date), 'MMM d, yyyy')}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Badge size="sm" variant={getStatusColor(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
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

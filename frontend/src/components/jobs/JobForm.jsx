import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

const JobForm = ({ isOpen, onClose, onSubmit, job }) => {
  const defaultDate = format(new Date(), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    application_date: defaultDate,
    job_type: 'off-campus',
    job_url: '',
    location: '',
    salary_range: '',
    status: 'applied',
    notes: '',
    follow_up_date: ''
  });

  useEffect(() => {
    if (job) {
      setFormData({
        company: job.company || '',
        role: job.role || '',
        application_date: job.application_date || defaultDate,
        job_type: job.job_type || 'off-campus',
        job_url: job.job_url || '',
        location: job.location || '',
        salary_range: job.salary_range || '',
        status: job.status || 'applied',
        notes: job.notes || '',
        follow_up_date: job.follow_up_date || ''
      });
    } else {
      setFormData({
        company: '',
        role: '',
        application_date: defaultDate,
        job_type: 'off-campus',
        job_url: '',
        location: '',
        salary_range: '',
        status: 'applied',
        notes: '',
        follow_up_date: ''
      });
    }
  }, [job, isOpen]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit}>{job ? 'Update' : 'Add Application'}</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={job ? 'Edit Application' : 'New Application'} footer={footer}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              label="Company Name" 
              name="company" 
              value={formData.company} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Google"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              label="Role / Title" 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Frontend Engineer"
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Status</label>
            <select className="select" name="status" value={formData.status} onChange={handleChange}>
              <option value="applied">Applied</option>
              <option value="interview">Interviewing</option>
              <option value="offer">Offer Received</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              type="date" 
              label="Application Date" 
              name="application_date" 
              value={formData.application_date} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Job Type</label>
            <select className="select" name="job_type" value={formData.job_type} onChange={handleChange}>
              <option value="off-campus">Off-campus</option>
              <option value="on-campus">On-campus</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              label="Location (City or Remote)" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g. Bangalore, Remote..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input 
              label="Salary Range" 
              name="salary_range" 
              value={formData.salary_range} 
              onChange={handleChange} 
              placeholder="e.g. $120k - $150k"
            />
          </div>
        </div>

        <Input 
          type="url" 
          label="Job Posting URL" 
          name="job_url" 
          value={formData.job_url} 
          onChange={handleChange} 
          placeholder="https://..."
        />
        
        <div className="input-group">
          <label>Notes</label>
          <textarea 
            className="input" 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            rows={3} 
            placeholder="Interviewer names, thoughts, next steps..."
          />
        </div>
        
        <Input 
          type="date" 
          label="Follow-up Date (Optional - Will send email reminder)" 
          name="follow_up_date" 
          value={formData.follow_up_date} 
          onChange={handleChange} 
        />
      </form>
    </Modal>
  );
};

export default JobForm;

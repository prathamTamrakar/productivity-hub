import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Briefcase, CheckSquare, FileText, XOctagon, Search, Filter, Download, Upload } from 'lucide-react';
import api from '../api/client';
import StatCard from '../components/common/StatCard';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import KanbanBoard from '../components/jobs/KanbanBoard';
import JobTable from '../components/jobs/JobTable';
import JobForm from '../components/jobs/JobForm';
import JobDetail from '../components/jobs/JobDetail';
import Skeleton from '../components/common/Skeleton';
import './pages.css';
import './tooltip.css';

const JobTrackerPage = () => {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  
  // View Toggle
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [search, statusFilter, jobTypeFilter]);

  const fetchJobs = async () => {
    try {
      let url = '/api/jobs?';
      if (search) url += `search=${search}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (jobTypeFilter) url += `job_type=${jobTypeFilter}&`;
      
      const res = await api.get(url);
      setJobs(res.data);
    } catch (error) {
      toast.error('Failed to fetch jobs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/jobs/stats');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      // Optimistic update
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      
      await api.patch(`/api/jobs/${jobId}/status`, { status: newStatus });
      fetchStats(); // Update stats in background
    } catch (error) {
      toast.error('Failed to update status');
      fetchJobs(); // Revert on failure
    }
  };

  const handleJobSubmit = async (jobData) => {
    try {
      if (editingJob) {
        await api.put(`/api/jobs/${editingJob.id}`, jobData);
        toast.success('Application updated');
      } else {
        await api.post('/api/jobs', jobData);
        toast.success('Application added');
      }
      setIsFormOpen(false);
      fetchJobs();
      fetchStats();
      
      // Update selected job if detail is open
      if (isDetailOpen && selectedJob?.id === editingJob?.id) {
        setSelectedJob({ ...selectedJob, ...jobData });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save application');
    }
  };

  const handleDelete = async (jobId) => {
    try {
      await api.delete(`/api/jobs/${jobId}`);
      toast.success('Application deleted');
      setIsDetailOpen(false);
      fetchJobs();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete application');
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/api/jobs/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Pratham_Job_Tracker.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Excel exported successfully!');
    } catch (error) {
      toast.error('Failed to export jobs');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsImporting(true);
    try {
      const res = await api.post('/api/jobs/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Import successful');
      fetchJobs();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import Excel file');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div className="kanban-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="kanban-stats">
        {stats ? (
          <>
            <StatCard label="Total Applications" value={stats.total} icon={Briefcase} color="primary" />
            <StatCard label="Interviewing" value={stats.interview} icon={CheckSquare} color="warning" />
            <StatCard label="Offers" value={stats.offer} icon={FileText} color="success" />
            <StatCard label="Rejected" value={stats.rejected} icon={XOctagon} color="danger" />
          </>
        ) : (
          <>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </>
        )}
      </div>

      <div className="kanban-filters" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
          <button 
            onClick={() => setViewMode('kanban')}
            style={{ padding: '6px 16px', background: viewMode === 'kanban' ? 'var(--surface)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: viewMode === 'kanban' ? 600 : 500, transition: 'var(--transition)' }}
          >
            Kanban
          </button>
          <button 
            onClick={() => setViewMode('table')}
            style={{ padding: '6px 16px', background: viewMode === 'table' ? 'var(--surface)' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: viewMode === 'table' ? 600 : 500, transition: 'var(--transition)' }}
          >
            Table
          </button>
        </div>

        <div style={{ flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <Input 
            icon={Search} 
            placeholder="Search company or role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="input-group" style={{ width: '160px' }}>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ paddingLeft: '36px' }}>
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>

        <div className="input-group" style={{ width: '160px' }}>
          <select className="select" value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="on-campus">On-campus</option>
            <option value="off-campus">Off-campus</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx" 
            style={{ display: 'none' }} 
          />
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export
          </Button>
          <div className="tooltip-container">
            <Button 
              variant="secondary" 
              onClick={handleImportClick} 
              disabled={isImporting}
            >
              <Upload size={16} /> {isImporting ? 'Importing...' : 'Import'}
            </Button>
            <div className="tooltip-content" style={{ maxWidth: '350px' }}>
              <div style={{ marginBottom: '6px' }}><b>Supported Columns (any order):</b></div>
              <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'circle', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><b>Company, Role, Location, Salary, URL, Notes</b> (Text)</li>
                <li><b>Date / Follow-up</b> (MM/DD/YYYY)</li>
                <li><b>Status:</b> Applied, Interview, Offer, Rejected</li>
                <li><b>Type:</b> On-campus, Off-campus</li>
              </ul>
            </div>
          </div>
          <Button variant="primary" onClick={() => { setEditingJob(null); setIsFormOpen(true); }}>
            + New Application
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex: 1 }}><Skeleton height="100%" /></div>)}
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard 
          jobs={jobs} 
          onStatusChange={handleStatusChange} 
          onJobClick={(job) => {
            setSelectedJob(job);
            setIsDetailOpen(true);
          }}
        />
      ) : (
        <JobTable
          jobs={jobs}
          onJobClick={(job) => {
            setSelectedJob(job);
            setIsDetailOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      <JobForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleJobSubmit}
        job={editingJob}
      />

      <JobDetail 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        job={selectedJob}
        onDelete={handleDelete}
        onEdit={(job) => {
          setEditingJob(job);
          setIsFormOpen(true);
        }}
      />
    </motion.div>
  );
};

export default JobTrackerPage;

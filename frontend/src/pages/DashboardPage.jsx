import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, Briefcase, FileText, CheckSquare, XOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import Button from '../components/common/Button';
import './pages.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tasksData, setTasksData] = useState({ today: [], overdue: [] });
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [jobStats, setJobStats] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchTodayTasks();
    fetchUpcomingTasks();
    fetchJobStats();
  }, []);

  const fetchTodayTasks = async () => {
    try {
      const res = await api.get('/api/tasks/today');
      setTasksData(res.data);
    } catch (error) {
      console.error('Failed to fetch today tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchUpcomingTasks = async () => {
    try {
      const res = await api.get('/api/tasks/upcoming?limit=5');
      setUpcomingTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch upcoming tasks:', error);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const fetchJobStats = async () => {
    try {
      const res = await api.get('/api/jobs/stats');
      setJobStats(res.data);
    } catch (error) {
      console.error('Failed to fetch job stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleTaskStatusToggle = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await api.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchTodayTasks(); // Refresh
      fetchUpcomingTasks(); // Refresh
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const renderTaskItem = (task, isOverdue = false) => (
    <div 
      key={task.id} 
      style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '12px', 
        padding: '12px', 
        borderBottom: '1px solid var(--border)',
        backgroundColor: isOverdue ? 'var(--danger-light)' : 'transparent',
        borderRadius: isOverdue ? 'var(--radius-md)' : 0
      }}
    >
      <button 
        onClick={() => handleTaskStatusToggle(task.id, task.status)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)' }}
      >
        {task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          textDecoration: task.status === 'completed' ? 'line-through' : 'none', 
          opacity: task.status === 'completed' ? 0.6 : 1,
          color: isOverdue && task.status !== 'completed' ? 'var(--danger)' : 'var(--text-primary)'
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
          {task.time && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {task.time}</span>}
          <Badge size="sm" variant={task.priority === 'low' ? 'default' : task.priority === 'medium' ? 'medium' : task.priority === 'high' ? 'high' : 'important'}>{task.priority}</Badge>
          {isOverdue && <Badge size="sm" variant="high">Overdue</Badge>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-grid">
      <div className="dashboard-section">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="dashboard-header-title">Welcome back, {user?.name.split(' ')[0]}</h1>
          <div className="dashboard-header-date">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Today's Tasks</h3>
          {loadingTasks ? (
            <Skeleton count={3} height="60px" />
          ) : tasksData.today.length === 0 && tasksData.overdue.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>No tasks for today. Enjoy your day!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tasksData.overdue.map(t => renderTaskItem(t, true))}
              {tasksData.today.map(t => renderTaskItem(t))}
            </div>
          )}
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Upcoming Events</h3>
          {loadingUpcoming ? (
            <Skeleton count={3} height="60px" />
          ) : upcomingTasks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>No upcoming events scheduled.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcomingTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '60px', textAlign: 'center', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>{format(new Date(t.date), 'MMM')}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{format(new Date(t.date), 'dd')}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.time || 'All day'} • {t.category}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="dashboard-section">
        <motion.div style={{ display: 'flex', gap: '12px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="primary" style={{ flex: 1 }} onClick={() => navigate('/calendar')}>+ New Task</Button>
          <Button variant="secondary" style={{ flex: 1 }} onClick={() => navigate('/jobs')}>+ New Application</Button>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Job Search Stats</h3>
          {loadingStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Skeleton count={1} height="100px" />
              <Skeleton count={1} height="100px" />
              <Skeleton count={1} height="100px" />
              <Skeleton count={1} height="100px" />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <StatCard label="Total Applied" value={jobStats?.total || 0} icon={Briefcase} color="primary" />
              <StatCard label="Interviews" value={jobStats?.interview || 0} icon={CheckSquare} color="warning" />
              <StatCard label="Offers" value={jobStats?.offer || 0} icon={FileText} color="success" />
              <StatCard label="Rejected" value={jobStats?.rejected || 0} icon={XOctagon} color="danger" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;

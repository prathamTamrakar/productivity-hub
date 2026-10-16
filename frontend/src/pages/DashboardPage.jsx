import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Clock,
  Briefcase,
  FileText,
  CheckSquare,
  XOctagon,
  ArrowRight,
  Plus,
  AlertTriangle,
  Calendar as CalendarIcon,
} from 'lucide-react';
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
      const res = await api.get('/api/tasks/upcoming?limit=6');
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
      fetchTodayTasks();
      fetchUpcomingTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const completedTodayCount = tasksData.today.filter((t) => t.status === 'completed').length;
  const totalTodayCount = tasksData.today.length;
  const overdueCount = tasksData.overdue.length;

  const totalJobs = jobStats?.total || 0;
  const interviewCount = jobStats?.interview || 0;
  const offerCount = jobStats?.offer || 0;
  const rejectedCount = jobStats?.rejected || 0;
  const interviewRate = totalJobs > 0 ? ((interviewCount / totalJobs) * 100).toFixed(0) : 0;

  const renderTaskItem = (task, isOverdue = false) => (
    <div
      key={task.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid var(--border-light)',
        background: isOverdue ? 'rgba(244, 63, 94, 0.05)' : 'transparent',
        borderRadius: 'var(--radius-sm)',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <button
          onClick={() => handleTaskStatusToggle(task.id, task.status)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: task.status === 'completed' ? 'var(--accent)' : 'var(--text-muted)',
            flexShrink: 0,
          }}
          title={task.status === 'completed' ? 'Mark pending' : 'Mark completed'}
        >
          {task.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              color:
                isOverdue && task.status !== 'completed'
                  ? 'var(--danger)'
                  : task.status === 'completed'
                  ? 'var(--text-muted)'
                  : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', truncate: true }}>
              {task.description}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {task.time && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={11} /> {task.time}
          </span>
        )}
        <Badge
          size="sm"
          variant={
            task.priority === 'low'
              ? 'default'
              : task.priority === 'medium'
              ? 'medium'
              : task.priority === 'high'
              ? 'high'
              : 'important'
          }
        >
          {task.priority}
        </Badge>
        {isOverdue && <Badge size="sm" variant="high">Overdue</Badge>}
      </div>
    </div>
  );

  return (
    <div className="dashboard-grid">
      {/* Left Main Column */}
      <div className="dashboard-section">
        {/* Welcome Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1 className="dashboard-header-title">
              Hello, {user?.name ? user.name.split(' ')[0] : 'Engineer'}
            </h1>
            <div className="dashboard-header-date">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} &bull;{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {completedTodayCount} of {totalTodayCount} tasks completed
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/calendar')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={14} /> New Task
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/jobs')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Plus size={14} /> Log Application
            </Button>
          </div>
        </div>

        {/* Today's Tasks Container */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Today's Agenda
              </h3>
              {overdueCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-light)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                  }}
                >
                  {overdueCount} overdue
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/calendar')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Open Calendar <ArrowRight size={13} />
            </button>
          </div>

          {loadingTasks ? (
            <Skeleton count={3} height="48px" />
          ) : tasksData.today.length === 0 && tasksData.overdue.length === 0 ? (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
                padding: '28px 0',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            >
              No pending tasks for today. All scheduled workloads clear.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tasksData.overdue.map((t) => renderTaskItem(t, true))}
              {tasksData.today.map((t) => renderTaskItem(t))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Upcoming Schedule
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Next 7 days
            </span>
          </div>

          {loadingUpcoming ? (
            <Skeleton count={3} height="48px" />
          ) : upcomingTasks.length === 0 ? (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
                padding: '24px 0',
                textAlign: 'center',
              }}
            >
              No upcoming events on the horizon.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      textAlign: 'center',
                      background: 'var(--surface)',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        color: 'var(--primary)',
                        fontWeight: 700,
                      }}
                    >
                      {format(new Date(t.date), 'MMM')}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.1,
                      }}
                    >
                      {format(new Date(t.date), 'dd')}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {t.time || 'All-day'} &bull; {t.category || 'General'}
                    </div>
                  </div>
                  <Badge size="sm" variant={t.priority === 'high' ? 'high' : 'default'}>
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Pipeline & Financial Quick Stats */}
      <div className="dashboard-section">
        {/* Job Search Pipeline - Differentiated Cards */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Application Pipeline
            </h3>
            <button
              onClick={() => navigate('/jobs')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Full Tracker &rarr;
            </button>
          </div>

          {loadingStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Skeleton count={1} height="80px" />
              <Skeleton count={1} height="80px" />
              <Skeleton count={1} height="80px" />
              <Skeleton count={1} height="80px" />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* Primary Total Metric */}
              <StatCard
                label="Total Submissions"
                value={totalJobs}
                icon={Briefcase}
                color="primary"
                subLabel="Active tracker"
              />

              {/* Interviews Metric with Conversion Rate */}
              <StatCard
                label="In Interview"
                value={interviewCount}
                icon={CheckSquare}
                color="warning"
                subValue={`${interviewRate}%`}
                subLabel="pipeline rate"
              />

              {/* Offers Received */}
              <StatCard
                label="Offers Secured"
                value={offerCount}
                icon={FileText}
                color="accent"
                badge={offerCount > 0 ? `${offerCount} active` : undefined}
                badgeVariant="success"
              />

              {/* Closed Out / Rejections */}
              <StatCard
                label="Archived / Closed"
                value={rejectedCount}
                icon={XOctagon}
                color="danger"
                subLabel="No match"
              />
            </div>
          )}
        </div>

        {/* Quick Navigation / Operational Strip */}
        <div
          className="card"
          style={{
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            System Workspaces
          </div>
          <div
            onClick={() => navigate('/money')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                Money Manager
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Accounts, monthly expenses & cash flow
              </div>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>

          <div
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                Notifications & Settings
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Configure email offsets & account security
              </div>
            </div>
            <ArrowRight size={14} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

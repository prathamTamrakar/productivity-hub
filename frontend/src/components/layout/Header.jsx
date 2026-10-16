import { useLocation } from 'react-router';
import { Search, Bell, Menu, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/': 'Dashboard',
  '/calendar': 'Calendar & Tasks',
  '/jobs': 'Job Applications',
  '/money': 'Money Manager',
  '/settings': 'System Settings',
};

export default function Header({ onMenuToggle }) {
  const location = useLocation();
  const { user } = useAuth();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-hamburger" onClick={onMenuToggle} title="Toggle navigation">
          <Menu size={18} />
        </button>
        <div>
          <h1 className="header-title">{pageTitle}</h1>
          <div className="header-breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Compact Operational Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--text-secondary)',
          }}
          className="hide-mobile"
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span>LIVE</span>
        </div>

        <div className="header-search">
          <Search size={14} />
          <input type="text" placeholder="Quick search..." />
        </div>

        <button className="header-icon-btn" title="Notifications">
          <Bell size={16} />
          <div className="header-notification-dot" />
        </button>

        <div className="header-avatar" title={user?.name || 'User profile'}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}

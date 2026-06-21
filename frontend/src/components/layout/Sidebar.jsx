import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { Home, Calendar, Briefcase, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', end: true },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/jobs', icon: Briefcase, label: 'Job Tracker' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">P</div>
          <div className="sidebar-logo-text">
            Pratham
            <span>Dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <item.icon />
              </motion.div>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name || 'User'}</div>
                <div className="sidebar-user-email">{user.email || ''}</div>
              </div>
              <button className="sidebar-logout-btn" onClick={logout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

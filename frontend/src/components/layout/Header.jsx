import { useLocation } from 'react-router'
import { Search, Bell, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/calendar': 'Calendar',
  '/jobs': 'Job Tracker',
  '/settings': 'Settings',
}

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const { user } = useAuth()
  const pageTitle = pageTitles[location.pathname] || 'Dashboard'

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-hamburger" onClick={onMenuToggle}>
          <Menu />
        </button>
        <div>
          <h1 className="header-title">{pageTitle}</h1>
          <div className="header-breadcrumb">
            Home / <span>{pageTitle}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="header-icon-btn">
          <Bell />
          <div className="header-notification-dot" />
        </button>

        <div className="header-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  )
}

import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './Navbar.css'

function Navbar({ user, onSignOut, onNavigateToApiKeys }) {
  const { theme, toggleTheme } = useTheme()
  const [showDropdown, setShowDropdown] = useState(false)
  
  const handleSignOut = async () => {
    try {
      await onSignOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className={`navbar ${theme}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-dot"></span>
          <span className="brand-text">Call Analytics</span>
        </div>
        
        <div className="navbar-user">
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <div className="user-profile-dropdown">
            <div 
              className="user-info" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="user-text">
                <span className="user-name">
                  {user.user_metadata?.name || user.email}
                </span>
                <span className="user-email">{user.email}</span>
              </div>
              <div className="profile-menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
            </div>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <button 
                  onClick={() => {
                    onNavigateToApiKeys()
                    setShowDropdown(false)
                  }} 
                  className="dropdown-item"
                >
                  API Key
                </button>
                <button 
                  onClick={handleSignOut} 
                  className="dropdown-item sign-out-item"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

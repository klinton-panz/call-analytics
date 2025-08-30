import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase, auth } from '../supabase.js'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './components/Login.jsx'
import SignUp from './components/SignUp.jsx'
import Dashboard from './components/Dashboard.jsx'
import ApiKeySettings from './components/ApiKeySettings.jsx'
import Navbar from './components/Navbar.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { user } = await auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="app">
        {user && (
          <Navbar 
            user={user} 
            onSignOut={() => auth.signOut()} 
            onNavigateToApiKeys={() => navigate('/api-keys')}
          />
        )}
        
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" /> : <SignUp />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/api-keys" 
            element={user ? (
              <ApiKeySettings 
                user={user} 
                onBack={() => navigate('/dashboard')} 
              />
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App

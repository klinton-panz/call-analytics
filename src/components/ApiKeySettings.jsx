import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { apiKeys } from '../../supabase.js'

function ApiKeySettings({ user, onBack }) {
  const { theme } = useTheme()
  const [userApiKey, setUserApiKey] = useState(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApiKey()
  }, [])

  const loadApiKey = async () => {
    try {
      const { data, error } = await apiKeys.getUserApiKey(user.id)
      if (error) {
        console.error('Error loading API key:', error)
      } else {
        setUserApiKey(data)
      }
    } catch (error) {
      console.error('Error loading API key:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div id="api-key-app" className={theme}>
      <style>{`
        #api-key-app { all: initial; color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
        #api-key-app, #api-key-app * { box-sizing: border-box; }
        #api-key-app {
          --bg: #0f1220; --panel: #151a2e; --border: #2a3354; --text: #e7ecff; --muted: #9aa4bf;
          --accent: #6c7cff; --theadBg: rgba(255,255,255,0.02); --rowHover: rgba(255,255,255,0.03);
        }
        #api-key-app.light {
          --bg: #f8fafc; --panel: #ffffff; --border: #e2e8f0; --text: #1e293b; --muted: #64748b;
          --accent: #3b82f6; --theadBg: rgba(0,0,0,0.05); --rowHover: rgba(0,0,0,0.03);
        }
        
        .api-key-page { background: var(--bg); min-height: 100vh; padding: 40px 20px; }
        .api-key-container { max-width: 800px; margin: 0 auto; }
        .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-button { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text); cursor: pointer; font-size: 14px; }
        .back-button:hover { background: var(--border); }
        .page-title { font-size: 24px; font-weight: 600; color: var(--text); margin: 0; }
        
        .api-key-card { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
        .api-key-section h3 { margin: 0 0 20px 0; color: var(--text); font-size: 18px; font-weight: 600; }
        
        .api-key-display { }
        .api-key-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .api-key-row label { font-weight: 600; color: var(--muted); min-width: 80px; }
        .key-container { display: flex; align-items: center; gap: 8px; flex: 1; }
        .api-key-value { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 14px; flex: 1; white-space: nowrap; overflow: hidden; }
        .api-key-value.hidden { letter-spacing: 2px; }
        .toggle-key-btn, .copy-key-btn { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; cursor: pointer; font-size: 14px; transition: all 0.2s ease; }
        .toggle-key-btn:hover, .copy-key-btn:hover { background: var(--border); }
        .key-info { display: flex; gap: 24px; }
        .key-info small { color: var(--muted); font-size: 12px; }
        .api-key-loading { color: var(--muted); font-style: italic; }
        
        .usage-section { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 32px; }
        .usage-section h3 { margin: 0 0 16px 0; color: var(--text); font-size: 18px; font-weight: 600; }
        .usage-section p { color: var(--muted); margin: 0 0 16px 0; line-height: 1.5; }
        .code-example { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; white-space: pre-wrap; color: var(--text); }
      `}</style>
      
      <div className="api-key-page">
        <div className="api-key-container">
          <div className="page-header">
            <button onClick={onBack} className="back-button">
              ← Back to Dashboard
            </button>
            <h1 className="page-title">API Key Settings</h1>
          </div>

          <div className="api-key-card">
            <h3>Your API Key</h3>
            {loading ? (
              <div className="api-key-loading">Loading API key...</div>
            ) : userApiKey ? (
              <div className="api-key-display">
                <div className="api-key-row">
                  <label>API Key:</label>
                  <div className="key-container">
                    <code className={`api-key-value ${showApiKey ? 'visible' : 'hidden'}`}>
                      {showApiKey ? userApiKey.api_key : '••••••••••••••••••••••••••••••••••••'}
                    </code>
                    <button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="toggle-key-btn"
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? '🙈' : '👁️'}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(userApiKey.api_key)}
                      className="copy-key-btn"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="key-info">
                  <small>Name: {userApiKey.key_name}</small>
                  <small>Created: {new Date(userApiKey.created_at).toLocaleDateString()}</small>
                </div>
              </div>
            ) : (
              <div className="api-key-loading">No API key found</div>
            )}
          </div>

          <div className="usage-section">
            <h3>How to Use Your API Key</h3>
            <p>Use this API key to send call data to your dashboard via Postman or other tools:</p>
            
            <div className="code-example">{`POST https://call-analytics-10-production.up.railway.app/api/calls
Headers:
  Content-Type: application/json
  x-api-key: ${userApiKey?.api_key || 'your_api_key_here'}

Body:
{
  "timestamp": "2025-08-31 14:30:00",
  "contactName": "John Smith",
  "phone": "(555) 123-4567",
  "direction": "inbound",
  "status": "Qualified",
  "summary": "Customer called about our services"
}`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeySettings
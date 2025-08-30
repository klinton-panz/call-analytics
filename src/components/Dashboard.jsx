import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { calls, apiKeys, supabase } from '../../supabase.js'

function Dashboard({ user }) {
  const { theme } = useTheme()
  const [callData, setCallData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCall, setSelectedCall] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userApiKey, setUserApiKey] = useState(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedCalls, setSelectedCalls] = useState(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    loadCalls()
    loadApiKey()
    // Refresh every 5 minutes instead of 30 seconds to reduce refreshing
    const interval = setInterval(loadCalls, 300000)
    return () => clearInterval(interval)
  }, [])

  const loadCalls = async () => {
    try {
      setLoading(true)
      const { data, error } = await calls.getUserCalls(user.id, 500)
      
      if (error) {
        console.error('Error loading calls:', error)
      } else {
        // Transform Supabase data to match expected format
        const transformedData = (data || []).map(call => ({
          timestamp: call.timestamp,
          contactName: call.contact_name || '',
          phone: call.phone || '',
          direction: call.direction || 'inbound',
          status: call.status || '',
          summary: call.summary || '',
          callId: call.call_id || call.id
        }))
        setCallData(transformedData)
      }
    } catch (error) {
      console.error('Error loading calls:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  // Apply filters whenever any filter changes
  useEffect(() => {
    const filtered = callData.filter(call => {
      // Search filter
      const searchMatch = !searchTerm || 
        (call.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.phone || '').toLowerCase().includes(searchTerm.toLowerCase())

      // Date filters
      const callDate = new Date(call.timestamp)
      const fromMatch = !fromDate || callDate >= new Date(fromDate + 'T00:00:00')
      const toMatch = !toDate || callDate <= new Date(toDate + 'T23:59:59')

      // Status filter - exact match, case insensitive
      const statusMatch = !statusFilter || 
        (call.status || '').toLowerCase() === statusFilter.toLowerCase()

      return searchMatch && fromMatch && toMatch && statusMatch
    })

    setFilteredData(filtered)
  }, [callData, searchTerm, fromDate, toDate, statusFilter])

  const updateKPIs = (data) => {
    const total = data.length
    let missed = 0, notq = 0, qual = 0, comp = 0

    for (const call of data) {
      const status = (call.status || '').toLowerCase()
      if (status.includes('missed')) missed++
      else if (status.includes('not') && status.includes('qualified')) notq++
      else if (status.includes('qualified')) qual++
      else if (status.includes('completed')) comp++
    }

    return { total, missed, notq, qual, comp }
  }

  const formatDate = (timestamp) => {
    const d = new Date(timestamp)
    if (isNaN(d.getTime())) return String(timestamp || '')
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const telLink = (phone) => {
    if (!phone) return ''
    const clean = String(phone).replace(/[^\d+]/g, '')
    return `<a href="tel:${clean}" style="color:inherit;text-decoration:underline;">${phone}</a>`
  }

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase()
    if (s.includes('not qualified')) return 'red'
    if (s.includes('qualified')) return 'green'
    if (s.includes('completed')) return 'green'
    if (s.includes('missed')) return 'red'
    return ''
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFromDate('')
    setToDate('')
    setStatusFilter('')
  }

  const handleRowClick = (call) => {
    setSelectedCall(call)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCall(null)
  }

  // Bulk selection functions
  const toggleCallSelection = (callId, event) => {
    event.stopPropagation() // Prevent row click
    const newSelected = new Set(selectedCalls)
    if (newSelected.has(callId)) {
      newSelected.delete(callId)
    } else {
      newSelected.add(callId)
    }
    setSelectedCalls(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllCalls = () => {
    const allCallIds = new Set(filteredData.map(call => call.callId))
    setSelectedCalls(allCallIds)
    setShowBulkActions(true)
  }

  const deselectAllCalls = () => {
    setSelectedCalls(new Set())
    setShowBulkActions(false)
  }

  const bulkDeleteCalls = async () => {
    if (selectedCalls.size === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedCalls.size} call(s)? This action cannot be undone.`)) {
      try {
        // Delete selected calls from Supabase
        const callIdsToDelete = Array.from(selectedCalls)
        const { error } = await supabase
          .from('calls')
          .delete()
          .eq('user_id', user.id)
          .in('call_id', callIdsToDelete)

        if (error) {
          console.error('Error deleting calls:', error)
          alert('Error deleting calls. Please try again.')
        } else {
          // Reload calls and reset selection
          loadCalls()
          deselectAllCalls()
          alert(`Successfully deleted ${callIdsToDelete.length} call(s).`)
        }
      } catch (error) {
        console.error('Error deleting calls:', error)
        alert('Error deleting calls. Please try again.')
      }
    }
  }

  const exportSelectedToCSV = () => {
    if (selectedCalls.size === 0) return

    const selectedData = filteredData.filter(call => selectedCalls.has(call.callId))
    const csvContent = [
      ['Date', 'Contact', 'Phone', 'Direction', 'Status', 'Summary'],
      ...selectedData.map(call => [
        formatDate(call.timestamp),
        call.contactName || '',
        call.phone || '',
        call.direction || '',
        call.status || '',
        call.summary || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `calls_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isModalOpen])

  const kpis = updateKPIs(filteredData)

  return (
    <div id="calls-app" className={theme}>
      <div className="wrap">
        <header className="topbar">
          <div className="filters">
            <input 
              type="search" 
              placeholder="Search name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Qualified">Qualified</option>
              <option value="Not Qualified">Not Qualified</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>

            <button onClick={clearFilters}>Clear</button>
          </div>
        </header>

        <section className="cards">
          <div className="card">
            <div className="label">Total Calls</div>
            <div className="value">{kpis.total}</div>
          </div>
          <div className="card">
            <div className="label">Missed Opportunities</div>
            <div className="value">{kpis.missed}</div>
          </div>
          <div className="card">
            <div className="label">Not Qualified</div>
            <div className="value">{kpis.notq}</div>
          </div>
          <div className="card">
            <div className="label">Qualified</div>
            <div className="value">{kpis.qual}</div>
          </div>
          <div className="card">
            <div className="label">Completed</div>
            <div className="value">{kpis.comp}</div>
          </div>
        </section>

        {showBulkActions && (
          <section className="bulk-actions-bar">
            <div className="bulk-info">
              {selectedCalls.size} call{selectedCalls.size !== 1 ? 's' : ''} selected
            </div>
            <div className="bulk-buttons">
              <button onClick={selectAllCalls} className="bulk-btn select-all-btn">
                Select All ({filteredData.length})
              </button>
              <button onClick={deselectAllCalls} className="bulk-btn deselect-btn">
                Deselect All
              </button>
              <button onClick={exportSelectedToCSV} className="bulk-btn export-btn">
                📄 Export CSV
              </button>
              <button onClick={bulkDeleteCalls} className="bulk-btn delete-btn">
                🗑️ Delete Selected
              </button>
            </div>
          </section>
        )}

        <section className="table-wrap">
          <div className="loading" style={{display: loading ? 'block' : 'none'}}>Loading…</div>
          
          {!loading && (
            <>
              {filteredData.length === 0 ? (
                <div className="empty">No calls match your filters</div>
              ) : (
                <table style={{display: 'table'}}>
                  <colgroup>
                    <col style={{width:'50px'}} />
                    <col style={{width:'160px'}} />
                    <col style={{width:'180px'}} />
                    <col style={{width:'150px'}} />
                    <col style={{width:'110px'}} />
                    <col style={{width:'120px'}} />
                    <col style={{width:'auto'}} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedCalls.size === filteredData.length && filteredData.length > 0}
                          onChange={(e) => e.target.checked ? selectAllCalls() : deselectAllCalls()}
                          className="bulk-checkbox"
                        />
                      </th>
                      <th>Date</th>
                      <th>Contact</th>
                      <th>Phone</th>
                      <th>Direction</th>
                      <th>Status</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((call, index) => (
                      <tr 
                        key={call.callId || index} 
                        onClick={() => handleRowClick(call)}
                        style={{cursor: 'pointer'}}
                        className={selectedCalls.has(call.callId) ? 'row-selected' : ''}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedCalls.has(call.callId)}
                            onChange={(e) => toggleCallSelection(call.callId, e)}
                            className="bulk-checkbox"
                          />
                        </td>
                        <td>{formatDate(call.timestamp)}</td>
                        <td>{call.contactName || ''}</td>
                        <td dangerouslySetInnerHTML={{__html: telLink(call.phone)}}></td>
                        <td>{call.direction || ''}</td>
                        <td>
                          <span className={`status-pill ${getStatusClass(call.status)}`}>
                            <span className="dot"></span>
                            {call.status || ''}
                          </span>
                        </td>
                        <td className="summary-cell">{call.summary || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>
      </div>

      {/* Call Details Modal */}
      {isModalOpen && selectedCall && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Call Details</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Date & Time:</span>
                <span className="detail-value">{formatDate(selectedCall.timestamp)}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Contact Name:</span>
                <span className="detail-value">{selectedCall.contactName || 'N/A'}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Phone Number:</span>
                <span className="detail-value">
                  <a href={`tel:${selectedCall.phone}`} className="phone-link">
                    {selectedCall.phone || 'N/A'}
                  </a>
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Direction:</span>
                <span className="detail-value">{selectedCall.direction || 'N/A'}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-pill ${getStatusClass(selectedCall.status)}`}>
                    <span className="dot"></span>
                    {selectedCall.status || 'N/A'}
                  </span>
                </span>
              </div>
              
              <div className="detail-row summary-row">
                <span className="detail-label">Summary:</span>
                <div className="detail-value summary-text">
                  {selectedCall.summary || 'No summary available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        #calls-app { all: initial; color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
        #calls-app, #calls-app * { box-sizing: border-box; }
        #calls-app {
          --bg: #0f1220; --panel: #151a2e; --border: #2a3354; --text: #e7ecff; --muted: #9aa4bf;
          --accent: #6c7cff; --theadBg: rgba(255,255,255,0.02); --rowHover: rgba(255,255,255,0.03);
          --pillRedBg: linear-gradient(180deg, rgba(255,107,107,0.22), rgba(255,107,107,0.06));
          --pillRedBd: #ff7f7f;
          --pillGreenBg: linear-gradient(180deg, rgba(63,191,127,0.22), rgba(63,191,127,0.06));
          --pillGreenBd: #6fe2a8;
        }
        #calls-app.light {
          --bg: #f8fafc; --panel: #ffffff; --border: #e2e8f0; --text: #1e293b; --muted: #64748b;
          --accent: #3b82f6; --theadBg: rgba(0,0,0,0.05); --rowHover: rgba(0,0,0,0.03);
          --pillRedBg: linear-gradient(180deg, rgba(239,68,68,0.14), rgba(239,68,68,0.04));
          --pillRedBd: #ef4444;
          --pillGreenBg: linear-gradient(180deg, rgba(34,197,94,0.18), rgba(34,197,94,0.05));
          --pillGreenBd: #22c55e;
        }
        .wrap { background: transparent; padding: 20px; border-radius: 0; max-width: 1400px; margin: 0 auto; }
        .topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; gap:12px; flex-wrap:wrap; }
        .brand { display:flex; align-items:center; gap:10px; font-weight:600; font-size:18px; }
        .dot { width:10px; height:10px; background:var(--accent); border-radius:50%; box-shadow: 0 0 14px var(--accent); }
        .filters { display:flex; gap:10px; flex-wrap:wrap; }
        input, button, select { background:var(--panel); color:var(--text); border:1px solid var(--border); border-radius:10px; padding:10px 12px; outline:none; }
        input::placeholder { color:var(--muted); }
        button:hover, select:hover { border-color: var(--accent); }
        button:active { transform: translateY(1px); }

        .cards { display:grid; grid-template-columns:repeat(5, minmax(160px, 1fr)); gap:12px; margin-bottom:16px; }
        .card { background: linear-gradient(180deg, rgba(108,124,255,0.14), rgba(108,124,255,0) 40%), var(--panel); border:1px solid var(--border); border-radius:16px; padding:14px; }
        .card .label { color:var(--muted); font-size:12px; margin-bottom:8px; }
        .card .value { font-size:26px; font-weight:700; }

        .api-key-section { background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:24px; margin-bottom:24px; }
        .api-key-section h3 { margin:0 0 16px 0; color:var(--text); font-size:18px; font-weight:600; }
        .api-key-display { }
        .api-key-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .api-key-row label { font-weight:600; color:var(--muted); min-width:80px; }
        .key-container { display:flex; align-items:center; gap:8px; flex:1; }
        .api-key-value { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 12px; font-family:monospace; font-size:14px; flex:1; white-space:nowrap; overflow:hidden; }
        .api-key-value.hidden { letter-spacing:2px; }
        .toggle-key-btn, .copy-key-btn { background:var(--panel); border:1px solid var(--border); border-radius:6px; padding:6px 8px; cursor:pointer; font-size:14px; transition:all 0.2s ease; }
        .toggle-key-btn:hover, .copy-key-btn:hover { background:var(--border); }
        .key-info { display:flex; gap:16px; }
        .key-info small { color:var(--muted); font-size:12px; }
        .api-key-loading { color:var(--muted); font-style:italic; }

        .table-wrap { background:var(--panel); border:1px solid var(--border); border-radius:16px; overflow:hidden; position:relative; }
        .loading { padding:14px; color:var(--muted); }
        table { width:100%; border-collapse:collapse; font-size:14px; table-layout:auto; }
        thead { background:var(--theadBg); }
        th, td { padding:12px 14px; border-bottom:1px solid var(--border); vertical-align:top; }
        th { text-align:left; color:var(--muted); font-weight:600; font-size:12px; letter-spacing:.3px; }
        tbody tr:hover { background:var(--rowHover); cursor:pointer; }

        .status-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; border:1px solid var(--border); font-size:12px; line-height:1; }
        .status-pill .dot { width:6px; height:6px; box-shadow:none; }
        .status-pill.red   { border-color: var(--pillRedBd);   background: var(--pillRedBg); }
        .status-pill.red .dot { background:#ff6b6b; }
        .status-pill.green { border-color: var(--pillGreenBd); background: var(--pillGreenBg); }
        .status-pill.green .dot { background:#3fbf7f; }

        .empty { padding:16px; color:var(--muted); }
        td.summary-cell { white-space:normal; overflow-wrap:anywhere; word-break:break-word; }

        @media (max-width: 1100px){ .cards{grid-template-columns:repeat(2,1fr);} }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 24px;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          color: var(--text);
          background: var(--border);
        }

        .modal-body {
          padding: 24px;
        }

        .detail-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 16px;
        }

        .detail-row.summary-row {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }

        .detail-label {
          font-weight: 600;
          color: var(--muted);
          min-width: 120px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          flex: 1;
          color: var(--text);
          font-size: 16px;
          line-height: 1.5;
        }

        .summary-text {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 14px;
          line-height: 1.6;
        }

        .phone-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
        }

        .phone-link:hover {
          text-decoration: underline;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .modal-content {
            max-height: 95vh;
          }
          
          .modal-header {
            padding: 16px 20px;
          }
          
          .modal-body {
            padding: 20px;
          }
          
          .detail-row {
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .detail-label {
            min-width: auto;
            margin-bottom: 4px;
          }
          
          .modal-header h2 {
            font-size: 18px;
          }
        }

        /* Bulk Actions Styles */
        .bulk-actions-bar { 
          background: var(--panel); 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          padding: 16px 20px; 
          margin-bottom: 16px;
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 16px;
          animation: slideIn 0.2s ease-out;
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .bulk-info { 
          font-weight: 600; 
          color: var(--text); 
          font-size: 14px; 
        }
        
        .bulk-buttons { 
          display: flex; 
          gap: 10px; 
          align-items: center; 
        }
        
        .bulk-btn { 
          background: var(--panel); 
          color: var(--text); 
          border: 1px solid var(--border); 
          border-radius: 8px; 
          padding: 8px 12px; 
          font-size: 13px; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          font-weight: 500;
        }
        
        .bulk-btn:hover { 
          border-color: var(--accent); 
          transform: translateY(-1px); 
        }
        
        .select-all-btn:hover { 
          background: rgba(108, 124, 255, 0.1); 
        }
        
        .deselect-btn:hover { 
          background: rgba(156, 163, 175, 0.1); 
        }
        
        .export-btn:hover { 
          background: rgba(34, 197, 94, 0.1); 
          border-color: #22c55e; 
        }
        
        .delete-btn { 
          color: #f87171; 
          border-color: rgba(248, 113, 113, 0.3); 
        }
        
        .delete-btn:hover { 
          background: rgba(248, 113, 113, 0.1); 
          border-color: #f87171; 
        }
        
        .bulk-checkbox { 
          width: 16px; 
          height: 16px; 
          accent-color: var(--accent); 
          cursor: pointer; 
        }
        
        .row-selected { 
          background: rgba(108, 124, 255, 0.08) !important; 
          border-left: 3px solid var(--accent);
        }
        
        .row-selected:hover { 
          background: rgba(108, 124, 255, 0.12) !important; 
        }

        @media (max-width: 768px) {
          .bulk-actions-bar { 
            flex-direction: column; 
            align-items: stretch; 
            gap: 12px; 
          }
          
          .bulk-buttons { 
            flex-wrap: wrap; 
            justify-content: center; 
          }
          
          .bulk-btn { 
            flex: 1; 
            min-width: 120px; 
          }
        }
      `}}/>
    </div>
  )
}

export default Dashboard
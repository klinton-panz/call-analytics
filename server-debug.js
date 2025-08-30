require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Database pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false }
});

// Apply core middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path} - Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request body:', req.body);
  }
  next();
});

// Utility function to normalize timestamps
function normalizeTimestamp(raw) {
  try {
    if (!raw) return new Date();
    if (typeof raw === 'number') return new Date(raw < 1e12 ? raw * 1000 : raw);
    const str = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      const now = new Date();
      return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    }
    const d = new Date(str);
    return isNaN(d) ? new Date() : d;
  } catch {
    return new Date();
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Get recent call logs (up to 1000)
app.get('/api/calls', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
    const result = await pool.query(`
      SELECT timestamp, contact_name, phone, direction, status, summary, call_id
      FROM calls
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    const data = result.rows.map(row => ({
      timestamp: row.timestamp,
      contactName: row.contact_name || '',
      phone: row.phone || '',
      direction: row.direction || 'inbound',
      status: row.status || '',
      summary: row.summary || '',
      callId: row.call_id || ''
    }));

    const summary = {
      totalCalls: data.length,
      answeredCalls: data.filter(x =>
        /^(completed|answered|answered call)$/i.test(x.status || '')
      ).length,
      answerRate: data.length ? +(data.filter(x => /^(completed|answered|answered call)$/i.test(x.status)).length / data.length * 100).toFixed(1) : 0,
      uniqueContacts: new Set(data.map(x => x.phone.trim()).filter(Boolean)).size
    };

    res.json({ ok: true, summary, data });
  } catch (err) {
    console.error('Error fetching calls:', err);
    res.status(500).json({ ok: false, error: 'Failed to fetch calls' });
  }
});

// Insert or update a call entry
app.post('/api/calls', async (req, res) => {
  try {
    console.log('🔐 Starting authentication check...');
    
    const apiKey = req.headers['x-api-key'] || req.headers['x-secret'];
    console.log('🔑 API Key from headers:', apiKey);
    
    if (!apiKey) {
      console.log('❌ No API key provided');
      return res.status(401).json({ ok: false, error: 'Missing API key' });
    }

    console.log('🔍 Querying api_keys table for key:', apiKey);
    
    // First, let's check if the api_keys table exists and has data
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ api_keys table does not exist!');
      return res.status(500).json({ ok: false, error: 'API keys table not found' });
    }
    
    // Check how many API keys exist
    const keyCount = await pool.query('SELECT COUNT(*) FROM api_keys');
    console.log('📊 Total API keys in database:', keyCount.rows[0].count);
    
    // List all API keys for debugging
    const allKeys = await pool.query('SELECT key, user_id, revoked FROM api_keys');
    console.log('🔑 All API keys:', allKeys.rows);
    
    // Now check for the specific key
    const { rows } = await pool.query(
      'SELECT user_id FROM api_keys WHERE key = $1 AND revoked = false LIMIT 1',
      [apiKey]
    );
    
    console.log('🔍 Query result for key:', apiKey, 'Rows found:', rows.length);
    if (rows.length > 0) {
      console.log('✅ User ID found:', rows[0].user_id);
    }
    
    if (!rows.length) {
      console.log('❌ No valid API key found');
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    
    const userId = rows[0].user_id;
    console.log('👤 Authenticated user ID:', userId);

    const {
      timestamp,
      contactName,
      phone,
      direction = 'inbound',
      status,
      summary,
      callId
    } = req.body;

    const normalizedTimestamp = normalizeTimestamp(timestamp);
    const finalCallId = callId || `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const insertQuery = `
      INSERT INTO calls (
        timestamp, contact_name, phone, direction, status,
        summary, call_id, user_id, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      ON CONFLICT (call_id)
      DO UPDATE SET
        timestamp = EXCLUDED.timestamp,
        contact_name = EXCLUDED.contact_name,
        phone = EXCLUDED.phone,
        direction = EXCLUDED.direction,
        status = EXCLUDED.status,
        summary = EXCLUDED.summary,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      normalizedTimestamp,
      String(contactName || '').trim(),
      String(phone || '').trim(),
      String(direction || 'inbound').trim(),
      String(status || '').trim(),
      String(summary || '').trim(),
      finalCallId,
      userId
    ];

    console.log('💾 Inserting call with values:', values);

    const result = await pool.query(insertQuery, values);
    console.log('✅ Call record saved successfully');
    
    res.json({
      ok: true,
      message: 'Call record saved successfully',
      callId: finalCallId,
      record: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error saving call:', err);
    res.status(500).json({ ok: false, error: 'Failed to save call record', details: err.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Call Analytics DEBUG server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Debug mode enabled - check console for detailed logs`);
}); 
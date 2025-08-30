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
    const apiKey = req.headers['x-api-key'] || req.headers['x-secret'];
    if (!apiKey) return res.status(401).json({ ok: false, error: 'Missing API key' });

    const { rows } = await pool.query(
      'SELECT user_id FROM api_keys WHERE key = $1 AND revoked = false LIMIT 1',
      [apiKey]
    );
    if (!rows.length) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const userId = rows[0].user_id;

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

    const result = await pool.query(insertQuery, values);
    res.json({
      ok: true,
      message: 'Call record saved successfully',
      callId: finalCallId,
      record: result.rows[0]
    });
  } catch (err) {
    console.error('Error saving call:', err);
    res.status(500).json({ ok: false, error: 'Failed to save call record' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Call Analytics server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});
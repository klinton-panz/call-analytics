require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database safely...');
    
    // First, let's see what tables already exist
    console.log('📊 Checking existing tables...');
    const existingTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Existing tables:', existingTables.rows.map(row => row.table_name).join(', '));
    
    // Check if we need to create the users table
    if (!existingTables.rows.find(row => row.table_name === 'users')) {
      console.log('👥 Creating users table...');
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Users table created');
    } else {
      console.log('✅ Users table already exists');
    }
    
    // Check if we need to create the api_keys table
    if (!existingTables.rows.find(row => row.table_name === 'api_keys')) {
      console.log('🔑 Creating api_keys table...');
      await pool.query(`
        CREATE TABLE api_keys (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          key VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX idx_api_keys_key ON api_keys(key);
        CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
      `);
      console.log('✅ API keys table created');
    } else {
      console.log('✅ API keys table already exists');
    }
    
    // Check the calls table structure
    const callsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'calls' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📞 Calls table columns:', callsColumns.rows.map(col => `${col.column_name} (${col.data_type})`).join(', '));
    
    // Check if calls table has user_id column
    const hasUserId = callsColumns.rows.find(col => col.column_name === 'user_id');
    
    if (!hasUserId) {
      console.log('➕ Adding user_id column to calls table...');
      await pool.query(`
        ALTER TABLE calls 
        ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✅ user_id column added to calls table');
    } else {
      console.log('✅ user_id column already exists in calls table');
    }
    
    // Create indexes if they don't exist
    console.log('🔍 Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls (phone);
      CREATE INDEX IF NOT EXISTS idx_calls_contact_name ON calls (contact_name);
      CREATE INDEX IF NOT EXISTS idx_calls_status ON calls (status);
      CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls (direction);
      CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls (call_id);
      CREATE INDEX IF NOT EXISTS idx_calls_timestamp_status ON calls (timestamp DESC, status);
      CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
    `);
    console.log('✅ Indexes created');
    
    // Insert test user if it doesn't exist
    console.log('👤 Setting up test user...');
    const userResult = await pool.query(`
      INSERT INTO users (email, name) 
      VALUES ('test@example.com', 'Test User')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    
    let testUserId;
    if (userResult.rows.length > 0) {
      testUserId = userResult.rows[0].id;
      console.log('✅ New test user created');
    } else {
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
      testUserId = existingUser.rows[0].id;
      console.log('✅ Using existing test user');
    }
    
    // Insert test API key if it doesn't exist
    console.log('🔑 Setting up test API key...');
    await pool.query(`
      INSERT INTO api_keys (user_id, key, name) 
      VALUES ($1, 'test-key-123', 'Test API Key')
      ON CONFLICT (key) DO NOTHING
    `, [testUserId]);
    console.log('✅ Test API key ready');
    
    // Show final status
    console.log('\n🎯 Final Status:');
    const finalTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'api_keys', 'calls')
      ORDER BY table_name
    `);
    
    console.log('📊 Tables ready:', finalTables.rows.map(row => row.table_name).join(', '));
    
    const callsCount = await pool.query('SELECT COUNT(*) FROM calls');
    console.log(`📞 Calls table records: ${callsCount.rows[0].count}`);
    
    const keysCount = await pool.query('SELECT COUNT(*) FROM api_keys');
    console.log(`🔑 API keys: ${keysCount.rows[0].count}`);
    
    console.log('\n🔑 Test API Key: test-key-123');
    console.log('💡 Use this key in your Postman requests with header: x-api-key: test-key-123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pooler requires TLS; skip CA verification on local machines
  ssl: { require: true, rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');
    
    // Test the connection and verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'api_keys', 'calls')
      ORDER BY table_name
    `);
    
    console.log('📊 Tables created:', tablesResult.rows.map(row => row.table_name).join(', '));
    
    // Test the calls table
    const callsResult = await pool.query('SELECT COUNT(*) FROM calls');
    console.log(`📞 Calls table ready. Current records: ${callsResult.rows[0].count}`);
    
    // Test the api_keys table
    const keysResult = await pool.query('SELECT COUNT(*) FROM api_keys');
    console.log(`🔑 API keys table ready. Current keys: ${keysResult.rows[0].count}`);
    
    // Show the test API key
    const testKeyResult = await pool.query('SELECT key, name FROM api_keys LIMIT 1');
    if (testKeyResult.rows.length > 0) {
      console.log(`🔑 Test API Key: ${testKeyResult.rows[0].key} (${testKeyResult.rows[0].name})`);
      console.log('💡 Use this key in your Postman requests with header: x-api-key: ' + testKeyResult.rows[0].key);
      
      // Show the user associated with this key
      const userResult = await pool.query(`
        SELECT u.id, u.email, u.name 
        FROM users u 
        JOIN api_keys ak ON u.id = ak.user_id 
        WHERE ak.key = $1
      `, [testKeyResult.rows[0].key]);
      
      if (userResult.rows.length > 0) {
        console.log(`👤 User: ${userResult.rows[0].name} (${userResult.rows[0].email})`);
        console.log(`🆔 User ID: ${userResult.rows[0].id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
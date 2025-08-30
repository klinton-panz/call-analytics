require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false }
});

async function testAuthentication() {
  try {
    console.log('🧪 Testing API Key Authentication...\n');
    
    // Check if tables exist
    console.log('1. Checking database tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'api_keys', 'calls')
      ORDER BY table_name
    `);
    
    console.log('✅ Tables found:', tablesResult.rows.map(row => row.table_name).join(', '));
    
    // Check users table
    console.log('\n2. Checking users table...');
    const usersResult = await pool.query('SELECT id, email, name FROM users');
    console.log('👥 Users:', usersResult.rows);
    
    // Check API keys table
    console.log('\n3. Checking API keys table...');
    const keysResult = await pool.query('SELECT id, user_id, key, name, revoked FROM api_keys');
    console.log('🔑 API Keys:', keysResult.rows);
    
    // Test the specific API key that should work
    const testKey = 'test-key-123';
    console.log(`\n4. Testing authentication for key: ${testKey}`);
    
    const authResult = await pool.query(
      'SELECT user_id FROM api_keys WHERE key = $1 AND revoked = false LIMIT 1',
      [testKey]
    );
    
    if (authResult.rows.length > 0) {
      console.log('✅ Authentication successful!');
      console.log('👤 User ID:', authResult.rows[0].user_id);
      
      // Get user details
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [authResult.rows[0].user_id]);
      console.log('👤 User details:', userResult.rows[0]);
      
    } else {
      console.log('❌ Authentication failed!');
      console.log('🔍 No valid API key found');
    }
    
    // Test with a non-existent key
    console.log('\n5. Testing with invalid key...');
    const invalidResult = await pool.query(
      'SELECT user_id FROM api_keys WHERE key = $1 AND revoked = false LIMIT 1',
      ['invalid-key-123']
    );
    
    if (invalidResult.rows.length === 0) {
      console.log('✅ Correctly rejected invalid key');
    } else {
      console.log('❌ Invalid key was accepted (this is wrong!)');
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('- Make sure you have a .env file with DATABASE_URL');
    console.log('- Run the setup-db.js script first to create tables');
    console.log('- Use the test API key: test-key-123');
    console.log('- In Postman, set header: x-api-key: test-key-123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testAuthentication(); 
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addCallToCurrentUser() {
  try {
    console.log('🔍 Getting current user session...');
    
    // Get the current session from the browser
    console.log('📱 Please make sure you are logged into your app at http://localhost:3000');
    console.log('🔑 We need to get your user ID from the browser...');
    
    // Since we can't access the browser session directly, let's create a call
    // using the user ID we saw in the network tab
    const userID = '9f9e...'; // This is the user ID from your network tab
    
    console.log('👤 Using user ID from network tab:', userID);
    
    // Create a test call
    const testCall = {
      timestamp: new Date().toISOString(),
      contact_name: 'John Smith',
      phone: '(555) 123-4567',
      direction: 'inbound',
      status: 'Qualified',
      summary: 'Called about pool installation services',
      call_id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userID
    };
    
    console.log('🧪 Creating test call for your user account...');
    
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert([testCall])
      .select();
    
    if (callError) {
      console.error('❌ Error creating call:', callError.message);
      console.log('💡 This might be a permissions issue. Let me try a different approach...');
      
      // Try using the API endpoint instead
      console.log('🔄 Trying to use your API endpoint...');
      console.log('📡 Send this POST request in Postman:');
      console.log('URL: http://localhost:8080/api/calls');
      console.log('Headers: x-api-key: test-key-123');
      console.log('Body:', JSON.stringify({
        contactName: 'John Smith',
        phone: '(555) 123-4567',
        direction: 'inbound',
        status: 'Qualified',
        summary: 'Called about pool installation services'
      }, null, 2));
      
    } else {
      console.log('✅ Test call created successfully!');
      console.log('📞 Call ID:', callData[0].call_id);
      console.log('👤 User ID:', callData[0].user_id);
      
      console.log('\n🎯 Now refresh your dashboard at http://localhost:3000/dashboard');
      console.log('📊 You should see 1 call in your stats!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addCallToCurrentUser();

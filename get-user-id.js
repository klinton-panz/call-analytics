require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getCurrentUser() {
  try {
    console.log('🔍 Getting current user...');
    
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error.message);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session. Please log in to your app first.');
      console.log('💡 Go to http://localhost:3000 and sign in, then run this script again.');
      return;
    }
    
    const user = session.user;
    console.log('✅ User found!');
    console.log('👤 Name:', user.user_metadata?.name || 'N/A');
    console.log('📧 Email:', user.email);
    console.log('🆔 User ID:', user.id);
    
    // Test adding a call
    console.log('\n🧪 Testing call creation...');
    
    const testCall = {
      timestamp: new Date().toISOString(),
      contact_name: 'John Doe',
      phone: '(555) 123-4567',
      direction: 'inbound',
      status: 'Qualified',
      summary: 'Called about pool installation services',
      call_id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert([{ ...testCall, user_id: user.id }])
      .select();
    
    if (callError) {
      console.error('❌ Error creating call:', callError.message);
    } else {
      console.log('✅ Test call created successfully!');
      console.log('📞 Call ID:', callData[0].call_id);
      console.log('📅 Timestamp:', callData[0].timestamp);
      
      console.log('\n🎯 Now refresh your dashboard at http://localhost:3000/dashboard');
      console.log('📊 You should see 1 call in your stats!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

getCurrentUser();

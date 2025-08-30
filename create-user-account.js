require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUserAccount() {
  try {
    console.log('🔍 Creating your user account in the database...');
    
    // Create your user account
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        email: 'essenceklint15@gmail.com',
        name: 'Klinton Panz'
      }])
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Error creating user:', userError.message);
      return;
    }
    
    console.log('✅ User account created:', user);
    
    // Create API key for your account
    const apiKey = `klinton-key-${Date.now()}`;
    
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .insert([{
        user_id: user.id,
        key: apiKey,
        name: 'Klinton Personal API Key'
      }])
      .select()
      .single();
    
    if (keyError) {
      console.error('❌ Error creating API key:', keyError.message);
      return;
    }
    
    console.log('✅ API key created for your account!');
    console.log('🔑 Your API key:', apiKey);
    console.log('💡 Use this in Postman: x-api-key:', apiKey);
    
    // Create a sample call for your account
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert([{
        timestamp: new Date().toISOString(),
        contact_name: 'John Smith',
        phone: '(555) 123-4567',
        direction: 'inbound',
        status: 'Qualified',
        summary: 'Called about pool installation services',
        call_id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        user_id: user.id
      }])
      .select()
      .single();
    
    if (callError) {
      console.error('❌ Error creating sample call:', callError.message);
    } else {
      console.log('✅ Sample call created for your account!');
    }
    
    console.log('\n🎯 Now refresh your dashboard at http://localhost:3000/dashboard');
    console.log('📊 You should see 1 call in your stats!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createUserAccount();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupUserAPIKey() {
  try {
    console.log('🔍 Setting up API key for your user account...');
    
    // First, let's see what users exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    console.log('👥 Users in database:', users);
    
    // Find your user account (the one you're logged in with)
    const yourUser = users.find(user => user.email === 'essenceklint15@gmail.com');
    
    if (!yourUser) {
      console.log('❌ User account not found. Let me check the api_keys table...');
      
      const { data: apiKeys, error: keysError } = await supabase
        .from('api_keys')
        .select('*');
      
      if (keysError) {
        console.error('❌ Error fetching API keys:', keysError.message);
        return;
      }
      
      console.log('🔑 Current API keys:', apiKeys);
      return;
    }
    
    console.log('✅ Found your user account:', yourUser);
    
    // Check if you already have an API key
    const { data: existingKey, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', yourUser.id)
      .single();
    
    if (keyError && keyError.code !== 'PGRST116') {
      console.error('❌ Error checking existing API key:', keyError.message);
      return;
    }
    
    if (existingKey) {
      console.log('✅ You already have an API key:', existingKey.key);
      console.log('💡 Use this key in Postman: x-api-key:', existingKey.key);
    } else {
      // Create a new API key for your account
      const newApiKey = `user-key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const { data: newKey, error: createError } = await supabase
        .from('api_keys')
        .insert([{
          user_id: yourUser.id,
          key: newApiKey,
          name: 'Your Personal API Key'
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating API key:', createError.message);
        return;
      }
      
      console.log('✅ New API key created for your account!');
      console.log('🔑 Your API key:', newApiKey);
      console.log('💡 Use this in Postman: x-api-key:', newApiKey);
    }
    
    console.log('\n🎯 Now you can create calls that will show up in YOUR dashboard!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

setupUserAPIKey();

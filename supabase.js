import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for authentication
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions for calls data
export const calls = {
  // Get calls for current user
  getUserCalls: async (userId, limit = 100) => {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Create new call
  createCall: async (callData, userId) => {
    const { data, error } = await supabase
      .from('calls')
      .insert([{ ...callData, user_id: userId }])
      .select()
    return { data, error }
  },

  // Update call
  updateCall: async (callId, updates, userId) => {
    const { data, error } = await supabase
      .from('calls')
      .update(updates)
      .eq('call_id', callId)
      .eq('user_id', userId)
      .select()
    return { data, error }
  }
}

// Helper functions for API keys
export const apiKeys = {
  // Get user's API key (auto-creates if doesn't exist)
  getUserApiKey: async (userId) => {
    const { data, error } = await supabase
      .rpc('create_user_api_key_if_not_exists', { user_uuid: userId })
    
    if (error) {
      console.error('RPC Error:', error)
      return { data: null, error }
    }
    
    // The RPC returns an array, get the first item
    const apiKeyData = data?.[0]
    if (apiKeyData) {
      return { 
        data: {
          api_key: apiKeyData.api_key,
          key_name: apiKeyData.key_name,
          created_at: apiKeyData.created_at
        }, 
        error: null 
      }
    } else {
      return { data: null, error: null }
    }
  },

  // Get user's API keys (all of them)
  getUserApiKeys: async (userId) => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key, name, created_at, revoked')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

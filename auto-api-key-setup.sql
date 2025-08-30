-- Auto-generate API keys for new users
-- Run this in your Supabase SQL Editor

-- 1. Create a function to generate random API keys
CREATE OR REPLACE FUNCTION generate_api_key() 
RETURNS TEXT AS $$
DECLARE
    chars TEXT[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    -- Generate a 32-character random string
    FOR i IN 1..32 LOOP
        result := result || chars[1+random()*(array_length(chars,1)-1)];
    END LOOP;
    RETURN 'sk_' || result;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function that runs when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user into users table with Supabase auth user data
    INSERT INTO public.users (id, email, name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create an API key for the new user
    INSERT INTO public.api_keys (user_id, key, name, created_at)
    VALUES (
        NEW.id,
        generate_api_key(),
        'Default API Key',
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger that fires on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Update users table to use auth.users ID format
ALTER TABLE public.users ALTER COLUMN id SET DATA TYPE UUID USING id::UUID;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_active ON public.api_keys(key) WHERE revoked = false;

-- 6. Set up Row Level Security policies for the new flow
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;  
CREATE POLICY "Users can view their own API keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

-- 7. For existing users, create API keys (run once)
INSERT INTO public.api_keys (user_id, key, name, created_at)
SELECT 
    u.id,
    generate_api_key(),
    'Default API Key',
    NOW()
FROM public.users u
LEFT JOIN public.api_keys ak ON u.id = ak.user_id
WHERE ak.user_id IS NULL;

-- 8. Create a function to get user's API key (for displaying in dashboard)
CREATE OR REPLACE FUNCTION get_user_api_key(user_uuid UUID)
RETURNS TABLE(api_key TEXT, key_name TEXT, created_at TIMESTAMP) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ak.key, ak.name, ak.created_at
    FROM public.api_keys ak
    WHERE ak.user_id = user_uuid 
    AND ak.revoked = false
    ORDER BY ak.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;
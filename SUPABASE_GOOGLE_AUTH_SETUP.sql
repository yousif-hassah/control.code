-- ============================================================
-- SUPABASE GOOGLE AUTH SETUP
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Enable RLS on profiles and update policies to use auth.uid()
-- This replaces the Clerk-based user ID system with Supabase native auth

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  name TEXT,
  image_url TEXT,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  socials JSONB DEFAULT '{"instagram":"","twitter":"","facebook":""}',
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies (if any)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;

-- 4. New RLS policies using Supabase auth.uid()
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true); -- Allow reading any profile

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Auto-create profile on new user signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, image_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        image_url = COALESCE(EXCLUDED.image_url, profiles.image_url),
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Update group_members RLS to use auth.uid()
ALTER TABLE IF EXISTS group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "allow_all_group_members" ON group_members;

CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (true);

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id OR auth.uid() IS NOT NULL);

-- 7. Update group_messages RLS
ALTER TABLE IF EXISTS group_messages ADD COLUMN IF NOT EXISTS is_instruction BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS group_messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE IF EXISTS group_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_messages_select" ON group_messages;
DROP POLICY IF EXISTS "group_messages_insert" ON group_messages;
DROP POLICY IF EXISTS "allow_all_messages" ON group_messages;

CREATE POLICY "group_messages_select" ON group_messages
  FOR SELECT USING (true);

CREATE POLICY "group_messages_insert" ON group_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Update groups RLS
ALTER TABLE IF EXISTS groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "allow_all_groups" ON groups;

CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (true);

CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 9. Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE group_tasks;

-- DONE! 
-- Next step: Go to Supabase Dashboard > Authentication > Providers
-- Enable Google and add your Client ID & Secret from Google Cloud Console

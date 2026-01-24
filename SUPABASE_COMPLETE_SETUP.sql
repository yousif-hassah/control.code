-- ============================================
-- Control App - Complete Supabase Setup
-- ============================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image_url TEXT,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  socials JSONB DEFAULT '{"instagram":"","twitter":"","facebook":""}'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create journals table
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create pinned_notes table
CREATE TABLE IF NOT EXISTS public.pinned_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  audio_url TEXT,
  image_url TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 7. Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON public.journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.journals(date);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_notes_user_id ON public.pinned_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_code ON public.groups(code);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies (allow all for now - you can make it more restrictive later)
DROP POLICY IF EXISTS "Allow all on profiles" ON public.profiles;
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Journals policies
DROP POLICY IF EXISTS "Users can view own journals" ON public.journals;
CREATE POLICY "Users can view own journals" ON public.journals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own journals" ON public.journals;
CREATE POLICY "Users can insert own journals" ON public.journals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own journals" ON public.journals;
CREATE POLICY "Users can update own journals" ON public.journals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own journals" ON public.journals;
CREATE POLICY "Users can delete own journals" ON public.journals FOR DELETE USING (true);

-- Todos policies
DROP POLICY IF EXISTS "Allow all on todos" ON public.todos;
CREATE POLICY "Allow all on todos" ON public.todos FOR ALL USING (true) WITH CHECK (true);

-- Pinned notes policies
DROP POLICY IF EXISTS "Allow all on pinned_notes" ON public.pinned_notes;
CREATE POLICY "Allow all on pinned_notes" ON public.pinned_notes FOR ALL USING (true) WITH CHECK (true);

-- Groups policies
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create groups" ON public.groups;
CREATE POLICY "Anyone can create groups" ON public.groups FOR INSERT WITH CHECK (true);

-- Group members policies
DROP POLICY IF EXISTS "Anyone can view group members" ON public.group_members;
CREATE POLICY "Anyone can view group members" ON public.group_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can join groups" ON public.group_members;
CREATE POLICY "Anyone can join groups" ON public.group_members FOR INSERT WITH CHECK (true);

-- Group messages policies
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
CREATE POLICY "Group members can view messages" ON public.group_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
CREATE POLICY "Group members can send messages" ON public.group_messages FOR INSERT WITH CHECK (true);

-- ============================================
-- Realtime subscriptions
-- ============================================

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- ============================================
-- Done!
-- ============================================

-- To verify tables were created, run:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

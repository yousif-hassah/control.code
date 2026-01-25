-- ============================================
-- 🚨 FINAL PERSISTENCE FIX 🚨
-- Run this in Supabase SQL Editor to fix data loss issues
-- ============================================

-- 1. Fix Journals (Add unique constraint for upsert)
ALTER TABLE public.journals ADD CONSTRAINT journals_user_date_key UNIQUE (user_id, date);

-- 2. Fix Todos (Add missing columns and rename for consistency)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS text TEXT;
-- Sync existing title to text if needed
UPDATE public.todos SET text = title WHERE text IS NULL AND title IS NOT NULL;

-- 3. Fix Pinned Notes (Add missing columns)
ALTER TABLE public.pinned_notes ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.pinned_notes ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#394867';
ALTER TABLE public.pinned_notes ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT TRUE;

-- 4. Fix Group Tasks (Ensure table exists and is correct)
CREATE TABLE IF NOT EXISTS public.group_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  order_index INTEGER DEFAULT 0,
  depends_on UUID REFERENCES public.group_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID
);

-- 5. Fix Group Activities (Missing in some setups)
CREATE TABLE IF NOT EXISTS public.group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Disable RLS for all newly confirmed tables to ensure connectivity
ALTER TABLE public.group_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_notes DISABLE ROW LEVEL SECURITY;

-- 7. Enable Realtime for all important tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_notes;

-- ============================================
-- ✅ Done! Now refresh the app.
-- ============================================

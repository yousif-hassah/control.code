-- ============================================================
-- Fix ALL Database Issues at Once
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Fix group_tasks: change completed_by to TEXT to accept any user ID format
ALTER TABLE public.group_tasks ALTER COLUMN completed_by TYPE TEXT;
ALTER TABLE public.group_tasks ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE public.group_tasks ALTER COLUMN created_by TYPE TEXT;

-- 2. Fix group_tasks: make sure RLS is disabled
ALTER TABLE public.group_tasks DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.group_tasks TO anon;
GRANT ALL ON public.group_tasks TO authenticated;

-- 3. Fix group_members: change user_id to TEXT
ALTER TABLE public.group_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.group_members TO anon;
GRANT ALL ON public.group_members TO authenticated;

-- 4. Fix groups table
ALTER TABLE public.groups ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.groups TO anon;
GRANT ALL ON public.groups TO authenticated;

-- 5. Fix group_messages
ALTER TABLE public.group_messages ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.group_messages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.group_messages TO anon;
GRANT ALL ON public.group_messages TO authenticated;

-- 6. Fix group_activities
ALTER TABLE public.group_activities ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.group_activities DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.group_activities TO anon;
GRANT ALL ON public.group_activities TO authenticated;

-- 7. Create group_notifications table (for realtime alerts)
CREATE TABLE IF NOT EXISTS public.group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'message',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.group_notifications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.group_notifications TO anon;
GRANT ALL ON public.group_notifications TO authenticated;

-- 8. Enable Realtime for notifications
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_notifications;
EXCEPTION WHEN others THEN
  NULL; -- ignore if already added
END $$;

-- 9. Enable Realtime for tasks and messages
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_tasks;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Done!
SELECT 'All fixes applied successfully ✅' AS status;

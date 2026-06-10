-- ============================================
-- Fix: Realtime Notification Bus
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create group_notifications table
CREATE TABLE IF NOT EXISTS public.group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT,        -- NULL = all members, TEXT = specific user
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'message', -- 'message', 'task', 'task_complete', 'system'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index for fast queries
CREATE INDEX IF NOT EXISTS idx_group_notifications_group_id ON public.group_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_group_notifications_recipient ON public.group_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_group_notifications_created ON public.group_notifications(created_at DESC);

-- 3. Disable RLS for simplicity (allow all)
ALTER TABLE public.group_notifications DISABLE ROW LEVEL SECURITY;

-- 4. Grant access
GRANT ALL ON public.group_notifications TO anon;
GRANT ALL ON public.group_notifications TO authenticated;

-- 5. Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_notifications;

-- Done!
SELECT 'group_notifications table created and realtime enabled ✅' AS status;

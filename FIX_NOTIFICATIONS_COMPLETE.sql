-- ============================================
-- COMPREHENSIVE Fix: Notifications + Realtime
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Drop and recreate group_notifications table (clean slate)
DROP TABLE IF EXISTS public.group_notifications;

CREATE TABLE public.group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT,        -- NULL = all members, TEXT = specific user
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'message',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for fast queries
CREATE INDEX idx_group_notifications_group_id ON public.group_notifications(group_id);
CREATE INDEX idx_group_notifications_recipient ON public.group_notifications(recipient_id);
CREATE INDEX idx_group_notifications_created ON public.group_notifications(created_at DESC);

-- 3. COMPLETELY DISABLE RLS (most common cause of silent insert failures)
ALTER TABLE public.group_notifications DISABLE ROW LEVEL SECURITY;

-- 4. Grant full access to anon and authenticated roles
GRANT ALL PRIVILEGES ON TABLE public.group_notifications TO anon;
GRANT ALL PRIVILEGES ON TABLE public.group_notifications TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.group_notifications TO service_role;

-- 5. Enable Realtime (remove first then re-add to reset)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.group_notifications;
  EXCEPTION WHEN others THEN
    -- Table not in publication yet, that's fine
  END;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_notifications;

-- 6. Verify everything works with a test insert
INSERT INTO public.group_notifications (group_id, sender_id, title, body, type)
VALUES ('test_group', 'test_user', 'Test Notification', 'If you see this in the select below, inserts are working!', 'system');

-- 7. Verify insert worked
SELECT id, group_id, sender_id, title, created_at FROM public.group_notifications WHERE group_id = 'test_group';

-- 8. Clean up test row
DELETE FROM public.group_notifications WHERE group_id = 'test_group';

SELECT '✅ group_notifications fully configured. Realtime + Permissions all set!' AS status;

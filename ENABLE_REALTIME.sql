-- ============================================
-- 🔧 ENABLE REALTIME FOR GROUP TABLES
-- Run this SEPARATELY after running FIX_ALL_ISSUES_WORKING.sql
-- ============================================

-- Note: In Supabase, you need to enable Realtime from the Dashboard
-- Go to: Database > Replication > Enable for these tables:
-- 1. group_messages
-- 2. group_tasks
-- 3. group_members
-- 4. group_activities

-- OR run these commands one by one in SQL Editor:

-- Enable Realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Enable Realtime for group_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_tasks;

-- Enable Realtime for group_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Enable Realtime for group_activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_activities;

-- ============================================
-- ✅ DONE! Realtime enabled for all group tables.
-- ============================================

-- =============================================
-- إصلاح RLS للعمل مع Clerk (وليس Supabase Auth)
-- قم بتشغيل هذا في Supabase → SQL Editor
-- =============================================

-- ① إيقاف RLS على جميع الجداول
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_notes DISABLE ROW LEVEL SECURITY;

-- ② حذف السياسات القديمة
DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
DROP POLICY IF EXISTS "Anyone can create groups" ON groups;
DROP POLICY IF EXISTS "Only creator can delete groups" ON groups;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Anyone can join groups" ON group_members;
DROP POLICY IF EXISTS "Members can leave groups" ON group_members;
DROP POLICY IF EXISTS "Members can view messages" ON group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;

-- ③ منح صلاحيات كاملة للـ anon key
GRANT ALL ON groups TO anon;
GRANT ALL ON group_members TO anon;
GRANT ALL ON group_messages TO anon;
GRANT ALL ON group_tasks TO anon;
GRANT ALL ON group_files TO anon;
GRANT ALL ON group_activities TO anon;
GRANT ALL ON profiles TO anon;
GRANT ALL ON todos TO anon;
GRANT ALL ON journals TO anon;
GRANT ALL ON pinned_notes TO anon;

-- =============================================
-- تم الإصلاح ✅ (تم حذف أسطر Realtime لأنها مضافة مسبقاً)
-- =============================================

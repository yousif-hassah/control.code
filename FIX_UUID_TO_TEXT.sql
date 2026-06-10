-- =============================================
-- الحل الكامل: حذف FK Constraints ثم تغيير الأنواع
-- =============================================

-- ① حذف جميع Foreign Key Constraints أولاً
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_user_id_fkey;
ALTER TABLE journals DROP CONSTRAINT IF EXISTS journals_user_id_fkey;
ALTER TABLE pinned_notes DROP CONSTRAINT IF EXISTS pinned_notes_user_id_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE group_messages DROP CONSTRAINT IF EXISTS group_messages_user_id_fkey;
ALTER TABLE group_messages DROP CONSTRAINT IF EXISTS group_messages_group_id_fkey;
ALTER TABLE group_tasks DROP CONSTRAINT IF EXISTS group_tasks_created_by_fkey;
ALTER TABLE group_tasks DROP CONSTRAINT IF EXISTS group_tasks_assigned_to_fkey;
ALTER TABLE group_tasks DROP CONSTRAINT IF EXISTS group_tasks_completed_by_fkey;
ALTER TABLE group_tasks DROP CONSTRAINT IF EXISTS group_tasks_group_id_fkey;
ALTER TABLE group_files DROP CONSTRAINT IF EXISTS group_files_user_id_fkey;
ALTER TABLE group_files DROP CONSTRAINT IF EXISTS group_files_group_id_fkey;
ALTER TABLE group_activities DROP CONSTRAINT IF EXISTS group_activities_user_id_fkey;
ALTER TABLE group_activities DROP CONSTRAINT IF EXISTS group_activities_group_id_fkey;

-- ② تغيير نوع profiles.id من UUID إلى TEXT (الأساس)
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- ③ تغيير باقي الأعمدة
ALTER TABLE groups ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE group_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE group_messages ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE group_tasks ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE group_tasks ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE group_tasks ALTER COLUMN completed_by TYPE TEXT;
ALTER TABLE group_files ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE group_activities ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE todos ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE journals ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE pinned_notes ALTER COLUMN user_id TYPE TEXT;

-- =============================================
-- تم الإصلاح ✅
-- =============================================

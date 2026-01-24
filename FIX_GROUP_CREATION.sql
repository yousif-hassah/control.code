-- ============================================
-- إصلاح مشكلة إنشاء المجموعات
-- ============================================

-- 1. التحقق من جدول groups
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'groups';

-- 2. إزالة Foreign Key من created_by إذا كان موجوداً
-- (لأن user.uid قد لا يكون UUID)
ALTER TABLE groups 
  ALTER COLUMN created_by TYPE TEXT;

-- 3. التأكد من أن جدول group_members يقبل TEXT لـ user_id
ALTER TABLE group_members
  ALTER COLUMN user_id TYPE TEXT;

-- 4. التأكد من أن جدول group_tasks يقبل TEXT
ALTER TABLE group_tasks
  ALTER COLUMN created_by TYPE TEXT,
  ALTER COLUMN assigned_to TYPE TEXT;

-- 5. التأكد من أن جدول group_messages يقبل TEXT
ALTER TABLE group_messages
  ALTER COLUMN user_id TYPE TEXT;

-- 6. التأكد من أن جدول group_files يقبل TEXT
ALTER TABLE group_files
  ALTER COLUMN uploaded_by TYPE TEXT;

-- 7. التأكد من أن جدول group_activities يقبل TEXT
ALTER TABLE group_activities
  ALTER COLUMN user_id TYPE TEXT;

-- 8. التأكد من أن جدول group_notifications يقبل TEXT
ALTER TABLE group_notifications
  ALTER COLUMN user_id TYPE TEXT,
  ALTER COLUMN created_by TYPE TEXT;

-- ============================================
-- اختبار إنشاء مجموعة
-- ============================================
-- يمكنك اختبار إنشاء مجموعة يدوياً:
-- INSERT INTO groups (name, code, created_by) 
-- VALUES ('Test Group', 'ABC123', 'test_user_id');

-- ============================================
-- ملاحظات:
-- ============================================
-- - تم تغيير جميع الأعمدة التي تحتوي على user_id إلى TEXT
-- - هذا يسمح باستخدام أي نوع من المعرفات (UUID أو String)
-- - RLS معطل مؤقتاً للتطوير

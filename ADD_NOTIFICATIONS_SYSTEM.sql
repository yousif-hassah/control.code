-- ============================================
-- إضافة نظام الإشعارات للمجموعات
-- ============================================

-- 1. إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- المستخدم الذي سيستلم الإشعار
  type TEXT NOT NULL, -- نوع الإشعار: 'task_completed', 'task_assigned', 'new_message', 'file_uploaded'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- معرف المهمة أو الرسالة المتعلقة
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL -- المستخدم الذي تسبب في الإشعار
);

-- 2. إنشاء Index لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_group_notifications_user 
  ON group_notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_group_notifications_group 
  ON group_notifications(group_id, created_at DESC);

-- 3. تعطيل RLS مؤقتاً للتطوير
ALTER TABLE group_notifications DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ملاحظات:
-- ============================================
-- - عند إكمال مهمة، سيتم إنشاء إشعار لجميع أعضاء المجموعة
-- - عند تعيين مهمة، سيتم إنشاء إشعار للشخص المعين
-- - عند إرسال رسالة، يمكن إنشاء إشعار (اختياري)
-- - الإشعارات تُحفظ في قاعدة البيانات ويمكن عرضها في التطبيق

-- ============================================
-- اختبار الجدول
-- ============================================
-- SELECT * FROM group_notifications ORDER BY created_at DESC;

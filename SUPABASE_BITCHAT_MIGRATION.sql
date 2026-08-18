-- ============================================================
-- SUPABASE_BITCHAT_MIGRATION.sql
-- Incremental non-destructive migration script for bitchat integration
-- ============================================================

-- 1. Add bitchat protocol columns to group_messages if they do not exist
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS ciphertext TEXT;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS signature TEXT;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS protocol_version INT DEFAULT 1;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS hop_count INT DEFAULT 0;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'synced';

-- 2. Create index on status & device_id for query performance
CREATE INDEX IF NOT EXISTS idx_group_messages_device_id ON group_messages(device_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_status ON group_messages(status);

-- 3. Verify Realtime publication includes group_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
  END IF;
END $$;

-- ============================================================
-- Migration Complete ✅
-- ============================================================

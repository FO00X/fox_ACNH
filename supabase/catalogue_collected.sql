-- 图鉴点亮记录表（单独执行，用于已有项目新增）
-- 在 Supabase Dashboard > SQL Editor 中执行

CREATE TABLE IF NOT EXISTS catalogue_collected (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, item_id)
);

ALTER TABLE catalogue_collected ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalogue_collected_select" ON catalogue_collected;
DROP POLICY IF EXISTS "catalogue_collected_insert" ON catalogue_collected;
DROP POLICY IF EXISTS "catalogue_collected_delete" ON catalogue_collected;
CREATE POLICY "catalogue_collected_select" ON catalogue_collected FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "catalogue_collected_insert" ON catalogue_collected FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "catalogue_collected_delete" ON catalogue_collected FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_collected_user_category ON catalogue_collected(user_id, category);

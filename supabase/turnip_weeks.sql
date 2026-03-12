-- 大头菜周数据表（用于同步/跨设备）
-- 在 Supabase Dashboard > SQL Editor 中执行

CREATE TABLE IF NOT EXISTS turnip_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  buy_price INTEGER NOT NULL DEFAULT 0,
  prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE turnip_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "turnip_weeks_select" ON turnip_weeks;
DROP POLICY IF EXISTS "turnip_weeks_insert" ON turnip_weeks;
DROP POLICY IF EXISTS "turnip_weeks_update" ON turnip_weeks;
CREATE POLICY "turnip_weeks_select" ON turnip_weeks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "turnip_weeks_insert" ON turnip_weeks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "turnip_weeks_update" ON turnip_weeks FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_turnip_weeks_user_week_start ON turnip_weeks(user_id, week_start);


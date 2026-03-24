-- =============================================================================
-- 全员动态：记录岛民在应用内的公开动作（聊天室时间线展示）
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON public.activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_kind ON public.activity_events(kind);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_events_select" ON public.activity_events;
CREATE POLICY "activity_events_select" ON public.activity_events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "activity_events_insert" ON public.activity_events;
CREATE POLICY "activity_events_insert" ON public.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 实时推送：在 Supabase Dashboard → Database → Publications 中
-- 将 activity_events 加入 supabase_realtime，聊天页才能即时看到他人动态。

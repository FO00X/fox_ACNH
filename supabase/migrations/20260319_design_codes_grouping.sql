-- =============================================================================
-- 设计码分享功能升级：支持“一个设计码 = 一个图片集合”
-- 创建时间: 2026-03-19
--
-- 目标：
-- - design_codes 增加 group_id（用于把多张图片归为同一个集合）
-- - design_codes 增加 design_code（MA-xxxx-xxxx-xxxx / MO-xxxx-xxxx-xxxx）
-- - 兼容旧数据：为旧行回填 group_id
-- - 默认所有登录用户互可见（不再依赖 friendships）
-- =============================================================================

-- 1) 增加字段（兼容重复执行）
ALTER TABLE public.design_codes
  ADD COLUMN IF NOT EXISTS group_id UUID,
  ADD COLUMN IF NOT EXISTS design_code TEXT;

-- 2) 回填旧数据：group_id 为空时用本行 id 作为 group_id，确保“旧的单图记录”也能被分组展示
UPDATE public.design_codes
SET group_id = id
WHERE group_id IS NULL;

-- 3) 设为 NOT NULL（若表很大，这一步可能锁表较久；可按需拆分）
ALTER TABLE public.design_codes
  ALTER COLUMN group_id SET NOT NULL;

-- 4) 索引（按分组+类型/用户查询会更快）
CREATE INDEX IF NOT EXISTS idx_design_codes_group_id ON public.design_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_design_codes_user_group ON public.design_codes(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_design_codes_type_group ON public.design_codes(code_type, group_id);

-- 5) RLS：默认所有登录用户可读
ALTER TABLE public.design_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "design_codes_select" ON public.design_codes;
CREATE POLICY "design_codes_select" ON public.design_codes FOR SELECT
  TO authenticated
  USING (true);

-- 其余策略保持“只能操作自己的记录”
-- （如果你之前已存在同名策略，这里不覆盖；需要的话可自行 DROP/CREATE）


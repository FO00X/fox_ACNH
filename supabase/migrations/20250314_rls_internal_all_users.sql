-- =============================================================================
-- 内部使用：默认所有登录用户互可见，不再依赖 friendships 表
-- 在 Supabase SQL Editor 中执行此文件
-- =============================================================================

-- wishlist_items: 任意登录用户可查看、可帮别人划掉
DROP POLICY IF EXISTS "wishlist_select" ON wishlist_items;
CREATE POLICY "wishlist_select" ON wishlist_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "wishlist_fulfill" ON wishlist_items;
CREATE POLICY "wishlist_fulfill" ON wishlist_items FOR UPDATE
  TO authenticated USING (true)
  WITH CHECK (true);

-- island_progress: 任意登录用户可查看
DROP POLICY IF EXISTS "island_progress_select" ON island_progress;
CREATE POLICY "island_progress_select" ON island_progress FOR SELECT
  TO authenticated USING (true);

-- island_residents: 任意登录用户可查看
DROP POLICY IF EXISTS "island_residents_select" ON island_residents;
CREATE POLICY "island_residents_select" ON island_residents FOR SELECT
  TO authenticated USING (true);

-- catalog_progress: 任意登录用户可查看
DROP POLICY IF EXISTS "catalog_progress_select" ON catalog_progress;
CREATE POLICY "catalog_progress_select" ON catalog_progress FOR SELECT
  TO authenticated USING (true);

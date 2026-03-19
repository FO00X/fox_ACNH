-- =============================================================================
-- 设计码分享功能 - 数据库迁移
-- 创建时间: 2025-03-19
-- 说明: 为动森设计码分享功能创建所需的表、存储桶和RLS策略
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 创建设计码表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS design_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_type TEXT NOT NULL CHECK (code_type IN ('clothing', 'tile')),
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_design_codes_user_id ON design_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_design_codes_code_type ON design_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_design_codes_user_type ON design_codes(user_id, code_type);

-- -----------------------------------------------------------------------------
-- 2. 启用 RLS
-- -----------------------------------------------------------------------------
ALTER TABLE design_codes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. RLS 策略
-- -----------------------------------------------------------------------------

-- 查询策略：默认所有登录用户互可见（不再依赖 friendships）
DROP POLICY IF EXISTS "design_codes_select" ON design_codes;
CREATE POLICY "design_codes_select" ON design_codes FOR SELECT
  TO authenticated
  USING (true);

-- 插入策略：只能插入自己的设计码
CREATE POLICY "design_codes_insert" ON design_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新策略：只能更新自己的设计码
CREATE POLICY "design_codes_update" ON design_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- 删除策略：只能删除自己的设计码
CREATE POLICY "design_codes_delete" ON design_codes FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. 创建存储桶（需要在 Supabase Dashboard 中手动创建或使用 Storage API）
-- 注意：以下 SQL 需要在 Supabase 的 SQL Editor 中执行，或使用 Storage API
-- -----------------------------------------------------------------------------

/*
-- 创建存储桶的 SQL（如果支持）
-- 注意：Supabase 的 SQL 编辑器可能不支持直接创建存储桶，
-- 建议在 Supabase Dashboard > Storage 中手动创建，或使用以下方法：

-- 方法1：在 Supabase Dashboard 中手动创建
-- 1. 进入 Storage
-- 2. 点击 "New bucket"
-- 3. 输入名称: design-codes
-- 4. 设置为 Public bucket
-- 5. 创建

-- 方法2：使用 Storage API（推荐在应用初始化时执行）
-- 这需要在应用中调用 supabase.storage.createBucket()
*/

-- -----------------------------------------------------------------------------
-- 5. 存储桶 RLS 策略（在创建存储桶后设置）
-- -----------------------------------------------------------------------------

/*
-- 在 Supabase Dashboard > Storage > design-codes > Policies 中添加以下策略：

-- 上传策略：
-- Name: Allow upload own files
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy definition: (auth.uid())::text = (storage.foldername(name))[1]

-- 查看策略：
-- Name: Allow public view
-- Allowed operation: SELECT
-- Target roles: anon, authenticated
-- Policy definition: true

-- 删除策略：
-- Name: Allow delete own files
-- Allowed operation: DELETE
-- Target roles: authenticated
-- Policy definition: (auth.uid())::text = (storage.foldername(name))[1]
*/

-- -----------------------------------------------------------------------------
-- 6. 使用说明
-- -----------------------------------------------------------------------------
/*
部署步骤：

1. 在 Supabase Dashboard 中执行此 SQL 文件

2. 创建 Storage 存储桶：
   - 进入 Storage 页面
   - 点击 "New bucket"
   - Bucket name: design-codes
   - 勾选 "Public bucket"
   - 点击 "Create bucket"

3. 设置存储桶策略（在 Storage > design-codes > Policies 中）：
   
   上传策略：
   - 点击 "New policy"
   - 选择 "For full customization..."
   - Policy name: Allow upload own files
   - Allowed operation: INSERT
   - Target roles: authenticated
   - Policy definition: (auth.uid())::text = (storage.foldername(name))[1]
   
   查看策略：
   - Policy name: Allow public view
   - Allowed operation: SELECT
   - Target roles: anon, authenticated
   - Policy definition: true
   
   删除策略：
   - Policy name: Allow delete own files
   - Allowed operation: DELETE
   - Target roles: authenticated
   - Policy definition: (auth.uid())::text = (storage.foldername(name))[1]

4. 完成！设计码功能已启用
*/

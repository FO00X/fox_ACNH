-- =============================================================================
-- 动森小岛 - Supabase 数据库 Schema（单文件）
-- 在 Supabase Dashboard > SQL Editor 中执行。后续需要修改时再新增/追加 SQL。
-- =============================================================================

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 用户资料表（与 auth.users 关联，含护照字段）
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  island_name TEXT DEFAULT '未命名小岛',
  avatar_url TEXT,
  hemisphere TEXT CHECK (hemisphere IS NULL OR hemisphere IN ('north', 'south')),
  birthday DATE,
  friend_code TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 好友关系表
-- -----------------------------------------------------------------------------
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- -----------------------------------------------------------------------------
-- 愿望清单（材料/家具/其他）
-- -----------------------------------------------------------------------------
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('material', 'furniture', 'other')),
  quantity INTEGER DEFAULT 1,
  note TEXT,
  is_fulfilled BOOLEAN DEFAULT FALSE,
  fulfilled_by UUID REFERENCES profiles(id),
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 岛建进度表
-- -----------------------------------------------------------------------------
CREATE TABLE island_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  description TEXT,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area_name)
);

-- -----------------------------------------------------------------------------
-- 岛上居民表
-- -----------------------------------------------------------------------------
CREATE TABLE island_residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resident_name TEXT NOT NULL,
  species TEXT,
  personality TEXT,
  photo_url TEXT,
  is_dreamie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 图鉴点亮记录表
-- -----------------------------------------------------------------------------
CREATE TABLE catalogue_collected (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, item_id)
);
CREATE INDEX idx_catalogue_collected_user_category ON catalogue_collected(user_id, category);

-- -----------------------------------------------------------------------------
-- 图鉴进度表（鱼类、昆虫、化石等）
-- -----------------------------------------------------------------------------
CREATE TABLE catalog_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  catalog_type TEXT NOT NULL CHECK (catalog_type IN ('fish', 'insect', 'fossil', 'art', 'sea_creature')),
  total_count INTEGER DEFAULT 0,
  collected_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, catalog_type)
);

-- -----------------------------------------------------------------------------
-- 大头菜周数据表
-- -----------------------------------------------------------------------------
CREATE TABLE turnip_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  buy_price INTEGER NOT NULL DEFAULT 0,
  prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);
CREATE INDEX idx_turnip_weeks_user_week_start ON turnip_weeks(user_id, week_start);

-- -----------------------------------------------------------------------------
-- 看板留言表
-- -----------------------------------------------------------------------------
CREATE TABLE board_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'message' CHECK (post_type IN ('message', 'wishlist_request')),
  related_item_id UUID REFERENCES wishlist_items(id) ON DELETE SET NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- RLS 启用
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE island_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE island_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_collected ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnip_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS 策略
-- =============================================================================

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- friendships
CREATE POLICY "friendships_all" ON friendships FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- wishlist_items
CREATE POLICY "wishlist_select" ON wishlist_items FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = wishlist_items.user_id AND f.status = 'accepted')
         OR (f.friend_id = auth.uid() AND f.user_id = wishlist_items.user_id AND f.status = 'accepted')
    )
  );
CREATE POLICY "wishlist_insert" ON wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlist_update" ON wishlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishlist_delete" ON wishlist_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "wishlist_fulfill" ON wishlist_items FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = wishlist_items.user_id AND f.status = 'accepted')
         OR (f.friend_id = auth.uid() AND f.user_id = wishlist_items.user_id AND f.status = 'accepted')
    )
  );

-- island_progress
CREATE POLICY "island_progress_select" ON island_progress FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = island_progress.user_id AND f.status = 'accepted')
         OR (f.friend_id = auth.uid() AND f.user_id = island_progress.user_id AND f.status = 'accepted')
    )
  );
CREATE POLICY "island_progress_all" ON island_progress FOR ALL USING (auth.uid() = user_id);

-- island_residents
CREATE POLICY "island_residents_select" ON island_residents FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = island_residents.user_id AND f.status = 'accepted')
         OR (f.friend_id = auth.uid() AND f.user_id = island_residents.user_id AND f.status = 'accepted')
    )
  );
CREATE POLICY "island_residents_all" ON island_residents FOR ALL USING (auth.uid() = user_id);

-- catalogue_collected
CREATE POLICY "catalogue_collected_select" ON catalogue_collected FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "catalogue_collected_insert" ON catalogue_collected FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "catalogue_collected_delete" ON catalogue_collected FOR DELETE USING (auth.uid() = user_id);

-- catalog_progress
CREATE POLICY "catalog_progress_select" ON catalog_progress FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = catalog_progress.user_id AND f.status = 'accepted')
         OR (f.friend_id = auth.uid() AND f.user_id = catalog_progress.user_id AND f.status = 'accepted')
    )
  );
CREATE POLICY "catalog_progress_all" ON catalog_progress FOR ALL USING (auth.uid() = user_id);

-- turnip_weeks
CREATE POLICY "turnip_weeks_select" ON turnip_weeks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "turnip_weeks_insert" ON turnip_weeks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "turnip_weeks_update" ON turnip_weeks FOR UPDATE USING (auth.uid() = user_id);

-- board_posts
CREATE POLICY "board_posts_all" ON board_posts FOR ALL
  USING (auth.uid() = author_id OR auth.uid() = target_id);

-- =============================================================================
-- 触发器：新用户自动创建 profile
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, island_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '岛民'),
    COALESCE(NEW.raw_user_meta_data->>'island_name', '未命名小岛')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

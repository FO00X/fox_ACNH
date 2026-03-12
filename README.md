# 🌴 动森小岛记录

与好友一起记录你的 Animal Crossing: New Horizons 岛屿！追踪缺少的材料和家具、岛建进度、岛上居民、图鉴收集进度。好友之间可以互相查看数据，在看板上留言，送完材料/家具后可以划掉。

## 功能

- **材料/家具愿望清单**：记录缺少的物品，好友可以查看并标记已送达
- **岛建进度**：按区域记录完成百分比
- **岛上居民**：记录动物邻居，支持标记梦寐以求
- **图鉴进度**：鱼类、昆虫、化石、艺术品、海洋生物
- **好友看板**：查看好友缺少什么，留言，送完后划掉
- **好友系统**：通过邮箱或昵称添加好友

## 技术栈

- Vue 3 + Vite 6
- Tailwind CSS 4 + DaisyUI 5
- Supabase (认证 + 数据库)
- Pinia + Vue Router

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 复制 `.env.example` 为 `.env`
2. 填写你的 Supabase Publishable Key (anon key)：
   ```
   VITE_SUPABASE_URL=https://xeyvxbogojyqzmqpnpwz.supabase.co
   VITE_SUPABASE_ANON_KEY=你的Publishable_Key
   ```

3. 在 [Supabase Dashboard](https://supabase.com/dashboard) 的 SQL Editor 中执行 `supabase/schema.sql` 创建数据库表

### 3. 运行

```bash
npm run dev
```

## 数据库 Schema

执行 `supabase/schema.sql` 会创建：

- `profiles` - 用户资料（昵称、小岛名、邮箱）
- `friendships` - 好友关系
- `wishlist_items` - 材料/家具愿望清单
- `island_progress` - 岛建进度
- `island_residents` - 岛上居民
- `catalog_progress` - 图鉴进度
- `board_posts` - 看板留言

## 设计风格

参考 [Animal Crossing 官网](https://www.animal-crossing.com/) 的可爱风格，使用绿色系主色、圆角卡片、柔和阴影。

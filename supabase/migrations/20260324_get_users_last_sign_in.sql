-- 创建函数获取用户的最后登录时间
-- 需要在 Supabase Dashboard > SQL Editor 中执行

CREATE OR REPLACE FUNCTION get_users_last_sign_in(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.last_sign_in_at
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- 授予权限
GRANT EXECUTE ON FUNCTION get_users_last_sign_in(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_last_sign_in(UUID[]) TO anon;

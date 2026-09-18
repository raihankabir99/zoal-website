-- Blog likes: server-only mutation with atomic count synchronization.
-- Safe to apply after 062/blog_live_security_cleanup_20260918.

CREATE UNIQUE INDEX IF NOT EXISTS zoal_blog_likes_post_identifier_uidx
  ON public.zoal_blog_likes(post_id, user_identifier);

CREATE OR REPLACE FUNCTION public.toggle_blog_like(
  p_post_id UUID,
  p_user_identifier TEXT
)
RETURNS TABLE(liked BOOLEAN, like_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_liked BOOLEAN;
  v_count INTEGER;
BEGIN
  IF p_post_id IS NULL OR p_user_identifier IS NULL OR length(trim(p_user_identifier)) = 0 THEN
    RAISE EXCEPTION 'post_id and user_identifier are required';
  END IF;

  SELECT (status = 'active')
    INTO v_liked
    FROM public.zoal_blog_likes
   WHERE post_id = p_post_id
     AND user_identifier = p_user_identifier
   FOR UPDATE;

  IF COALESCE(v_liked, false) THEN
    UPDATE public.zoal_blog_likes
       SET status = 'inactive', updated_at = now()
     WHERE post_id = p_post_id
       AND user_identifier = p_user_identifier;
    v_liked := false;
  ELSE
    INSERT INTO public.zoal_blog_likes(post_id, user_identifier, status, created_at, updated_at)
    VALUES (p_post_id, p_user_identifier, 'active', now(), now())
    ON CONFLICT (post_id, user_identifier)
    DO UPDATE SET status = 'active', updated_at = now();
    v_liked := true;
  END IF;

  SELECT count(*)::INTEGER
    INTO v_count
    FROM public.zoal_blog_likes
   WHERE post_id = p_post_id
     AND status = 'active';

  UPDATE public.zoal_blog_posts
     SET like_count = v_count, updated_at = now()
   WHERE id = p_post_id;

  RETURN QUERY SELECT v_liked, v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_blog_like(UUID, TEXT) FROM PUBLIC, anon, authenticated;

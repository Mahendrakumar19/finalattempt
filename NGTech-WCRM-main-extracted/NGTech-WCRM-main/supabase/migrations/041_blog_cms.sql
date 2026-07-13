-- ============================================================
-- 041_blog_cms.sql
-- Creates the blog_posts table for the Admin CMS
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Uncategorized',
  author_name TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY blog_posts_select_published ON blog_posts
  FOR SELECT USING (status = 'published');

-- Platform Admins can read everything
CREATE POLICY blog_posts_select_admin ON blog_posts
  FOR SELECT USING (is_platform_admin());

-- Platform Admins have full access (insert/update/delete)
CREATE POLICY blog_posts_all_admin ON blog_posts
  FOR ALL USING (is_platform_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

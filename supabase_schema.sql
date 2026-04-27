-- 1. 案件（プロジェクト）テーブル
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 画像（クリエイティブ）テーブル
CREATE TABLE public.project_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. スワイプログテーブル
CREATE TABLE public.swipe_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  image_id uuid REFERENCES public.project_images(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase Auth のユーザーID
  decision text NOT NULL CHECK (decision IN ('Good', 'Bad')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, image_id, user_id) -- 1人のユーザーは1枚の画像を1回しか判定できない
);

-- RLS (Row Level Security) の有効化
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_logs ENABLE ROW LEVEL SECURITY;

-- 簡易的なセキュリティポリシー (初期開発用: ログインしていれば読み書きフルアクセス)
CREATE POLICY "Enable ALL for authenticated users" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users" ON public.project_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated users" ON public.swipe_logs FOR ALL USING (auth.role() = 'authenticated');

-- Storageバケットの作成（画像アップロード用）
insert into storage.buckets (id, name, public) values ('creatives', 'creatives', true);

-- Storageアクセス権限 (ログイン済みユーザーのみアップロード可能、全体公開設定)
CREATE POLICY "Enable ALL for authenticated users on Storage" ON storage.objects FOR ALL USING (auth.role() = 'authenticated' AND bucket_id = 'creatives');

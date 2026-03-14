
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.book_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.shelf_type AS ENUM ('favorite', 'read', 'want_to_read');
CREATE TYPE public.download_content_type AS ENUM ('text', 'audio', 'both');
CREATE TYPE public.subscription_type AS ENUM ('free', 'pro_monthly', 'pro_yearly');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========== BOOKS ==========
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  why_read JSONB DEFAULT '[]'::jsonb,
  about_author TEXT,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  read_time_min INTEGER DEFAULT 0,
  listen_time_min INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  status book_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published books are viewable by everyone"
  ON public.books FOR SELECT
  USING (status = 'published');

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== SUMMARIES ==========
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  content TEXT,
  audio_url TEXT,
  audio_size_bytes BIGINT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id)
);

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Summaries viewable for published books"
  ON public.summaries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND status = 'published'));

CREATE TRIGGER update_summaries_updated_at
  BEFORE UPDATE ON public.summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== KEY IDEAS ==========
CREATE TABLE public.key_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.key_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Key ideas viewable for published books"
  ON public.key_ideas FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND status = 'published'));

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policies for books, summaries, key_ideas
CREATE POLICY "Admins can manage books"
  ON public.books FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage summaries"
  ON public.summaries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage key ideas"
  ON public.key_ideas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== USER PROGRESS ==========
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  last_position TEXT,
  audio_position NUMERIC(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own progress"
  ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== USER SHELVES ==========
CREATE TABLE public.user_shelves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  shelf shelf_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, shelf)
);

ALTER TABLE public.user_shelves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shelves"
  ON public.user_shelves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shelves"
  ON public.user_shelves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own shelves"
  ON public.user_shelves FOR DELETE USING (auth.uid() = user_id);

-- ========== USER HIGHLIGHTS ==========
CREATE TABLE public.user_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own highlights"
  ON public.user_highlights FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own highlights"
  ON public.user_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON public.user_highlights FOR DELETE USING (auth.uid() = user_id);

-- ========== USER DOWNLOADS ==========
CREATE TABLE public.user_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  content_type download_content_type NOT NULL DEFAULT 'both',
  size_bytes BIGINT DEFAULT 0,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.user_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads"
  ON public.user_downloads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own downloads"
  ON public.user_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads"
  ON public.user_downloads FOR DELETE USING (auth.uid() = user_id);

-- ========== COLLECTIONS ==========
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  book_ids UUID[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections viewable by everyone"
  ON public.collections FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections"
  ON public.collections FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== STORAGE BUCKETS ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Book covers are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update book covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete book covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Audio files are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Admins can upload audio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update audio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete audio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========== INDEXES ==========
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_categories ON public.books USING GIN(categories);
CREATE INDEX idx_books_tags ON public.books USING GIN(tags);
CREATE INDEX idx_summaries_book_id ON public.summaries(book_id);
CREATE INDEX idx_key_ideas_book_id ON public.key_ideas(book_id);
CREATE INDEX idx_user_progress_user_book ON public.user_progress(user_id, book_id);
CREATE INDEX idx_user_shelves_user ON public.user_shelves(user_id);
CREATE INDEX idx_user_highlights_user ON public.user_highlights(user_id);

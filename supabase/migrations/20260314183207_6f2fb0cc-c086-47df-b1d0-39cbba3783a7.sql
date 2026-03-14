
-- User ratings table
CREATE TABLE public.user_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);

ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ratings" ON public.user_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ratings" ON public.user_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.user_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.user_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update average rating on books table
CREATE OR REPLACE FUNCTION public.update_book_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books
  SET rating = (
    SELECT COALESCE(AVG(r.rating), 0)
    FROM public.user_ratings r
    WHERE r.book_id = COALESCE(NEW.book_id, OLD.book_id)
  )
  WHERE id = COALESCE(NEW.book_id, OLD.book_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_book_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_book_rating();

-- Allow anyone to see average ratings (they're on books table which is already public for published)
CREATE POLICY "Anyone can view ratings for published books" ON public.user_ratings
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = user_ratings.book_id AND books.status = 'published'));

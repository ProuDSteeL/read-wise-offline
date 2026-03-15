CREATE POLICY "Users can update own highlights"
  ON public.user_highlights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

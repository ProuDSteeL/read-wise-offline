-- Make audio-files bucket private so files require signed URLs
UPDATE storage.buckets
  SET public = false
  WHERE id = 'audio-files';

-- Remove public access policy if it exists
DROP POLICY IF EXISTS "Audio files are publicly accessible" ON storage.objects;

-- Normalize audio_url column: strip full URL prefix, keep only the storage path
-- Current format: https://xxx.supabase.co/storage/v1/object/public/audio-files/path/to/file.mp3
-- Target format: path/to/file.mp3
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'summaries' AND column_name = 'audio_url'
  ) THEN
    EXECUTE '
      UPDATE public.summaries
        SET audio_url = regexp_replace(audio_url, ''^https?://[^/]+/storage/v1/object/public/audio-files/'', '''')
        WHERE audio_url IS NOT NULL
          AND audio_url LIKE ''http%''
    ';
  END IF;
END $$;

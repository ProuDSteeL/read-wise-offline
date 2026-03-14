
-- Allow authenticated users to upload to audio-files bucket
CREATE POLICY "Allow authenticated upload audio-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-files');

-- Allow public read access to audio-files
CREATE POLICY "Allow public read audio-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-files');

-- Allow authenticated users to update their audio files
CREATE POLICY "Allow authenticated update audio-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-files');

-- Allow authenticated users to delete their audio files
CREATE POLICY "Allow authenticated delete audio-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-files');

-- Also ensure book-covers has policies
CREATE POLICY "Allow authenticated upload book-covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "Allow public read book-covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-covers');

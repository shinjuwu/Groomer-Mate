-- Create grooming_logs table
CREATE TABLE IF NOT EXISTS public.grooming_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id TEXT NOT NULL, -- Storing LINE User ID
    audio_url TEXT, -- Path to audio file in Storage
    transcription TEXT, -- Raw text from AI transcription
    summary TEXT, -- AI generated summary for pet owners
    tags JSONB, -- Health tags e.g. ["Ear Inflammation", "Long Nails"]
    internal_memo TEXT -- Private notes for groomers
);

-- Enable Row Level Security
ALTER TABLE public.grooming_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows ALL operations for everyone (Development Mode)
-- WARN: This is insecure for production. Update this before going live.
CREATE POLICY "Enable all access for development" ON public.grooming_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create a Storage bucket for audio uploads (Optional, if you haven't created one)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('audio_uploads', 'audio_uploads', true)
-- ON CONFLICT (id) DO NOTHING;

-- Policy for Storage (Development Mode)
-- CREATE POLICY "Enable all storage access for development" ON storage.objects
--     FOR ALL
--     USING (bucket_id = 'audio_uploads')
--     WITH CHECK (bucket_id = 'audio_uploads');

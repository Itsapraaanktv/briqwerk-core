-- Create entries table
CREATE TABLE public.entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    photo_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to select their own entries
CREATE POLICY "Users can view own entries" ON public.entries
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own entries
CREATE POLICY "Users can insert own entries" ON public.entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own entries
CREATE POLICY "Users can update own entries" ON public.entries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own entries
CREATE POLICY "Users can delete own entries" ON public.entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX entries_user_id_idx ON public.entries(user_id);
CREATE INDEX entries_created_at_idx ON public.entries(created_at);

-- Add comment to table
COMMENT ON TABLE public.entries IS 'Stores user entries for construction site documentation';

-- Grant access to authenticated users
GRANT ALL ON public.entries TO authenticated;
GRANT USAGE ON SEQUENCE public.entries_id_seq TO authenticated; 
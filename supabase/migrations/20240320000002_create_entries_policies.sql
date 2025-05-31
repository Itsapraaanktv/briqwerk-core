-- Enable RLS on entries table
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Create policies for normal users (own entries only)
CREATE POLICY "Users can view own entries"
    ON public.entries
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert own entries"
    ON public.entries
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update own entries"
    ON public.entries
    FOR UPDATE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can delete own entries"
    ON public.entries
    FOR DELETE
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Helper function to check if user has access to an entry
CREATE OR REPLACE FUNCTION public.has_entry_access(entry_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.entries e
        WHERE e.id = entry_id
        AND (
            e.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for entries with access control
CREATE OR REPLACE VIEW public.entries_with_access AS
SELECT e.*, 
       CASE WHEN e.user_id = auth.uid() THEN true
            WHEN EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            ) THEN true
            ELSE false
       END as can_edit
FROM public.entries e;

-- Enable RLS on the view
ALTER VIEW public.entries_with_access SET RLS ON;

-- Policy for the view
CREATE POLICY "Users can view accessible entries"
    ON public.entries_with_access
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant access to the view
GRANT SELECT ON public.entries_with_access TO authenticated; 
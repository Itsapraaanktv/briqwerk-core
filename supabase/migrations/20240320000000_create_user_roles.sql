-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'bauleiter', 'gewerk')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add comment explaining roles
COMMENT ON TABLE public.user_roles IS 'Benutzerrollen: admin (Administrator), bauleiter (Bauleiter), gewerk (Gewerk-Mitarbeiter)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to read their own role
CREATE POLICY "Users can read own role"
    ON public.user_roles
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles"
    ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
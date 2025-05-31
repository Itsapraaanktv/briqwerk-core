-- Create a view for auth users that is accessible to admins
CREATE OR REPLACE VIEW auth_users_view AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    au.confirmed_at IS NOT NULL AND au.banned_until IS NULL AS is_active
FROM auth.users au;

-- Grant access to the view for authenticated users (RLS will handle permissions)
GRANT SELECT ON auth_users_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW auth_users_view SET RLS ON;

-- Create policy to allow only admins to view all users
CREATE POLICY "Admins can view all users"
    ON auth_users_view
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create function to toggle user status (activate/deactivate)
CREATE OR REPLACE FUNCTION toggle_user_status(user_id UUID, new_status BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the executing user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can toggle user status';
    END IF;

    -- Update the user status
    IF new_status THEN
        -- Activate user
        UPDATE auth.users 
        SET banned_until = NULL 
        WHERE id = user_id;
    ELSE
        -- Deactivate user
        UPDATE auth.users 
        SET banned_until = '2099-12-31'::timestamp with time zone
        WHERE id = user_id;
    END IF;
END;
$$; 
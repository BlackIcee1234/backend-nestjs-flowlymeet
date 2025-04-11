-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT permissions on all tables to authenticated role
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.rooms TO authenticated;
GRANT SELECT ON TABLE public.room_participants TO authenticated;

-- Grant SELECT permissions on all tables to anon role
GRANT SELECT ON TABLE public.users TO anon;
GRANT SELECT ON TABLE public.rooms TO anon;
GRANT SELECT ON TABLE public.room_participants TO anon;

-- Make sure future tables also get these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon; 
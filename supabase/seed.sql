-- Seed data for testing

-- Insert test users (requires Supabase Auth to be set up)
insert into auth.users (id, email)
values
  ('d0d4e39c-43ee-4fd4-8245-77c4d4b6d38b', 'test1@example.com'),
  ('8d2efb36-a726-425c-ad12-98f2683c5d86', 'test2@example.com')
on conflict (id) do nothing;

-- Insert test rooms
insert into public.room (id, name, owner_id, max_participants)
values
  ('f0f3e39c-43ee-4fd4-8245-77c4d4b6d38c', 'Test Room 1', 'd0d4e39c-43ee-4fd4-8245-77c4d4b6d38b', 10),
  ('a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6', 'Test Room 2', '8d2efb36-a726-425c-ad12-98f2683c5d86', 5)
on conflict (id) do nothing;

-- Add participants to rooms
insert into public.room_participants (room_id, user_id)
values
  ('f0f3e39c-43ee-4fd4-8245-77c4d4b6d38c', 'd0d4e39c-43ee-4fd4-8245-77c4d4b6d38b'),
  ('f0f3e39c-43ee-4fd4-8245-77c4d4b6d38c', '8d2efb36-a726-425c-ad12-98f2683c5d86'),
  ('a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6', '8d2efb36-a726-425c-ad12-98f2683c5d86')
on conflict (room_id, user_id) do nothing;
-- Create Room table
create table if not exists public.room (
  id uuid primary key,
  name text not null,
  owner_id uuid not null references auth.users(id),
  max_participants integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Room Participants junction table
create table if not exists public.room_participants (
  room_id uuid references public.room(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (room_id, user_id)
);

-- Add indexes for better query performance
create index if not exists room_owner_id_idx on public.room(owner_id);
create index if not exists room_participants_user_id_idx on public.room_participants(user_id);

-- Add RLS (Row Level Security) policies
alter table public.room enable row level security;
alter table public.room_participants enable row level security;

-- Policies for room table
create policy "Users can view rooms they are participants in" on public.room
  for select using (
    auth.uid() in (
      select user_id from public.room_participants
      where room_id = id
    )
  );

create policy "Owner can update their rooms" on public.room
  for update using (auth.uid() = owner_id);

create policy "Owner can delete their rooms" on public.room
  for delete using (auth.uid() = owner_id);

-- Policies for room_participants table
create policy "Users can view participants of rooms they are in" on public.room_participants
  for select using (
    auth.uid() in (
      select user_id from public.room_participants
      where room_id = room_participants.room_id
    )
  );
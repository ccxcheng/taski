-- User Profiles Table
-- Run this in your Supabase SQL Editor

-- Create user_profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table user_profiles enable row level security;

-- Policies for user_profiles
create policy "Users can view their own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on user_profiles for update
  using (auth.uid() = id);

-- Create index for performance
create index if not exists user_profiles_id_idx on user_profiles(id);

-- Trigger for updated_at
create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute procedure update_updated_at_column();

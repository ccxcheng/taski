-- Consystem Database Schema
-- Run this in your Supabase SQL Editor

-- Create habits table
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_completed_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create daily completions table (tracks each day's habit completion)
create table if not exists daily_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete cascade not null,
  date date not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, date)
);

-- Create sticky notes table
create table if not exists sticky_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  position_x integer not null,
  position_y integer not null,
  size_width integer not null,
  size_height integer not null,
  color text not null,
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table habits enable row level security;
alter table daily_completions enable row level security;
alter table sticky_notes enable row level security;

-- Policies for habits
create policy "Users can view their own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Policies for daily completions
create policy "Users can view their own completions"
  on daily_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completions"
  on daily_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own completions"
  on daily_completions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own completions"
  on daily_completions for delete
  using (auth.uid() = user_id);

-- Policies for sticky notes
create policy "Users can view their own sticky notes"
  on sticky_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sticky notes"
  on sticky_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sticky notes"
  on sticky_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sticky notes"
  on sticky_notes for delete
  using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists habits_user_id_idx on habits(user_id);
create index if not exists daily_completions_user_id_idx on daily_completions(user_id);
create index if not exists daily_completions_habit_id_idx on daily_completions(habit_id);
create index if not exists daily_completions_date_idx on daily_completions(date);
create index if not exists sticky_notes_user_id_idx on sticky_notes(user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_habits_updated_at before update on habits
  for each row execute procedure update_updated_at_column();

create trigger update_sticky_notes_updated_at before update on sticky_notes
  for each row execute procedure update_updated_at_column();

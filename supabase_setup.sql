-- ============================================
-- SECURE HABIT TRACKER DATABASE SETUP
-- ============================================
-- This creates tables with Row Level Security enabled
-- Users can ONLY access their own data

-- 1. Create habit_data table
CREATE TABLE IF NOT EXISTS habit_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_key TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_key)
);

-- 2. Create sticky_notes table
CREATE TABLE IF NOT EXISTS sticky_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_id TEXT NOT NULL,
  note_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, note_id)
);

-- 3. Create habit_template table (stores user's default habits)
CREATE TABLE IF NOT EXISTS habit_template (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_data JSONB NOT NULL,
  template_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Enable Row Level Security (RLS) - CRITICAL FOR SECURITY
ALTER TABLE habit_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_template ENABLE ROW LEVEL SECURITY;

-- 5. Create security policies for habit_data
-- Users can only see their own data
CREATE POLICY "Users can view own habit_data"
  ON habit_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit_data"
  ON habit_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit_data"
  ON habit_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit_data"
  ON habit_data FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create security policies for sticky_notes
CREATE POLICY "Users can view own sticky_notes"
  ON sticky_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sticky_notes"
  ON sticky_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sticky_notes"
  ON sticky_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sticky_notes"
  ON sticky_notes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create security policies for habit_template
CREATE POLICY "Users can view own habit_template"
  ON habit_template FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit_template"
  ON habit_template FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit_template"
  ON habit_template FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit_template"
  ON habit_template FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habit_data_user_week ON habit_data(user_id, week_key);
CREATE INDEX IF NOT EXISTS idx_sticky_notes_user ON sticky_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_template_user ON habit_template(user_id);

-- 9. Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers to auto-update timestamps
CREATE TRIGGER update_habit_data_updated_at BEFORE UPDATE ON habit_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sticky_notes_updated_at BEFORE UPDATE ON sticky_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_template_updated_at BEFORE UPDATE ON habit_template
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ DONE! Your database is now secure and ready to use.

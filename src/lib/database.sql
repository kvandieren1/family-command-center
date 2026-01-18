-- Household Command Center Database Schema

-- Households Table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  premium_activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Owners, Staff, Dependents)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('owner', 'staff', 'dependent')),
  dependent_type TEXT CHECK (dependent_type IN ('Child', 'Pet', 'Relative', 'Other')),
  initials TEXT,
  color_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Action Items Table (Production: 3-tier hierarchy support)
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES action_items(id) ON DELETE CASCADE, -- For nested sub-tasks
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  burden_score INTEGER CHECK (burden_score IN (1, 2, 3)), -- 1=Low, 2=Medium, 3=High
  assigned_to TEXT CHECK (assigned_to IN ('Pilot', 'Co-Pilot')), -- Pilot/Co-Pilot assignment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  cpe_phase TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks/Action Ledger (Legacy - kept for backwards compatibility)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id),
  dependent_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  cognitive_weight TEXT CHECK (cognitive_weight IN ('heavy', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  cpe_phase TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Meals
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL,
  notes TEXT,
  grocery_needed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events (synced from Google Calendar)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  google_event_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  dependent_id UUID REFERENCES profiles(id),
  color_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cognitive Load Tracking
CREATE TABLE IF NOT EXISTS cognitive_load (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  heavy_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Execution Metrics
CREATE TABLE IF NOT EXISTS execution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  streak_days INTEGER DEFAULT 0,
  on_time_completion_rate DECIMAL(5,2),
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationship Scores (for Wife-Proof Guarantee)
CREATE TABLE IF NOT EXISTS relationship_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions (Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_load ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their household's data
CREATE POLICY "Users can view their household data" ON households
  FOR SELECT USING (id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their household profiles" ON profiles
  FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their household tasks" ON tasks
  FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their household action_items" ON action_items
  FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their household action_items" ON action_items
  FOR INSERT WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their household action_items" ON action_items
  FOR UPDATE USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their household action_items" ON action_items
  FOR DELETE USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their household meals" ON meals
  FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their household calendar events" ON calendar_events
  FOR SELECT USING (household_id IN (SELECT household_id FROM profiles WHERE user_id = auth.uid()));

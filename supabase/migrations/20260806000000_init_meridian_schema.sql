-- Meridian Calendar OS - Database Schema & RLS Policies

-- 1. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_str TEXT NOT NULL,
  start_hour NUMERIC NOT NULL,
  dur_hours NUMERIC NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'meeting',
  time_str TEXT NOT NULL,
  meta TEXT,
  attendees TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view own events"
  ON public.events FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own events"
  ON public.events FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Index for date queries
CREATE INDEX IF NOT EXISTS events_user_date_idx ON public.events(user_id, date_str);


-- 2. USER CALENDARS TABLE
CREATE TABLE IF NOT EXISTS public.user_calendars (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  color_var TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_calendars
ALTER TABLE public.user_calendars ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_calendars
CREATE POLICY "Users can view own custom calendars"
  ON public.user_calendars FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own custom calendars"
  ON public.user_calendars FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own custom calendars"
  ON public.user_calendars FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own custom calendars"
  ON public.user_calendars FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- 3. USER INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  bot_token TEXT,
  groq_api_key TEXT,
  connected BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel)
);

-- Enable RLS on user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations"
  ON public.user_integrations FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

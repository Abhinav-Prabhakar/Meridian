-- Recurrence, reminders, invitees, responses, and time proposals.
-- All records remain scoped to the event owner through RLS policies.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

CREATE TABLE IF NOT EXISTS public.event_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'reminder' CHECK (kind IN ('reminder', 'travel')),
  minutes_before INTEGER NOT NULL CHECK (minutes_before >= 0),
  travel_minutes INTEGER CHECK (travel_minutes IS NULL OR travel_minutes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, kind)
);

CREATE TABLE IF NOT EXISTS public.event_invitees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  response TEXT NOT NULL DEFAULT 'pending' CHECK (response IN ('pending', 'going', 'maybe', 'declined')),
  response_comment TEXT,
  availability TEXT NOT NULL DEFAULT 'unknown' CHECK (availability IN ('unknown', 'free', 'busy')),
  availability_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, email)
);

CREATE TABLE IF NOT EXISTS public.event_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_date_str TEXT NOT NULL,
  proposed_start_hour NUMERIC NOT NULL CHECK (proposed_start_hour >= 0 AND proposed_start_hour < 24),
  proposed_dur_hours NUMERIC NOT NULL CHECK (proposed_dur_hours > 0 AND proposed_dur_hours <= 24),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS event_alerts_event_id_idx ON public.event_alerts(event_id);
CREATE INDEX IF NOT EXISTS event_alerts_user_id_idx ON public.event_alerts(user_id);
CREATE INDEX IF NOT EXISTS event_invitees_event_id_idx ON public.event_invitees(event_id);
CREATE INDEX IF NOT EXISTS event_invitees_organizer_id_idx ON public.event_invitees(organizer_id);
CREATE INDEX IF NOT EXISTS event_proposals_event_id_idx ON public.event_proposals(event_id);
CREATE INDEX IF NOT EXISTS event_proposals_proposer_id_idx ON public.event_proposals(proposer_id);

ALTER TABLE public.event_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage event alerts"
  ON public.event_alerts FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_alerts.event_id
      AND events.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_alerts.event_id
        AND events.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can manage event invitees"
  ON public.event_invitees FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_invitees.event_id
      AND events.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (
    organizer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_invitees.event_id
        AND events.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners can manage event proposals"
  ON public.event_proposals FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_proposals.event_id
      AND events.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (
    proposer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_proposals.event_id
        AND events.user_id = (SELECT auth.uid())
    )
  );

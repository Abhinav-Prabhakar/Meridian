-- Persist all-day events separately from timed events so the UI can render
-- them in the all-day row without inventing placeholder calendar data.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS all_day BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.all_day IS 'Whether the event occupies the entire local calendar date.';

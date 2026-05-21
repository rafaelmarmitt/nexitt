-- Keep client-facing WhatsApp linking simple while letting n8n handle onboarding.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_onboarding_pending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_onboarding_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_whatsapp_onboarding_pending_idx
  ON public.profiles (whatsapp_onboarding_pending, whatsapp_connected_at)
  WHERE phone IS NOT NULL;

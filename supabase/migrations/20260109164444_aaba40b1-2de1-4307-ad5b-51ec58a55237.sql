-- Create admin broadcast notifications table for marketing team
CREATE TABLE public.admin_broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'marketing',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  created_by UUID REFERENCES auth.users(id),
  target_audience TEXT DEFAULT 'all',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  recipients_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage broadcast notifications
CREATE POLICY "Admins can manage broadcast notifications"
ON public.admin_broadcast_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add columns to customer_notifications for enhanced categorization
ALTER TABLE public.customer_notifications 
ADD COLUMN IF NOT EXISTS notification_category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS broadcast_id UUID REFERENCES public.admin_broadcast_notifications(id);

-- Create push notification tokens table for mobile/browser push
CREATE TABLE public.push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  fcm_token TEXT NOT NULL,
  device_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fcm_token)
);

-- Enable RLS
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can manage their own push tokens"
ON public.push_notification_tokens
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System can read active tokens for push delivery
CREATE POLICY "System can read active tokens"
ON public.push_notification_tokens
FOR SELECT
USING (is_active = true);

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_customer_notifications_user_unread 
ON public.customer_notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active 
ON public.push_notification_tokens(user_id, is_active);

-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('9582b008-6bb2-41ac-971b-1a0ed5c19241', 'admin')
ON CONFLICT DO NOTHING;

-- 2. error_logs
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read error_logs" ON public.error_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);

-- 3. broadcasts
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  webhook_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read broadcasts" ON public.broadcasts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert broadcasts" ON public.broadcasts
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') AND sent_by = auth.uid());

-- 4. Admin read-all policies for existing tables
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all sales" ON public.sales
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all expenses" ON public.expenses
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all products" ON public.products
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all sale_items" ON public.sale_items
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all customers" ON public.customers
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all whatsapp_messages" ON public.whatsapp_messages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view all appointments" ON public.appointments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 5. admin_metrics RPC
CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'active_users_7d', (
      SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM public.sales WHERE created_at > now() - interval '7 days'
        UNION
        SELECT user_id FROM public.whatsapp_messages WHERE created_at > now() - interval '7 days'
      ) u
    ),
    'total_messages', (SELECT COUNT(*) FROM public.whatsapp_messages),
    'gmv_total', (SELECT COALESCE(SUM(total), 0) FROM public.sales WHERE status <> 'cancelada'),
    'gmv_30d', (SELECT COALESCE(SUM(total), 0) FROM public.sales WHERE created_at > now() - interval '30 days' AND status <> 'cancelada'),
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'onboarding_rate', (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(100.0 * SUM(CASE WHEN onboarding_completed THEN 1 ELSE 0 END) / COUNT(*), 1)
      END FROM public.profiles
    ),
    'business_types', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', business_type, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(business_type::text, 'nao_definido') AS business_type, COUNT(*) AS c
        FROM public.profiles GROUP BY business_type
      ) t
    ),
    'top_products', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', product_name, 'qty', total_qty, 'revenue', total_rev) ORDER BY total_qty DESC), '[]'::jsonb)
      FROM (
        SELECT product_name, SUM(quantity) AS total_qty, SUM(subtotal) AS total_rev
        FROM public.sale_items GROUP BY product_name ORDER BY SUM(quantity) DESC LIMIT 10
      ) p
    ),
    'hourly_activity', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('hour', hour, 'count', c) ORDER BY hour), '[]'::jsonb)
      FROM (
        SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*) AS c
        FROM public.sales WHERE created_at > now() - interval '30 days'
        GROUP BY hour
      ) h
    )
  ) INTO result;

  RETURN result;
END;
$$;

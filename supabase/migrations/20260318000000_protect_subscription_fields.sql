-- Protect subscription fields from client-side modification
-- Only service_role (Edge Functions, admin operations) can modify these fields
-- Regular authenticated users' UPDATEs succeed but subscription fields silently revert

CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    NEW.subscription_type := OLD.subscription_type;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER protect_subscription_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_fields();

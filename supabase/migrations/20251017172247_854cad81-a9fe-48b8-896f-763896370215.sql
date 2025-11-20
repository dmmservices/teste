-- Add campo senha_temporaria para controlar troca de senha obrigatória
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN DEFAULT false;

-- Create edge function para reset de senha
CREATE OR REPLACE FUNCTION public.get_user_auth_id(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_id UUID;
BEGIN
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = user_email;
  
  RETURN auth_user_id;
END;
$$;
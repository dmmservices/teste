-- Recriar a função com search_path correto
DROP TRIGGER IF EXISTS ensure_principal_user ON perfis;
DROP FUNCTION IF EXISTS check_principal_user() CASCADE;

CREATE OR REPLACE FUNCTION check_principal_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se está tentando remover o status principal
  IF (TG_OP = 'UPDATE' AND OLD.principal = true AND NEW.principal = false) OR (TG_OP = 'DELETE' AND OLD.principal = true) THEN
    -- Verificar se existe outro usuário principal na mesma empresa
    IF NOT EXISTS (
      SELECT 1 FROM perfis 
      WHERE empresa_id = OLD.empresa_id 
      AND id != OLD.id 
      AND principal = true
      AND funcao IN ('cliente_admin', 'cliente_membro')
    ) THEN
      RAISE EXCEPTION 'Deve haver pelo menos um usuário principal por empresa';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_principal_user
BEFORE UPDATE OR DELETE ON perfis
FOR EACH ROW
EXECUTE FUNCTION check_principal_user();
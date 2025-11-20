-- Adicionar campo principal à tabela perfis
ALTER TABLE perfis ADD COLUMN principal boolean NOT NULL DEFAULT false;

-- Marcar como principal todos os usuários únicos de cada empresa
WITH usuarios_unicos AS (
  SELECT DISTINCT ON (empresa_id) id, empresa_id
  FROM perfis
  WHERE empresa_id IS NOT NULL
  AND funcao IN ('cliente_admin', 'cliente_membro')
  ORDER BY empresa_id, criado_em ASC
)
UPDATE perfis
SET principal = true
WHERE id IN (SELECT id FROM usuarios_unicos);

-- Garantir que sempre há pelo menos um usuário principal por empresa
CREATE OR REPLACE FUNCTION check_principal_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_principal_user
BEFORE UPDATE OR DELETE ON perfis
FOR EACH ROW
EXECUTE FUNCTION check_principal_user();
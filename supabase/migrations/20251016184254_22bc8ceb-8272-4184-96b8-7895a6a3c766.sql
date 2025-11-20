-- Add new columns first
ALTER TABLE empresas 
  ADD COLUMN IF NOT EXISTS data_inicio timestamp with time zone,
  ADD COLUMN IF NOT EXISTS data_encerramento timestamp with time zone;

-- Drop the old constraint if it exists
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS tipo_contrato_check;

-- Add new constraint for tipo_contrato
ALTER TABLE empresas ADD CONSTRAINT tipo_contrato_check 
  CHECK (tipo_contrato IN ('recorrente', 'unico'));

-- Add unique constraint for nome to prevent duplicates
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_nome_unique;
ALTER TABLE empresas ADD CONSTRAINT empresas_nome_unique UNIQUE (nome);

-- Create new enum type with correct values
CREATE TYPE status_cliente_new AS ENUM ('ativo', 'pausado', 'encerrado');

-- Add a temporary column with the new type
ALTER TABLE empresas ADD COLUMN status_new status_cliente_new;

-- Migrate data from old status to new status
UPDATE empresas 
SET status_new = CASE 
  WHEN status::text IN ('prospecção', 'negociação', 'ativo', 'em_andamento') THEN 'ativo'::status_cliente_new
  WHEN status::text = 'pausado' THEN 'pausado'::status_cliente_new
  WHEN status::text IN ('concluído', 'cancelado') THEN 'encerrado'::status_cliente_new
  ELSE 'ativo'::status_cliente_new
END;

-- Drop the old status column and rename the new one
ALTER TABLE empresas DROP COLUMN status;
ALTER TABLE empresas RENAME COLUMN status_new TO status;

-- Set default value
ALTER TABLE empresas ALTER COLUMN status SET DEFAULT 'ativo'::status_cliente_new;

-- Drop old enum and rename new enum
DROP TYPE status_cliente;
ALTER TYPE status_cliente_new RENAME TO status_cliente;
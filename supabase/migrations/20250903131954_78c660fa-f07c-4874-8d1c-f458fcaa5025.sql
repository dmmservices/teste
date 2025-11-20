-- First, let's add the missing criado_por and criado_em columns to tarefas table
-- Also add a tipo column to differentiate between tasks and subtasks
-- And update data types for better datetime handling

-- Add tipo column to tarefas (task vs subtask)
ALTER TABLE tarefas ADD COLUMN tipo text DEFAULT 'tarefa' CHECK (tipo IN ('tarefa', 'subtarefa'));

-- Add parent task relationship for subtasks
ALTER TABLE tarefas ADD COLUMN tarefa_pai_id uuid REFERENCES tarefas(id) ON DELETE CASCADE;

-- Add default value for criado_por for existing records
UPDATE tarefas SET criado_por = (
  SELECT id FROM perfis WHERE nome_completo = 'Mário Ribeiro' LIMIT 1
) WHERE criado_por IS NULL;

-- Make criado_por NOT NULL now that we have default values
ALTER TABLE tarefas ALTER COLUMN criado_por SET NOT NULL;

-- Add foreign key constraint to perfis table
ALTER TABLE tarefas ADD CONSTRAINT fk_tarefas_criado_por 
  FOREIGN KEY (criado_por) REFERENCES perfis(id);

-- Update data types for better datetime handling with time
-- We'll keep the existing timestamp columns but ensure they can handle time properly
-- (they already can, but we'll make sure the application layer handles them correctly)

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tarefas_tipo ON tarefas(tipo);
CREATE INDEX IF NOT EXISTS idx_tarefas_pai ON tarefas(tarefa_pai_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_criado_por ON tarefas(criado_por);
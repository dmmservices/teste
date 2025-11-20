-- Adicionar campo de ordem para controlar a sequência das subtarefas
ALTER TABLE public.tarefas 
ADD COLUMN ordem_subtarefa INTEGER DEFAULT 0;

-- Criar índice para melhorar performance das consultas ordenadas
CREATE INDEX idx_tarefas_ordem_subtarefa ON public.tarefas(tarefa_pai_id, ordem_subtarefa) WHERE tarefa_pai_id IS NOT NULL;
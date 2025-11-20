-- Adicionar colunas prioridade e data_entrega na tabela itens_checklist
ALTER TABLE public.itens_checklist 
ADD COLUMN prioridade prioridade_tarefa NOT NULL DEFAULT 'media',
ADD COLUMN data_entrega timestamp with time zone;
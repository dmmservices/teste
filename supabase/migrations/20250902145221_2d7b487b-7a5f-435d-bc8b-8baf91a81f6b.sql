-- Verificar e criar foreign keys necessárias para responsáveis
ALTER TABLE tarefa_responsaveis 
ADD CONSTRAINT tarefa_responsaveis_responsavel_id_fkey 
FOREIGN KEY (responsavel_id) REFERENCES perfis(id) ON DELETE CASCADE;
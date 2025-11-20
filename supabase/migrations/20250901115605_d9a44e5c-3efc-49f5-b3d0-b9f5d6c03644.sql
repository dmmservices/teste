
-- Criar tabela para comentários das tarefas
CREATE TABLE IF NOT EXISTS public.comentarios_tarefa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  autor_id UUID REFERENCES public.perfis(id),
  comentario TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  anexos JSONB DEFAULT '[]'::jsonb
);

-- Criar tabela para responsáveis das tarefas
CREATE TABLE IF NOT EXISTS public.tarefa_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.perfis(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tarefa_id, responsavel_id)
);

-- Habilitar RLS para comentários
ALTER TABLE public.comentarios_tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefa_responsaveis ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários_tarefa
CREATE POLICY "Comentários são visíveis por membros da empresa ou DMM" 
ON public.comentarios_tarefa FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM perfis p, tarefas t 
  WHERE t.id = comentarios_tarefa.tarefa_id 
  AND p.email = auth.email() 
  AND (p.empresa_id = t.empresa_id OR p.funcao = ANY(ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario]))
));

CREATE POLICY "DMM pode inserir comentários" 
ON public.comentarios_tarefa FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM perfis p 
  WHERE p.email = auth.email() 
  AND p.funcao = ANY(ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario])
));

CREATE POLICY "DMM pode deletar comentários" 
ON public.comentarios_tarefa FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM perfis p 
  WHERE p.email = auth.email() 
  AND p.funcao = ANY(ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario])
));

-- Políticas para tarefa_responsaveis
CREATE POLICY "Responsáveis são visíveis por membros da empresa ou DMM" 
ON public.tarefa_responsaveis FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM perfis p, tarefas t 
  WHERE t.id = tarefa_responsaveis.tarefa_id 
  AND p.email = auth.email() 
  AND (p.empresa_id = t.empresa_id OR p.funcao = ANY(ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario]))
));

CREATE POLICY "DMM pode gerenciar responsáveis" 
ON public.tarefa_responsaveis FOR ALL 
USING (EXISTS (
  SELECT 1 FROM perfis p 
  WHERE p.email = auth.email() 
  AND p.funcao = ANY(ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario])
));

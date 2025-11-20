-- Corrigir a política RLS que está causando recursão infinita
-- Primeiro, dropar a política problemática
DROP POLICY IF EXISTS "Perfis são visíveis para usuários relacionados" ON public.perfis;

-- Criar uma política mais simples que não cause recursão
CREATE POLICY "Perfis visíveis por usuários autenticados"
ON public.perfis 
FOR SELECT 
USING (
  -- Usuário pode ver seu próprio perfil
  email = auth.email() 
  OR 
  -- DMM pode ver todos os perfis
  EXISTS (
    SELECT 1 FROM perfis p 
    WHERE p.email = auth.email() 
    AND p.funcao = ANY (ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario])
  )
  OR
  -- Clientes podem ver perfis DMM (sem fazer JOINs complexos)
  (
    funcao = ANY (ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario])
    AND EXISTS (
      SELECT 1 FROM perfis p 
      WHERE p.email = auth.email() 
      AND p.funcao = ANY (ARRAY['cliente_admin'::funcao_usuario, 'cliente_membro'::funcao_usuario])
    )
  )
  OR
  -- Usuários da mesma empresa podem se ver
  EXISTS (
    SELECT 1 FROM perfis p 
    WHERE p.email = auth.email() 
    AND p.empresa_id = perfis.empresa_id 
    AND p.empresa_id IS NOT NULL
  )
);
-- Atualizar a política RLS da tabela perfis para permitir que clientes vejam perfis DMM
-- quando estes aparecem como responsáveis de tarefas ou criadores de checklists

-- Primeiro, dropar a política existente
DROP POLICY IF EXISTS "Perfis são visíveis conforme empresa e função" ON public.perfis;

-- Criar nova política mais flexível que permite ver perfis DMM quando necessário
CREATE POLICY "Perfis são visíveis para usuários relacionados"
ON public.perfis 
FOR SELECT 
USING (
  -- Pode ver seu próprio perfil
  email = auth.email() 
  OR 
  -- DMM pode ver todos os perfis
  EXISTS (
    SELECT 1 FROM get_current_user_profile() p
    WHERE p.user_funcao = ANY (ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario])
  )
  OR
  -- Usuários podem ver perfis de sua própria empresa
  EXISTS (
    SELECT 1 FROM get_current_user_profile() p
    WHERE p.user_empresa_id = perfis.empresa_id AND p.user_empresa_id IS NOT NULL
  )
  OR
  -- Clientes podem ver perfis DMM que são responsáveis por suas tarefas
  EXISTS (
    SELECT 1 FROM get_current_user_profile() p, tarefa_responsaveis tr, tarefas t
    WHERE p.user_empresa_id = t.empresa_id 
    AND t.id = tr.tarefa_id 
    AND tr.responsavel_id = perfis.id
  )
  OR
  -- Clientes podem ver perfis DMM que criaram tarefas para sua empresa
  EXISTS (
    SELECT 1 FROM get_current_user_profile() p, tarefas t
    WHERE p.user_empresa_id = t.empresa_id 
    AND t.criado_por = perfis.id
  )
  OR
  -- Clientes podem ver perfis DMM que criaram checklists para sua empresa
  EXISTS (
    SELECT 1 FROM get_current_user_profile() p, itens_checklist ic
    WHERE p.user_empresa_id = ic.empresa_id 
    AND ic.criado_por = perfis.id
  )
);
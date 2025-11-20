-- Reverter para a política RLS original que funcionava
-- Dropar as políticas problemáticas
DROP POLICY IF EXISTS "Perfis são visíveis para usuários relacionados" ON public.perfis;
DROP POLICY IF EXISTS "Perfis visíveis por usuários autenticados" ON public.perfis;

-- Recriar a política original que funcionava
CREATE POLICY "Perfis são visíveis conforme empresa e função" 
ON public.perfis 
FOR SELECT 
USING (
  (email = auth.email()) 
  OR 
  (EXISTS ( 
    SELECT 1 FROM get_current_user_profile() p(user_funcao, user_empresa_id, user_email)
    WHERE (p.user_funcao = ANY (ARRAY['dmm_admin'::funcao_usuario, 'dmm_membro'::funcao_usuario]))
  )) 
  OR 
  (EXISTS ( 
    SELECT 1 FROM get_current_user_profile() p(user_funcao, user_empresa_id, user_empresa_email)
    WHERE ((p.user_empresa_id = perfis.empresa_id) AND (p.user_empresa_id IS NOT NULL))
  ))
);
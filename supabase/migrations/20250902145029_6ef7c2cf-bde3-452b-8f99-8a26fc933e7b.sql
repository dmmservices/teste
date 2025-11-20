-- Permitir que clientes atualizem seus próprios checklists
CREATE POLICY "Clientes podem atualizar seus próprios checklists" 
ON public.itens_checklist 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM perfis p 
    WHERE p.email = auth.email() 
    AND p.empresa_id = itens_checklist.empresa_id
    AND tipo = 'pendencia_cliente'
  )
);
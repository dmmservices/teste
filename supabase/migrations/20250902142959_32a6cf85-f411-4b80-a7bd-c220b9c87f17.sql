-- Permitir que clientes criem seus próprios checklists
CREATE POLICY "Clientes podem inserir seus próprios checklists" 
ON public.itens_checklist 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis p 
    WHERE p.email = auth.email() 
    AND p.empresa_id = itens_checklist.empresa_id
    AND tipo = 'pendencia_cliente'
  )
);

-- Atualizar dados das empresas com as URLs das logos
UPDATE empresas SET url_logo = '/logos/grupo-arseg.png' WHERE nome = 'Grupo Arseg';
UPDATE empresas SET url_logo = '/logos/embelleze.png' WHERE nome = 'Embelleze';
UPDATE empresas SET url_logo = '/logos/limpmax.png' WHERE nome = 'LimpMax';
UPDATE empresas SET url_logo = '/logos/dolb-clean.png' WHERE nome = 'Dolb Clean';
UPDATE empresas SET url_logo = '/logos/knn-idiomas.png' WHERE nome = 'Knn Idiomas - Araucária';
UPDATE empresas SET url_logo = '/logos/dmm-services.png' WHERE nome = 'Dmm Services';

-- Remover a coluna logo_url (redundante com url_logo)
ALTER TABLE empresas DROP COLUMN IF EXISTS logo_url;
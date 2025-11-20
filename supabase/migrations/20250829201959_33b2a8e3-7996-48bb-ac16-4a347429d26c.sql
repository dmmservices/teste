
-- Primeiro, vamos verificar quais perfis existem atualmente
SELECT id, nome_completo, funcao, email FROM perfis ORDER BY nome_completo;

-- Deletar perfis que não sejam os 3 especificados (Mário, Bruno, DMM) e que não sejam de empresas clientes
DELETE FROM perfis 
WHERE nome_completo NOT IN ('Mário Ribeiro', 'Mario Ribeiro', 'Mário', 'Mario', 'MÁRIO', 'MARIO', 
                           'Bruno Borges', 'Bruno', 'BRUNO', 
                           'DMM Services', 'DMM', 'dmm')
AND funcao IN ('dmm_admin', 'dmm_membro')
AND email NOT LIKE '%arseg%' 
AND email NOT LIKE '%embelleze%' 
AND email NOT LIKE '%limpmax%' 
AND email NOT LIKE '%dolbclean%' 
AND email NOT LIKE '%knn%';

-- Garantir que temos os perfis corretos da DMM
INSERT INTO perfis (nome_completo, email, funcao, empresa_id, url_avatar) 
VALUES 
  ('Mário Ribeiro', 'mario@dmm.com.br', 'dmm_admin', (SELECT id FROM empresas WHERE nome = 'DMM' LIMIT 1), '/lovable-uploads/ab86a7b9-fe5a-4735-b001-36ce2eba3835.png'),
  ('Bruno Borges', 'bruno@dmm.com.br', 'dmm_membro', (SELECT id FROM empresas WHERE nome = 'DMM' LIMIT 1), '/lovable-uploads/6a02bf6b-bbb0-44ad-8490-ca0260089e0f.png'),
  ('DMM Services', 'dmm@dmm.com.br', 'dmm_admin', (SELECT id FROM empresas WHERE nome = 'DMM' LIMIT 1), '/lovable-uploads/9021d080-da7f-464d-a688-112dff87b428.png')
ON CONFLICT (email) DO UPDATE SET 
  nome_completo = EXCLUDED.nome_completo,
  funcao = EXCLUDED.funcao,
  url_avatar = EXCLUDED.url_avatar;

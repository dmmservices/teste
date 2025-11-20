
-- Primeiro, vamos identificar e manter apenas as empresas necessárias
-- Deletar empresas que não estão na lista permitida (mantendo apenas as 5 + DMM)
DELETE FROM empresas 
WHERE slug NOT IN ('arseg', 'embelleze', 'limpmax', 'dolbclean', 'knn', 'dmm');

-- Atualizar as imagens dos perfis para Bruno, DMM e Mario
UPDATE perfis 
SET url_avatar = '/lovable-uploads/73d858c6-57c9-4ee2-8d50-cf88e78b9cd4.png'
WHERE nome_completo LIKE '%Bruno%';

UPDATE perfis 
SET url_avatar = '/lovable-uploads/b2b9e419-dad7-4fcc-a57a-318f66d9e792.png'
WHERE nome_completo LIKE '%DMM%' OR funcao IN ('dmm_admin', 'dmm_membro');

UPDATE perfis 
SET url_avatar = '/lovable-uploads/7bc80b3b-7725-496c-80cf-e6b8de55c58e.png'
WHERE nome_completo LIKE '%Mario%' OR nome_completo LIKE '%Mário%';

-- Remover perfis de ADMINISTRADOR DMM e MEMBRO DMM se existirem
DELETE FROM perfis 
WHERE nome_completo IN ('ADMINISTRADOR DMM', 'MEMBRO DMM');

-- Garantir que as empresas necessárias existam com os dados corretos
INSERT INTO empresas (nome, slug, descricao) 
VALUES 
  ('Arseg Consultoria', 'arseg', 'Empresa de consultoria'),
  ('Embelleze', 'embelleze', 'Rede de franquias de beleza'),
  ('Papeis Limpmax', 'limpmax', 'Distribuidor de papeis'),
  ('Dolb Clean', 'dolbclean', 'Empresa de limpeza'),
  ('KNN Araucária', 'knn', 'Empresa KNN filial Araucária'),
  ('DMM Services', 'dmm', 'Empresa DMM Services')
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao;

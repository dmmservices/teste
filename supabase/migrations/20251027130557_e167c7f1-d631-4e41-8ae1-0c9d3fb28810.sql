-- Inserir novos clientes: Patty Doces e Folk Cleaning
INSERT INTO empresas (nome, slug, status, tipo_contrato, senha, criado_em, atualizado_em)
VALUES 
  ('Patty Doces', 'patty-doces', 'ativo', 'recorrente', 'PattyDoces2024!', now(), now()),
  ('Folk Cleaning', 'folk-cleaning', 'ativo', 'recorrente', 'FolkClean2024!', now(), now())
ON CONFLICT (slug) DO NOTHING;

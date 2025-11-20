-- Atualizar a tabela perfis com os IDs corretos dos usuários de autenticação
-- Baseado nos logs de auth, vamos sincronizar os IDs

-- DMM Admin
UPDATE perfis 
SET id = '1a36896d-a7a1-4398-9e99-ae61294b2eb6' 
WHERE email = 'dmm.services@outlook.com';

-- DMM Membro - Mario
UPDATE perfis 
SET id = 'f0d09266-4adf-4a3a-acc5-5a5552e366d0' 
WHERE email = 'mario@dmmservices.com.br';

-- DMM Membro - Bruno
UPDATE perfis 
SET id = '606d3e96-57a0-4047-bb2f-b5d54efbbb82' 
WHERE email = 'bruno@dmmservices.com.br';

-- Cliente Arseg
UPDATE perfis 
SET id = 'd4146bf7-3644-416f-bb9d-9386276f26d2' 
WHERE email = 'arseg@arsegconsultoria.com.br';

-- Cliente Embelleze
UPDATE perfis 
SET id = '764e0325-be12-4523-81b6-d26da03d178b' 
WHERE email = 'embelleze@embelleze.com.br';

-- Cliente Limpmax
UPDATE perfis 
SET id = '5f6fb115-6b78-4b8f-a8bf-a04d20046e86' 
WHERE email = 'limpmax@papeislimpmax.com.br';

-- Cliente Dolbclean
UPDATE perfis 
SET id = 'a51272ab-ae06-4c00-bcdf-bf9d2ecbe5a2' 
WHERE email = 'dolbclean@dolbclean.com.br';

-- Cliente KNN Araucária
UPDATE perfis 
SET id = 'c6008199-9135-412e-b089-f453dc0c4a45' 
WHERE email = 'knnaraucaria@knn.com.br';
-- Remove campos desnecessários e funcionalidade de arquivamento da tabela acessos
-- Primeiro, vamos restaurar todos os acessos arquivados
UPDATE acessos SET arquivado = false WHERE arquivado = true;

-- Remover colunas desnecessárias
ALTER TABLE acessos DROP COLUMN IF EXISTS dono_id;
ALTER TABLE acessos DROP COLUMN IF EXISTS ambiente;
ALTER TABLE acessos DROP COLUMN IF EXISTS categoria;
ALTER TABLE acessos DROP COLUMN IF EXISTS arquivado;
ALTER TABLE acessos DROP COLUMN IF EXISTS arquivado_em;
ALTER TABLE acessos DROP COLUMN IF EXISTS arquivado_por;

-- Adicionar campo para 2FA
ALTER TABLE acessos ADD COLUMN totp_secret text;
ALTER TABLE acessos ADD COLUMN totp_enabled boolean DEFAULT false;
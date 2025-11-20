-- Criar enum para status do cliente
CREATE TYPE status_cliente AS ENUM (
  'prospecção',
  'negociação',
  'ativo',
  'em_andamento',
  'pausado',
  'concluído',
  'cancelado'
);

-- Adicionar colunas necessárias na tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES perfis(id),
ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES perfis(id),
ADD COLUMN IF NOT EXISTS nome_decisor text,
ADD COLUMN IF NOT EXISTS status status_cliente DEFAULT 'prospecção',
ADD COLUMN IF NOT EXISTS site text,
ADD COLUMN IF NOT EXISTS valor_projeto numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS servicos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tipo_contrato text CHECK (tipo_contrato IN ('recorrente', 'fixo')),
ADD COLUMN IF NOT EXISTS data_pagamento date,
ADD COLUMN IF NOT EXISTS senha text;

-- Criar políticas RLS para permitir DMM gerenciar empresas
CREATE POLICY "DMM pode inserir empresas" ON empresas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.email = auth.email()
      AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
  );

CREATE POLICY "DMM pode atualizar empresas" ON empresas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.email = auth.email()
      AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
  );

CREATE POLICY "DMM pode deletar empresas" ON empresas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.email = auth.email()
      AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
  );

-- Criar função para verificar se empresa tem registros associados
CREATE OR REPLACE FUNCTION empresa_tem_registros(empresa_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM acessos WHERE empresa_id = empresa_id_param
    UNION ALL
    SELECT 1 FROM tarefas WHERE empresa_id = empresa_id_param
    UNION ALL
    SELECT 1 FROM itens_checklist WHERE empresa_id = empresa_id_param
    UNION ALL
    SELECT 1 FROM perfis WHERE empresa_id = empresa_id_param
  );
END;
$$;
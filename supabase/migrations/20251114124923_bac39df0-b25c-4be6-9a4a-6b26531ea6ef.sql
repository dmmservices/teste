-- Adicionar campo frequencia_pagamento na tabela empresas
ALTER TABLE empresas 
ADD COLUMN frequencia_pagamento TEXT DEFAULT 'Mensal' CHECK (frequencia_pagamento IN ('Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'));

-- Atualizar clientes existentes para Mensal
UPDATE empresas SET frequencia_pagamento = 'Mensal' WHERE frequencia_pagamento IS NULL;

-- Criar tabela de despesas
CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Imposto', 'Ferramenta digital', 'Ferramenta Física', 'Educacional', 'Marketing', 'Mão de obra', 'Fundo de Oferta')),
  data_pagamento DATE NOT NULL,
  meio_pagamento TEXT NOT NULL CHECK (meio_pagamento IN ('Pix', 'Boleto', 'Cartão', 'Transferência')),
  valor_unitario NUMERIC NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_total NUMERIC GENERATED ALWAYS AS (valor_unitario * quantidade) STORED,
  recorrente BOOLEAN DEFAULT false,
  data_inicio DATE,
  data_fim DATE,
  frequencia_recorrencia TEXT CHECK (frequencia_recorrencia IN ('Semanal', 'Quinzenal', 'Mensal', 'Trimestral', 'Semestral', 'Anual')),
  notas TEXT,
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela despesas
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para despesas - apenas DMM pode gerenciar
CREATE POLICY "DMM pode gerenciar despesas"
ON despesas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND p.funcao IN ('dmm_admin', 'dmm_membro')
  )
);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_despesas_updated_at
BEFORE UPDATE ON despesas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- Create pagamentos table
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pago', 'Atrasado', 'Pendente')),
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Pix', 'Boleto', 'Cartão', 'Transferência')),
  notas TEXT,
  comprovante_url TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "DMM pode gerenciar pagamentos"
ON public.pagamentos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND p.funcao IN ('dmm_admin', 'dmm_membro')
  )
);

CREATE POLICY "Pagamentos são visíveis por membros da empresa ou DMM"
ON public.pagamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND (
      p.empresa_id = pagamentos.empresa_id
      OR p.funcao IN ('dmm_admin', 'dmm_membro')
    )
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pagamentos_updated_at
BEFORE UPDATE ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "DMM pode visualizar comprovantes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'comprovantes'
  AND EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND p.funcao IN ('dmm_admin', 'dmm_membro')
  )
);

CREATE POLICY "DMM pode fazer upload de comprovantes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes'
  AND EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND p.funcao IN ('dmm_admin', 'dmm_membro')
  )
);

CREATE POLICY "DMM pode atualizar comprovantes"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'comprovantes'
  AND EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND p.funcao IN ('dmm_admin', 'dmm_membro')
  )
);

CREATE POLICY "DMM pode deletar comprovantes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'comprovantes'
  AND EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.email = auth.email()
    AND p.funcao IN ('dmm_admin', 'dmm_membro')
  )
);

-- Create index for better performance
CREATE INDEX idx_pagamentos_empresa_id ON public.pagamentos(empresa_id);
CREATE INDEX idx_pagamentos_data_vencimento ON public.pagamentos(data_vencimento);
CREATE INDEX idx_pagamentos_status ON public.pagamentos(status);
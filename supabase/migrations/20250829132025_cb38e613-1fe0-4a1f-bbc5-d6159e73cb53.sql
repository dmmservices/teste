-- Limpar dados existentes (se existirem)
DROP TABLE IF EXISTS public.tarefas CASCADE;
DROP TABLE IF EXISTS public.itens_checklist CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;
DROP TYPE IF EXISTS public.funcao_usuario CASCADE;
DROP TYPE IF EXISTS public.status_tarefa CASCADE;
DROP TYPE IF EXISTS public.prioridade_tarefa CASCADE;
DROP TYPE IF EXISTS public.tipo_checklist CASCADE;

-- Criar enums
CREATE TYPE public.funcao_usuario AS ENUM ('dmm_admin', 'dmm_membro', 'cliente_admin', 'cliente_membro');
CREATE TYPE public.status_tarefa AS ENUM ('pode_fazer', 'deve_fazer', 'pronto_fazer', 'em_andamento', 'em_revisao', 'recorrente', 'concluido', 'rejeitado');
CREATE TYPE public.prioridade_tarefa AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.tipo_checklist AS ENUM ('pendencia_dmm', 'pendencia_cliente');

-- Criar tabela de empresas
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    descricao TEXT,
    url_logo TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de perfis
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nome_completo TEXT NOT NULL,
    url_avatar TEXT,
    funcao public.funcao_usuario NOT NULL,
    empresa_id UUID REFERENCES public.empresas(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de itens checklist
CREATE TABLE public.itens_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo public.tipo_checklist NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    concluido_por UUID REFERENCES public.perfis(id),
    concluido_em TIMESTAMP WITH TIME ZONE,
    criado_por UUID REFERENCES public.perfis(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de tarefas
CREATE TABLE public.tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status public.status_tarefa DEFAULT 'pode_fazer',
    prioridade public.prioridade_tarefa DEFAULT 'media',
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_entrega TIMESTAMP WITH TIME ZONE,
    criado_por UUID REFERENCES public.perfis(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas
CREATE POLICY "Empresas são visíveis por todos os usuários autenticados" 
ON public.empresas FOR SELECT 
USING (true);

-- Políticas RLS para perfis
CREATE POLICY "Perfis são visíveis por todos os usuários autenticados" 
ON public.perfis FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.perfis FOR UPDATE 
USING (email = auth.email());

-- Políticas RLS para itens_checklist
CREATE POLICY "Itens checklist são visíveis por membros da empresa ou DMM" 
ON public.itens_checklist FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND (p.empresa_id = itens_checklist.empresa_id OR p.funcao IN ('dmm_admin', 'dmm_membro'))
    )
);

CREATE POLICY "DMM pode inserir itens checklist" 
ON public.itens_checklist FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
);

CREATE POLICY "DMM pode atualizar itens checklist" 
ON public.itens_checklist FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
);

CREATE POLICY "DMM pode deletar itens checklist" 
ON public.itens_checklist FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
);

-- Políticas RLS para tarefas (similar aos itens checklist)
CREATE POLICY "Tarefas são visíveis por membros da empresa ou DMM" 
ON public.tarefas FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND (p.empresa_id = tarefas.empresa_id OR p.funcao IN ('dmm_admin', 'dmm_membro'))
    )
);

CREATE POLICY "DMM pode inserir tarefas" 
ON public.tarefas FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
);

CREATE POLICY "DMM pode atualizar tarefas" 
ON public.tarefas FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
);

CREATE POLICY "DMM pode deletar tarefas" 
ON public.tarefas FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p 
        WHERE p.email = auth.email() 
        AND p.funcao IN ('dmm_admin', 'dmm_membro')
    )
);

-- Inserir dados iniciais

-- Empresas clientes
INSERT INTO public.empresas (nome, slug, descricao) VALUES 
('Arseg Corretora de Seguros', 'arseg', 'Corretora de seguros especializada em soluções corporativas'),
('TechFlow Solutions', 'techflow', 'Empresa de tecnologia focada em automação de processos'),
('GreenLife Consultoria', 'greenlife', 'Consultoria em sustentabilidade e meio ambiente'),
('FastLogistics', 'fastlogistics', 'Empresa de logística e transporte'),
('InnovateLab', 'innovatelab', 'Laboratório de inovação e desenvolvimento de produtos');

-- DMM (empresa interna)
INSERT INTO public.empresas (nome, slug, descricao) VALUES 
('DMM Services', 'dmm-services', 'Empresa de gestão e consultoria empresarial');

-- Perfis DMM
INSERT INTO public.perfis (email, nome_completo, funcao, empresa_id) VALUES 
('admin@dmm.com.br', 'Administrador DMM', 'dmm_admin', (SELECT id FROM public.empresas WHERE slug = 'dmm-services')),
('membro@dmm.com.br', 'Membro DMM', 'dmm_membro', (SELECT id FROM public.empresas WHERE slug = 'dmm-services'));

-- Perfis dos clientes (apenas um admin por empresa)
INSERT INTO public.perfis (email, nome_completo, funcao, empresa_id) VALUES 
('arseg@arseg.com.br', 'Administrador Arseg', 'cliente_admin', (SELECT id FROM public.empresas WHERE slug = 'arseg')),
('admin@techflow.com', 'Administrador TechFlow', 'cliente_admin', (SELECT id FROM public.empresas WHERE slug = 'techflow')),
('admin@greenlife.com', 'Administrador GreenLife', 'cliente_admin', (SELECT id FROM public.empresas WHERE slug = 'greenlife')),
('admin@fastlogistics.com', 'Administrador FastLogistics', 'cliente_admin', (SELECT id FROM public.empresas WHERE slug = 'fastlogistics')),
('admin@innovatelab.com', 'Administrador InnovateLab', 'cliente_admin', (SELECT id FROM public.empresas WHERE slug = 'innovatelab'));

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps automaticamente
CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_perfis_updated_at
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_checklist_updated_at
    BEFORE UPDATE ON public.itens_checklist
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at
    BEFORE UPDATE ON public.tarefas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
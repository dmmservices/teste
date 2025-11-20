
-- ============================================
-- RESET COMPLETO DO BANCO DE DADOS
-- ============================================

-- Drop todas as tabelas existentes e dependências
DROP TABLE IF EXISTS public.atribuicoes_tarefa CASCADE;
DROP TABLE IF EXISTS public.comentarios_tarefa CASCADE;
DROP TABLE IF EXISTS public.itens_checklist CASCADE;
DROP TABLE IF EXISTS public.tarefas CASCADE;
DROP TABLE IF EXISTS public.perfis CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;

-- Drop todos os tipos enum
DROP TYPE IF EXISTS funcao_usuario CASCADE;
DROP TYPE IF EXISTS status_tarefa CASCADE;
DROP TYPE IF EXISTS prioridade_tarefa CASCADE;
DROP TYPE IF EXISTS tipo_checklist CASCADE;

-- Drop todas as funções
DROP FUNCTION IF EXISTS public.atualizar_timestamp CASCADE;
DROP FUNCTION IF EXISTS public.processar_novo_usuario CASCADE;
DROP FUNCTION IF EXISTS public.obter_funcao_usuario CASCADE;
DROP FUNCTION IF EXISTS public.obter_empresa_usuario CASCADE;
DROP FUNCTION IF EXISTS public.eh_usuario_dmm CASCADE;

-- ============================================
-- RECRIAÇÃO COMPLETA
-- ============================================

-- Habilitar extensão necessária
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar tipos enum
CREATE TYPE funcao_usuario AS ENUM ('dmm_admin', 'dmm_membro', 'cliente_admin', 'cliente_membro');
CREATE TYPE status_tarefa AS ENUM ('pode_fazer', 'deve_fazer', 'pronto_fazer', 'em_andamento', 'em_revisao', 'recorrente', 'concluido', 'rejeitado');
CREATE TYPE prioridade_tarefa AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE tipo_checklist AS ENUM ('pendencia_dmm', 'pendencia_cliente');

-- Tabela de empresas
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    descricao TEXT,
    url_logo TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis (usuários)
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nome_completo TEXT NOT NULL,
    url_avatar TEXT,
    funcao funcao_usuario NOT NULL DEFAULT 'cliente_membro',
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE public.tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status status_tarefa NOT NULL DEFAULT 'deve_fazer',
    prioridade prioridade_tarefa NOT NULL DEFAULT 'media',
    data_inicio DATE,
    data_entrega DATE,
    criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atribuições de tarefa
CREATE TABLE public.atribuicoes_tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    atribuido_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tarefa_id, usuario_id)
);

-- Tabela de comentários de tarefa
CREATE TABLE public.comentarios_tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    conteudo TEXT NOT NULL,
    url_anexo TEXT,
    nome_anexo TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de checklist
CREATE TABLE public.itens_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo tipo_checklist NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    concluido_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    concluido_em TIMESTAMP WITH TIME ZONE,
    criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atribuicoes_tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios_tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.obter_funcao_usuario(user_id UUID)
RETURNS funcao_usuario
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT funcao FROM public.perfis WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.obter_empresa_usuario(user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT empresa_id FROM public.perfis WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.eh_usuario_dmm(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT funcao IN ('dmm_admin', 'dmm_membro') FROM public.perfis WHERE id = user_id;
$$;

-- Políticas RLS para perfis
CREATE POLICY "Usuarios podem ver proprio perfil" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios DMM podem ver todos perfis" ON public.perfis
    FOR SELECT USING (public.eh_usuario_dmm(auth.uid()));

CREATE POLICY "Usuarios podem atualizar dados nao sensiveis do proprio perfil" ON public.perfis
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND OLD.funcao = NEW.funcao AND OLD.empresa_id = NEW.empresa_id);

CREATE POLICY "DMM admins podem atualizar qualquer perfil" ON public.perfis
    FOR UPDATE USING (public.obter_funcao_usuario(auth.uid()) = 'dmm_admin');

CREATE POLICY "DMM admins podem criar perfis" ON public.perfis
    FOR INSERT WITH CHECK (public.obter_funcao_usuario(auth.uid()) = 'dmm_admin');

-- Políticas RLS para empresas
CREATE POLICY "Usuarios podem ver propria empresa" ON public.empresas
    FOR SELECT USING (id = public.obter_empresa_usuario(auth.uid()));

CREATE POLICY "DMM admins podem gerenciar empresas" ON public.empresas
    FOR ALL USING (public.obter_funcao_usuario(auth.uid()) = 'dmm_admin');

-- Políticas RLS para tarefas
CREATE POLICY "Usuarios podem ver tarefas da propria empresa" ON public.tarefas
    FOR SELECT USING (empresa_id = public.obter_empresa_usuario(auth.uid()) OR public.eh_usuario_dmm(auth.uid()));

CREATE POLICY "Usuarios DMM podem criar tarefas" ON public.tarefas
    FOR INSERT WITH CHECK (public.eh_usuario_dmm(auth.uid()));

CREATE POLICY "Usuarios DMM podem atualizar tarefas" ON public.tarefas
    FOR UPDATE USING (public.eh_usuario_dmm(auth.uid()));

CREATE POLICY "Usuarios DMM podem deletar tarefas" ON public.tarefas
    FOR DELETE USING (public.eh_usuario_dmm(auth.uid()));

-- Políticas RLS para atribuições de tarefa
CREATE POLICY "Usuarios podem ver atribuicoes de tarefas da propria empresa" ON public.atribuicoes_tarefa
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tarefas t 
            WHERE t.id = tarefa_id 
            AND (t.empresa_id = public.obter_empresa_usuario(auth.uid()) OR public.eh_usuario_dmm(auth.uid()))
        )
    );

CREATE POLICY "Usuarios DMM podem gerenciar atribuicoes" ON public.atribuicoes_tarefa
    FOR ALL USING (public.eh_usuario_dmm(auth.uid()));

-- Políticas RLS para comentários de tarefa
CREATE POLICY "Usuarios podem ver comentarios de tarefas da propria empresa" ON public.comentarios_tarefa
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tarefas t 
            WHERE t.id = tarefa_id 
            AND (t.empresa_id = public.obter_empresa_usuario(auth.uid()) OR public.eh_usuario_dmm(auth.uid()))
        )
    );

CREATE POLICY "Usuarios podem criar comentarios em tarefas da propria empresa" ON public.comentarios_tarefa
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tarefas t 
            WHERE t.id = tarefa_id 
            AND (t.empresa_id = public.obter_empresa_usuario(auth.uid()) OR public.eh_usuario_dmm(auth.uid()))
        )
    );

CREATE POLICY "Usuarios podem atualizar proprios comentarios" ON public.comentarios_tarefa
    FOR UPDATE USING (autor_id = auth.uid());

CREATE POLICY "Usuarios DMM podem deletar qualquer comentario" ON public.comentarios_tarefa
    FOR DELETE USING (public.eh_usuario_dmm(auth.uid()));

-- Políticas RLS para itens de checklist
CREATE POLICY "Usuarios podem ver itens checklist da propria empresa" ON public.itens_checklist
    FOR SELECT USING (empresa_id = public.obter_empresa_usuario(auth.uid()) OR public.eh_usuario_dmm(auth.uid()));

CREATE POLICY "Usuarios DMM podem gerenciar todos itens checklist" ON public.itens_checklist
    FOR ALL USING (public.eh_usuario_dmm(auth.uid()));

CREATE POLICY "Clientes podem completar itens pendencia_cliente" ON public.itens_checklist
    FOR UPDATE USING (
        tipo = 'pendencia_cliente' 
        AND empresa_id = public.obter_empresa_usuario(auth.uid())
    )
    WITH CHECK (
        tipo = 'pendencia_cliente' 
        AND empresa_id = public.obter_empresa_usuario(auth.uid())
    );

CREATE POLICY "Clientes podem criar itens pendencia_cliente" ON public.itens_checklist
    FOR INSERT WITH CHECK (
        tipo = 'pendencia_cliente' 
        AND empresa_id = public.obter_empresa_usuario(auth.uid())
    );

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para timestamp
CREATE TRIGGER trigger_perfis_timestamp BEFORE UPDATE ON public.perfis
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

CREATE TRIGGER trigger_empresas_timestamp BEFORE UPDATE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

CREATE TRIGGER trigger_tarefas_timestamp BEFORE UPDATE ON public.tarefas
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

CREATE TRIGGER trigger_comentarios_timestamp BEFORE UPDATE ON public.comentarios_tarefa
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

CREATE TRIGGER trigger_checklist_timestamp BEFORE UPDATE ON public.itens_checklist
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

-- Função para processar novos usuários
CREATE OR REPLACE FUNCTION public.processar_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, email, nome_completo, funcao)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        CASE 
            WHEN NEW.email ILIKE '%@dmm%' OR NEW.email ILIKE '%dmm%' THEN 'dmm_membro'::funcao_usuario
            ELSE 'cliente_membro'::funcao_usuario
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_novo_usuario
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.processar_novo_usuario();

-- Índices para performance
CREATE INDEX idx_perfis_funcao ON public.perfis(funcao);
CREATE INDEX idx_perfis_empresa_id ON public.perfis(empresa_id);
CREATE INDEX idx_tarefas_empresa_id ON public.tarefas(empresa_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status);
CREATE INDEX idx_atribuicoes_tarefa_id ON public.atribuicoes_tarefa(tarefa_id);
CREATE INDEX idx_atribuicoes_usuario_id ON public.atribuicoes_tarefa(usuario_id);
CREATE INDEX idx_comentarios_tarefa_id ON public.comentarios_tarefa(tarefa_id);
CREATE INDEX idx_checklist_empresa_id ON public.itens_checklist(empresa_id);
CREATE INDEX idx_checklist_tipo ON public.itens_checklist(tipo);

-- Inserir dados de exemplo
INSERT INTO public.empresas (id, nome, slug, descricao) VALUES 
    (gen_random_uuid(), 'DMM Services', 'dmm-services', 'Empresa de marketing digital'),
    (gen_random_uuid(), 'Empresa Cliente A', 'cliente-a', 'Cliente de exemplo A'),
    (gen_random_uuid(), 'Empresa Cliente B', 'cliente-b', 'Cliente de exemplo B');

-- Inserir alguns itens de checklist de exemplo
INSERT INTO public.itens_checklist (empresa_id, titulo, descricao, tipo, criado_por) 
SELECT 
    e.id, 
    'Configurar Google Analytics', 
    'Instalar e configurar o Google Analytics no site',
    'pendencia_dmm'::tipo_checklist,
    NULL
FROM public.empresas e 
WHERE e.slug != 'dmm-services'
LIMIT 2;

INSERT INTO public.itens_checklist (empresa_id, titulo, descricao, tipo, criado_por) 
SELECT 
    e.id, 
    'Fornecer acesso ao painel administrativo', 
    'Criar usuário admin e fornecer credenciais',
    'pendencia_cliente'::tipo_checklist,
    NULL
FROM public.empresas e 
WHERE e.slug != 'dmm-services'
LIMIT 2;

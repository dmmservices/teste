-- Primeiro, vamos criar a empresa DMM se não existir
INSERT INTO public.empresas (nome, slug, descricao, url_logo) 
VALUES ('DMM Services', 'dmm-services', 'DMM Services - Gestão e Consultoria', '/lovable-uploads/8fe69bba-5e52-4973-80ed-b2474054bfcb.png')
ON CONFLICT (slug) DO NOTHING;

-- Criar as empresas clientes
INSERT INTO public.empresas (nome, slug, descricao) VALUES
('Arseg', 'arseg', 'Arseg Consultoria'),
('Embelleze', 'embelleze', 'Embelleze'),
('LimpMax', 'limpmax', 'Papéis LimpMax'),
('Dolb Clean', 'dolb-clean', 'Dolb Clean'),
('Knn Idiomas - Araucária', 'knn-araucaria', 'Knn Idiomas - Araucária')
ON CONFLICT (slug) DO NOTHING;

-- Obter os IDs das empresas
DO $$
DECLARE
    dmm_id uuid;
    arseg_id uuid;
    embelleze_id uuid;
    limpmax_id uuid;
    dolb_id uuid;
    knn_id uuid;
BEGIN
    -- Obter IDs das empresas
    SELECT id INTO dmm_id FROM public.empresas WHERE slug = 'dmm-services';
    SELECT id INTO arseg_id FROM public.empresas WHERE slug = 'arseg';
    SELECT id INTO embelleze_id FROM public.empresas WHERE slug = 'embelleze';
    SELECT id INTO limpmax_id FROM public.empresas WHERE slug = 'limpmax';
    SELECT id INTO dolb_id FROM public.empresas WHERE slug = 'dolb-clean';
    SELECT id INTO knn_id FROM public.empresas WHERE slug = 'knn-araucaria';

    -- Criar perfis dos admins DMM
    INSERT INTO public.perfis (email, nome_completo, funcao, empresa_id, url_avatar) VALUES
    ('dmm.services@outlook.com', 'DMM', 'dmm_admin', dmm_id, '/lovable-uploads/8fe69bba-5e52-4973-80ed-b2474054bfcb.png'),
    ('mario@dmmservices.com.br', 'Mário Ribeiro', 'dmm_membro', dmm_id, '/lovable-uploads/23f500b2-d0d9-4604-afc5-4b7d1449b021.png'),
    ('bruno@dmmservices.com.br', 'Bruno Borges', 'dmm_membro', dmm_id, '/lovable-uploads/758648eb-5a6a-498b-bbcc-3c5977d800b7.png')
    ON CONFLICT (email) DO NOTHING;

    -- Criar perfis dos clientes
    INSERT INTO public.perfis (email, nome_completo, funcao, empresa_id) VALUES
    ('arseg@arsegconsultoria.com.br', 'Arseg - Adalto, Bruna, Jeferson, Thaina, Pablo', 'cliente', arseg_id),
    ('embelleze@embelleze.com.br', 'Embelleze - Daniele, Nara', 'cliente', embelleze_id),
    ('limpmax@papeislimpmax.com.br', 'LimpMax - Leonardo, Lúcia', 'cliente', limpmax_id),
    ('dolbclean@dolbclean.com.br', 'Dolb Clean - Renato, Adriano', 'cliente', dolb_id),
    ('knnaraucaria@knn.com.br', 'Knn Araucária - Eduardo', 'cliente', knn_id)
    ON CONFLICT (email) DO NOTHING;
END
$$;
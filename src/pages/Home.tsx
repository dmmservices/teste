import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const FeatureCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="dmm-card">
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
);

const Home = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Hero */}
      <section className="container py-20 flex flex-col items-center text-center gap-6">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-card">
          <span className="size-2 rounded-full bg-primary" />
          Portal DMM – versão remix
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Central de produtividade e colaboração
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Organize tarefas, checklists, acessos e finanças da sua operação em uma única plataforma
          com experiência moderna e responsiva.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/login">
            <Button className="dmm-btn-primary">Entrar</Button>
          </Link>
          <a href="#recursos">
            <Button variant="secondary" className="dmm-btn-secondary">Ver recursos</Button>
          </a>
        </div>
      </section>

      {/* Logos */}
      <section className="container py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center opacity-70">
          <img src="/logos/dmm-services.png" alt="DMM Services" className="h-8 object-contain mx-auto" />
          <img src="/logos/embelleze.png" alt="Embelleze" className="h-8 object-contain mx-auto" />
          <img src="/logos/grupo-arseg.png" alt="Grupo Arseg" className="h-8 object-contain mx-auto" />
          <img src="/logos/knn-idiomas.png" alt="KNN Idiomas" className="h-8 object-contain mx-auto" />
          <img src="/logos/dolb-clean.png" alt="DOLB Clean" className="h-8 object-contain mx-auto" />
          <img src="/logos/limpmax.png" alt="Limpmax" className="h-8 object-contain mx-auto" />
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="container py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="Tarefas inteligentes"
            subtitle="Crie, atribua e acompanhe tarefas com comentários e subtarefas."
          />
          <FeatureCard
            title="Checklists colaborativos"
            subtitle="Padronize processos com checklists por equipe ou cliente."
          />
          <FeatureCard
            title="Acessos e credenciais"
            subtitle="Armazene com segurança acessos, gere senhas e TOTP."
          />
          <FeatureCard
            title="Financeiro simplificado"
            subtitle="Controle despesas e pagamentos de forma integrada."
          />
          <FeatureCard
            title="Relatórios e dashboards"
            subtitle="Visualize progresso, tendências e gargalos em tempo real."
          />
          <FeatureCard
            title="Segurança e permissões"
            subtitle="Acesso por perfis, rotas protegidas e autenticação supabase."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center">
        <div className="dmm-card bg-primary text-primary-foreground">
          <h2 className="text-2xl font-semibold">Pronto para acelerar sua operação?</h2>
          <p className="opacity-90 mt-1">Acesse com seu usuário para começar agora mesmo.</p>
          <div className="mt-4">
            <Link to="/login">
              <Button variant="secondary" className="bg-white text-foreground hover:bg-white/90">Entrar no Portal</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DMM SERVICES. Todos os direitos reservados.
      </footer>
    </main>
  );
};

export default Home;

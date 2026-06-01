import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

export default function PoliticaDePrivacidade() {
  return (
    <>
      <Seo
        title="Política de Privacidade — Nexitt"
        description="Como a Nexitt coleta, usa, compartilha e protege seus dados."
        path="/politica-de-privacidade"
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Link to="/" className="text-sm text-primary hover:underline">← Voltar</Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: 1 de junho de 2026
          </p>

          <section className="prose prose-sm dark:prose-invert mt-8 max-w-none space-y-6">
            <p>
              Esta Política descreve como a <strong>Nexitt</strong> ("nós", "nosso")
              coleta, usa, compartilha e protege as informações dos usuários
              ("você") ao utilizar nosso ERP invisível para MEI via WhatsApp e o
              painel web associado.
            </p>

            <h2 className="text-xl font-semibold">1. Dados que coletamos</h2>
            <ul className="list-disc pl-6">
              <li>Nome completo e dados de cadastro;</li>
              <li>Telefone e identificador do WhatsApp;</li>
              <li>Mensagens enviadas ao bot (texto, áudio, imagens de comprovantes);</li>
              <li>Dados do negócio: razão social, CNPJ, tipo de atividade, metas;</li>
              <li>Registros financeiros: vendas, despesas, clientes, produtos e estoque;</li>
              <li>Dados técnicos básicos (logs de uso, data/hora de acesso).</li>
            </ul>

            <h2 className="text-xl font-semibold">2. Por que coletamos</h2>
            <ul className="list-disc pl-6">
              <li>Operar o bot do WhatsApp e responder às suas solicitações;</li>
              <li>Registrar transações financeiras e organizar o controle do seu negócio;</li>
              <li>Exibir dashboards, relatórios e alertas (ex.: vencimento do DAS);</li>
              <li>Melhorar e dar suporte ao serviço.</li>
            </ul>

            <h2 className="text-xl font-semibold">3. Com quem compartilhamos</h2>
            <p>Compartilhamos dados estritamente com provedores necessários para o funcionamento da plataforma:</p>
            <ul className="list-disc pl-6">
              <li><strong>Supabase</strong> — armazenamento de banco de dados e autenticação;</li>
              <li><strong>n8n</strong> — orquestração dos fluxos de automação;</li>
              <li><strong>Meta / WhatsApp Business</strong> — envio e recebimento das mensagens;</li>
              <li><strong>Google Gemini</strong> — processamento de linguagem natural (texto, áudio, imagens).</li>
            </ul>
            <p>Não vendemos seus dados a terceiros.</p>

            <h2 className="text-xl font-semibold">4. Retenção e exclusão</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Você pode
              solicitar, a qualquer momento, a exclusão completa dos seus dados
              entrando em contato pelo e-mail abaixo. A exclusão ocorre em até
              30 dias, exceto para registros que precisamos manter por obrigação
              legal.
            </p>

            <h2 className="text-xl font-semibold">5. Segurança</h2>
            <p>
              Utilizamos criptografia em trânsito (HTTPS/TLS) e em repouso,
              controle de acesso por linha (RLS) no banco de dados e backups
              periódicos. Apesar dos cuidados, nenhum sistema é 100% imune;
              recomendamos manter suas credenciais protegidas.
            </p>

            <h2 className="text-xl font-semibold">6. Direitos do titular (LGPD)</h2>
            <p>
              Você pode solicitar acesso, correção, portabilidade, anonimização
              ou exclusão dos seus dados, bem como revogar consentimentos,
              conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
            </p>

            <h2 className="text-xl font-semibold">7. Contato</h2>
            <p>
              Dúvidas, solicitações ou denúncias relacionadas a privacidade:{" "}
              <a className="text-primary hover:underline" href="mailto:contato@nexitt.com.br">
                contato@nexitt.com.br
              </a>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

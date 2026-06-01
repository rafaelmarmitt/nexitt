import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

export default function TermosDeServico() {
  return (
    <>
      <Seo
        title="Termos de Serviço — Nexitt"
        description="Termos e condições de uso da plataforma Nexitt."
        path="/termos-de-servico"
      />
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <Link to="/" className="text-sm text-primary hover:underline">← Voltar</Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Termos de Serviço</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Última atualização: 1 de junho de 2026
          </p>

          <section className="prose prose-sm dark:prose-invert mt-8 max-w-none space-y-6">
            <h2 className="text-xl font-semibold">1. Sobre a Nexitt</h2>
            <p>
              A <strong>Nexitt</strong> é uma plataforma de gestão financeira
              voltada a Microempreendedores Individuais (MEI), que opera como
              um "ERP invisível" via WhatsApp e disponibiliza um painel web
              para visualização de dashboards, vendas, despesas, clientes,
              produtos, estoque e obrigações fiscais.
            </p>

            <h2 className="text-xl font-semibold">2. Aceitação dos termos</h2>
            <p>
              Ao criar uma conta ou utilizar o bot da Nexitt, você declara que
              leu, entendeu e concorda com estes Termos e com a nossa{" "}
              <Link to="/politica-de-privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>.
            </p>

            <h2 className="text-xl font-semibold">3. Uso permitido</h2>
            <ul className="list-disc pl-6">
              <li>Uso pessoal ou da sua empresa, para fins legítimos de gestão;</li>
              <li>É proibido revender, copiar ou aplicar engenharia reversa no serviço;</li>
              <li>É proibido usar o serviço para atividades ilícitas, spam ou fraude.</li>
            </ul>

            <h2 className="text-xl font-semibold">4. Responsabilidade do usuário</h2>
            <p>
              Você é o único responsável pelos dados enviados à Nexitt
              (mensagens, comprovantes, valores, cadastros de clientes e
              produtos) e por garantir que tem o direito de tratá-los. Mantenha
              suas credenciais de acesso em sigilo.
            </p>

            <h2 className="text-xl font-semibold">5. Limitações do serviço</h2>
            <p>
              A Nexitt é uma ferramenta de organização e automação.{" "}
              <strong>Não somos contadores, advogados nem consultores fiscais oficiais.</strong>{" "}
              Relatórios, alertas (incluindo os relacionados ao DAS) e cálculos
              têm caráter informativo e não substituem o aconselhamento de um
              profissional habilitado.
            </p>

            <h2 className="text-xl font-semibold">6. Planos e pagamento</h2>
            <p>
              Oferecemos um período de teste gratuito. Após esse período, o uso
              continuado pode exigir a contratação de um plano pago, cujas
              condições e valores são apresentados no momento da contratação.
              Os pagamentos são processados por provedores terceirizados.
            </p>

            <h2 className="text-xl font-semibold">7. Cancelamento e exclusão</h2>
            <p>
              Você pode cancelar sua assinatura e solicitar a exclusão da sua
              conta e dos seus dados a qualquer momento, entrando em contato
              pelo e-mail abaixo. A exclusão ocorre em até 30 dias, salvo
              obrigações legais de retenção.
            </p>

            <h2 className="text-xl font-semibold">8. Alterações destes termos</h2>
            <p>
              Podemos atualizar estes Termos periodicamente. Mudanças relevantes
              serão comunicadas pelo WhatsApp ou e-mail cadastrado.
            </p>

            <h2 className="text-xl font-semibold">9. Lei aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil. Fica eleito o foro do domicílio do usuário para dirimir
              eventuais controvérsias.
            </p>

            <h2 className="text-xl font-semibold">10. Contato</h2>
            <p>
              Dúvidas ou solicitações:{" "}
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

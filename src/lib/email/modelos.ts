// Textos dos emails do app, escritos para o linkbio. Cores dos tokens até a
// /replica-brand.
import type { Email } from "./index";

const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

function montar(para: string, assunto: string, paragrafos: string[], botao?: { href: string; texto: string }): Email {
  const corpo = paragrafos.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:22px">${p}</p>`).join("\n");
  const acao = botao
    ? `<p style="margin:24px 0"><a href="${botao.href}" style="display:inline-block;padding:12px 20px;background:#4338ca;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold">${botao.texto}</a></p>`
    : "";
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#15181d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e5ea;border-radius:12px"><tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:18px;font-weight:bold">linkbio</p>
${corpo}
${acao}
</td></tr></table></body></html>`;
  const texto = [...paragrafos, botao ? `${botao.texto}: ${botao.href}` : ""].filter(Boolean).join("\n\n");
  return { para, assunto, html, texto };
}

export const modelos = {
  proAtivo: (para: string, site: string, ate: string) =>
    montar(
      para,
      "Seu linkbio Pro está ativo",
      [
        "Pagamento confirmado. Sua página já está sem a marca do linkbio no rodapé.",
        `Este período vai até ${data(ate)}. Para cancelar, é um clique na tela do plano, e o Pro continua até o fim do que já foi pago.`,
      ],
      { href: `${site}/admin/plano`, texto: "Ver meu plano" },
    ),

  pagamentoVencido: (para: string, site: string) =>
    montar(
      para,
      "Seu pagamento do linkbio Pro venceu",
      [
        "A cobrança deste mês do linkbio Pro venceu e ainda não foi paga.",
        "Sua página continua no Pro por mais alguns dias. Se o pagamento não entrar, ela volta ao plano grátis, sem perder nada do que você configurou.",
      ],
      { href: `${site}/admin/plano`, texto: "Pagar agora" },
    ),

  lembretePix: (para: string, site: string, precoCentavos: number, vence: string) =>
    montar(
      para,
      "Seu linkbio Pro renova em 3 dias",
      [
        `A renovação do linkbio Pro (${reais(precoCentavos)}) vence em ${data(vence)}. A cobrança por Pix chega pelo Asaas, nosso sistema de pagamento.`,
        "Se não quiser renovar, cancele na tela do plano; o Pro continua até o fim do período pago.",
      ],
      { href: `${site}/admin/plano`, texto: "Ver meu plano" },
    ),

  voltouAoGratis: (para: string, site: string) =>
    montar(
      para,
      "Sua página voltou ao plano grátis",
      [
        "Como o pagamento do linkbio Pro não entrou, sua página voltou ao plano grátis. Nada foi apagado: links, tema e configurações continuam lá.",
        "Quando quiser voltar ao Pro, é só assinar de novo.",
      ],
      { href: `${site}/admin/plano`, texto: "Assinar de novo" },
    ),

  contaExcluida: (para: string) =>
    montar(para, "Sua conta do linkbio foi excluída", [
      "Como você pediu, excluímos sua conta. Links, inscritos, estatísticas, foto e textos da página foram apagados agora.",
      "O endereço da página fica reservado por 14 dias, para ninguém se passar por você, e depois fica livre. Se você tinha o Pro, a assinatura foi cancelada e não haverá novas cobranças.",
      "Se não foi você que pediu, responda este email.",
    ]),
};

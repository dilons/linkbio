// Textos dos emails do app. Nome e cores vêm da marca (lib/marca.ts) e dos
// tokens (lib/cores.ts, gerado), porque email não lê CSS.
import { CORES } from "@/lib/cores";
import { MARCA } from "@/lib/marca";
import type { Email } from "./index";

const reais = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

function montar(para: string, assunto: string, paragrafos: string[], botao?: { href: string; texto: string }): Email {
  const corpo = paragrafos.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:22px">${p}</p>`).join("\n");
  const acao = botao
    ? `<p style="margin:24px 0"><a href="${botao.href}" style="display:inline-block;padding:12px 20px;background:${CORES.accent};color:${CORES["on-accent"]};text-decoration:none;border-radius:8px;font-weight:bold">${botao.texto}</a></p>`
    : "";
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:${CORES.surface};font-family:Arial,Helvetica,sans-serif;color:${CORES.text}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:${CORES.bg};border:1px solid ${CORES.border};border-radius:12px"><tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:18px;font-weight:bold;color:${CORES.accent}">${MARCA.nome}</p>
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
      `Seu ${MARCA.plano} está ativo`,
      [
        `Pagamento confirmado. Sua página já está sem a marca do ${MARCA.nome} no rodapé.`,
        `Este período vai até ${data(ate)}. Para cancelar, é um clique na tela do plano, e o Pro continua até o fim do que já foi pago.`,
      ],
      { href: `${site}/admin/plano`, texto: "Ver meu plano" },
    ),

  pagamentoVencido: (para: string, site: string) =>
    montar(
      para,
      `Seu pagamento do ${MARCA.plano} venceu`,
      [
        `A cobrança deste mês do ${MARCA.plano} venceu e ainda não foi paga.`,
        "Sua página continua no Pro por mais alguns dias. Se o pagamento não entrar, ela volta ao plano grátis, sem perder nada do que você configurou.",
      ],
      { href: `${site}/admin/plano`, texto: "Pagar agora" },
    ),

  /** 3 dias antes de toda renovação, em qualquer forma de pagamento (fixes.md, correção 1). */
  lembreteRenovacao: (para: string, site: string, precoCentavos: number, vence: string, forma: "pix" | "card" | "boleto") =>
    montar(
      para,
      `Seu ${MARCA.plano} renova em 3 dias`,
      [
        forma === "card"
          ? `No dia ${data(vence)}, vamos cobrar ${reais(precoCentavos)} no cartão cadastrado para renovar o ${MARCA.plano} por mais um mês.`
          : `A renovação do ${MARCA.plano} (${reais(precoCentavos)}) vence em ${data(vence)}. ${forma === "pix" ? "A cobrança por Pix" : "O boleto"} chega pelo Asaas, nosso sistema de pagamento.`,
        "Se não quiser renovar, cancele na tela do plano, em um clique, até lá: nada mais é cobrado, e o Pro continua até o fim do período pago.",
      ],
      { href: `${site}/admin/plano`, texto: "Ver meu plano" },
    ),

  /** O recibo de cada renovação, com o caminho para cancelar. */
  renovou: (para: string, site: string, precoCentavos: number, ate: string) =>
    montar(
      para,
      `Recebemos o pagamento do seu ${MARCA.plano}`,
      [
        `Pagamento de ${reais(precoCentavos)} confirmado. Seu ${MARCA.plano} vai até ${data(ate)}, e avisamos 3 dias antes da próxima cobrança.`,
        "Para cancelar, é um clique na tela do plano. Nada mais é cobrado depois disso.",
      ],
      { href: `${site}/admin/plano`, texto: "Ver meu plano" },
    ),

  /** Quando a própria pessoa cancela: a confirmação de que nada mais é cobrado. */
  cancelada: (para: string, site: string, ate: string | null) =>
    montar(
      para,
      `Assinatura do ${MARCA.plano} cancelada`,
      [
        "Pronto, a assinatura está cancelada e nenhuma cobrança nova vai ser gerada.",
        ate && Date.parse(ate) > Date.now()
          ? `O ${MARCA.plano} continua até ${data(ate)}. Depois disso, a página volta ao plano grátis, sem perder nada do que você configurou.`
          : "A página está no plano grátis, sem perder nada do que você configurou.",
      ],
      { href: `${site}/admin/plano`, texto: "Ver meu plano" },
    ),

  voltouAoGratis: (para: string, site: string) =>
    montar(
      para,
      "Sua página voltou ao plano grátis",
      [
        `Como o pagamento do ${MARCA.plano} não entrou, sua página voltou ao plano grátis. Nada foi apagado: links, tema e configurações continuam lá.`,
        "Quando quiser voltar ao Pro, é só assinar de novo.",
      ],
      { href: `${site}/admin/plano`, texto: "Assinar de novo" },
    ),

  jaTemConta: (para: string, site: string) =>
    montar(
      para,
      `Você já tem conta no ${MARCA.nome}`,
      [
        `Alguém, talvez você, tentou criar uma conta no ${MARCA.nome} com este email. Ele já tem conta, então nada foi criado.`,
        "Para entrar, use a senha de sempre. Se não lembra, peça uma nova pela tela de entrar. Se não foi você, pode ignorar este email.",
      ],
      { href: `${site}/entrar`, texto: `Entrar no ${MARCA.nome}` },
    ),

  contaExcluida: (para: string) =>
    montar(para, `Sua conta do ${MARCA.nome} foi excluída`, [
      "Como você pediu, excluímos sua conta. Links, inscritos, estatísticas, foto e textos da página foram apagados agora.",
      "O endereço da página fica reservado por 14 dias, para ninguém se passar por você, e depois fica livre. Se você tinha o Pro, a assinatura foi cancelada e não haverá novas cobranças.",
      "Se não foi você que pediu, responda este email.",
    ]),

  paginaExcluida: (para: string, username: string) =>
    montar(para, `Sua página do ${MARCA.nome} foi excluída`, [
      `Como você pediu, excluímos a página ${MARCA.dominio}/${username}. Links, redes, inscritos, estatísticas, foto e textos foram apagados agora.`,
      `Sua conta continua: entre quando quiser para criar outra página. O endereço ${username} fica guardado por 14 dias, e nesse tempo só você pode usá-lo de novo. Se você tem o Pro, a assinatura continua; para cancelar, abra Plano no painel.`,
      "Se não foi você que pediu, troque sua senha e responda este email.",
    ]),
};

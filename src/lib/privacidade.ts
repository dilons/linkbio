// Com quem os dados são compartilhados (operadores), para a tela Conta e a
// política de privacidade. Tem de bater com replica/lgpd.json: quem muda um
// muda o outro. A região só vale depois da /replica-deploy escolher São Paulo.
export const OPERADORES = [
  { nome: "Supabase", faz: "Banco de dados, login e arquivos (como a sua foto)", pais: "Estados Unidos (a empresa); os dados ficam na região de São Paulo" },
  { nome: "Vercel", faz: "Hospedagem do site", pais: "Estados Unidos (a empresa); o site roda em São Paulo" },
  { nome: "Resend", faz: "Envio dos emails da conta e da cobrança", pais: "Estados Unidos" },
  { nome: "Asaas", faz: "Cobrança do plano pago (Pix, cartão e boleto)", pais: "Brasil" },
  { nome: "Google", faz: "Login com Google, só para quem escolhe entrar assim", pais: "Estados Unidos" },
] as const;

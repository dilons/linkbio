// Fusos do agendamento de links (F08). O banco guarda em UTC; a tela mostra e
// recebe no fuso que o criador escolheu. Só Intl, sem biblioteca: o Brasil não
// tem horário de verão desde 2019, mas Lisboa tem, e a conversão cobre.

export const FUSOS = [
  ["America/Sao_Paulo", "Brasília (São Paulo, Rio, Minas...)"],
  ["America/Manaus", "Amazonas"],
  ["America/Cuiaba", "Mato Grosso"],
  ["America/Rio_Branco", "Acre"],
  ["America/Noronha", "Fernando de Noronha"],
  ["Europe/Lisbon", "Lisboa"],
  ["UTC", "UTC"],
] as const;

export type Fuso = (typeof FUSOS)[number][0];
export const FUSO_PADRAO: Fuso = "America/Sao_Paulo";
export const ehFuso = (f: unknown): f is Fuso => FUSOS.some(([v]) => v === f);

function partes(utcMs: number, fuso: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: fuso,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((x) => [x.type, x.value]),
  );
  return { a: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Quantos minutos o fuso está à frente de UTC naquele instante. */
function deslocamento(utcMs: number, fuso: string): number {
  const p = partes(utcMs, fuso);
  return (Date.UTC(p.a, p.m - 1, p.d, p.h, p.min, p.s) - utcMs) / 60000;
}

/** "2026-10-20T18:00" no fuso → ISO em UTC. Formato ou data inválida: null. */
export function localParaUtc(local: string, fuso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m || !ehFuso(fuso)) return null;
  const [a, me, d, h, min] = m.slice(1).map(Number);
  const comoUtc = Date.UTC(a, me - 1, d, h, min);
  const volta = new Date(comoUtc);
  if (volta.getUTCMonth() !== me - 1 || volta.getUTCDate() !== d || h > 23 || min > 59) return null;
  // duas passadas: o deslocamento certo é o do instante final (muda na troca de horário)
  let utc = comoUtc - deslocamento(comoUtc, fuso) * 60000;
  utc = comoUtc - deslocamento(utc, fuso) * 60000;
  return new Date(utc).toISOString();
}

const dois = (n: number) => String(n).padStart(2, "0");

/** ISO em UTC → "2026-10-20T18:00" no fuso (o valor de um datetime-local). */
export function utcParaLocal(iso: string | null | undefined, fuso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const p = partes(t, fuso);
  return `${p.a}-${dois(p.m)}-${dois(p.d)}T${dois(p.h)}:${dois(p.min)}`;
}

/** "20/10 às 18:00", para o selo do link no editor. */
export function curto(iso: string, fuso: string): string {
  const p = partes(Date.parse(iso), fuso);
  return `${dois(p.d)}/${dois(p.m)} às ${dois(p.h)}:${dois(p.min)}`;
}

/**
 * Onde o link está na janela agora: no ar, ainda vai aparecer ou já sumiu. O
 * selo é o texto do cartão no editor.
 */
export function janela(inicio: string | null, fim: string | null, fuso: string, agora = Date.now()): { noAr: boolean; selo?: string } {
  if (fim && Date.parse(fim) <= agora) return { noAr: false, selo: "Encerrado" };
  if (inicio && Date.parse(inicio) > agora) return { noAr: false, selo: `Aparece ${curto(inicio, fuso)}` };
  if (fim) return { noAr: true, selo: `Some ${curto(fim, fuso)}` };
  return { noAr: true };
}

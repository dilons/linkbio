/** Só dígitos, e com os dígitos verificadores certos (CPF com 11, CNPJ com 14). */
export function documentoValido(bruto: string): string | null {
  const d = bruto.replace(/\D/g, "");
  if (d.length === 11) return cpfValido(d) ? d : null;
  if (d.length === 14) return cnpjValido(d) ? d : null;
  return null;
}

function cpfValido(d: string): boolean {
  if (/^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjValido(d: string): boolean {
  if (/^(\d)\1{13}$/.test(d)) return false;
  const dv = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((s, p, i) => s + Number(d[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

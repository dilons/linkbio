import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (senha: string, sal: Buffer, tamanho: number) => Promise<Buffer>;

/** "scrypt$sal$hash", em base64. */
export async function hashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const h = await scrypt(senha, sal, 32);
  return `scrypt$${sal.toString("base64")}$${h.toString("base64")}`;
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const [, sal, h] = guardado.split("$");
  if (!sal || !h) return false;
  const calculado = await scrypt(senha, Buffer.from(sal, "base64"), 32);
  const esperado = Buffer.from(h, "base64");
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

// Ações do servidor chamadas do navegador falham quando a rede cai (ou o
// servidor some no meio). Sem tratamento, o erro sobe e derruba a página
// inteira (BUG-003). Aqui a falha vira mensagem; redirect e notFound, que
// também chegam como erro, seguem para o Next.
import { unstable_rethrow } from "next/navigation";

export const SEM_CONEXAO = "Sem conexão com o servidor. Confira a internet e tente de novo.";

/** Para useActionState: devolve { erro } em vez de derrubar a página. */
export function semQuebrar<E extends { erro?: string }, A extends unknown[]>(acao: (...args: A) => Promise<E>) {
  return async (...args: A): Promise<E> => {
    try {
      return await acao(...args);
    } catch (e) {
      unstable_rethrow(e);
      return { erro: SEM_CONEXAO } as E;
    }
  };
}

/** Para chamadas diretas (ligar, reordenar, excluir): devolve `falha` se a chamada não chegar. */
export async function tentar<T>(chamada: () => Promise<T>, falha: T): Promise<T> {
  try {
    return await chamada();
  } catch (e) {
    unstable_rethrow(e);
    return falha;
  }
}

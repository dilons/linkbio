-- F10: trocar o endereço da página (S13). O endereço antigo vira uma linha de
-- perfil já excluída da mesma conta, como na exclusão: fica 14 dias guardado
-- (o job de limpeza remove) e só a própria conta pode retomá-lo. moved_to
-- aponta para a página que trocou de endereço, para quem abrir o antigo nesse
-- tempo ser levado ao novo. Página excluída de verdade não tem moved_to.
alter table public.profiles
  add column moved_to uuid references public.profiles (id) on delete set null;
alter table public.profiles add constraint profiles_moved_to_so_excluido
  check (moved_to is null or deleted_at is not null);

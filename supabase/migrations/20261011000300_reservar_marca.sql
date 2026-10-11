-- Endereços que levam o nome da marca (replica/brand.md) ficam reservados,
-- para ninguém criar uma página que pareça oficial. O nome provisório
-- (linkbio) já estava na lista do schema inicial.
insert into public.reserved_usernames (username) values
  ('chamaqui'), ('chamaaqui'), ('chama.aqui'), ('chama_aqui'), ('oficial'), ('equipe')
on conflict (username) do nothing;

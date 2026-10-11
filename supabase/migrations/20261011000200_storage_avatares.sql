-- Fotos de perfil no Supabase Storage. O bucket é público (a foto aparece na
-- página pública) e servido pelo domínio do Supabase, separado do app. O
-- próprio Storage recusa arquivo grande demais ou de outro tipo, mesmo que o
-- app esqueça de checar. Ninguém envia direto: o app gera uma URL assinada
-- para um caminho dentro da pasta do perfil (POST /api/upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Dados de demonstração para o Supabase local (npm run db:reset). Nunca roda em
-- produção. Pessoas e negócios inventados; números fixos para telas e testes
-- estáveis.
--
-- Conta: demo@linkbio.test / linkbio-demo-2026, página /doces.da.ana

-- O usuário entra direto em auth.users (com email já confirmado), como o
-- Supabase Auth gravaria. Os campos de token vazios ('') são exigidos por ele.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', 'a0a0a0a0-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'demo@linkbio.test',
  extensions.crypt('linkbio-demo-2026', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', ''
);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  'a0a0a0a0-0000-4000-8000-000000000001', 'a0a0a0a0-0000-4000-8000-000000000001',
  '{"sub": "a0a0a0a0-0000-4000-8000-000000000001", "email": "demo@linkbio.test", "email_verified": true}',
  'email', now(), now(), now()
);
-- a linha em accounts vem do gatilho criar_conta

insert into profiles (id, account_id, username, title, bio)
values ('b0b0b0b0-0000-4000-8000-000000000001', 'a0a0a0a0-0000-4000-8000-000000000001',
        'doces.da.ana', 'Doces da Ana', 'Confeitaria artesanal em BH. Encomendas pelo link abaixo.');

insert into appearances (profile_id, theme) values ('b0b0b0b0-0000-4000-8000-000000000001', 'papel');

insert into links (id, profile_id, title, url, position) values
  ('c0c0c0c0-0000-4000-8000-000000000001', 'b0b0b0b0-0000-4000-8000-000000000001', 'Faça sua encomenda', 'https://exemplo.com.br/encomendas', 0),
  ('c0c0c0c0-0000-4000-8000-000000000002', 'b0b0b0b0-0000-4000-8000-000000000001', 'Cardápio da semana', 'https://exemplo.com.br/cardapio', 1),
  ('c0c0c0c0-0000-4000-8000-000000000003', 'b0b0b0b0-0000-4000-8000-000000000001', 'Bolos de aniversário', 'https://exemplo.com.br/aniversario', 2),
  ('c0c0c0c0-0000-4000-8000-000000000004', 'b0b0b0b0-0000-4000-8000-000000000001', 'Onde estamos', 'https://exemplo.com.br/endereco', 3);

insert into social_links (profile_id, platform, url, position) values
  ('b0b0b0b0-0000-4000-8000-000000000001', 'instagram', 'https://instagram.com/exemplo', 0),
  ('b0b0b0b0-0000-4000-8000-000000000001', 'whatsapp', 'https://wa.me/5500000000000', 1),
  ('b0b0b0b0-0000-4000-8000-000000000001', 'tiktok', 'https://tiktok.com/@exemplo', 2);

-- Uma semana de visitas: 20 no dia mais recente, 3 a mais a cada dia para
-- trás; um clique a cada duas visitas, nos três primeiros links.
with visitas as (
  select d, v,
         now() - make_interval(days => d) - make_interval(mins => v * 10) as quando,
         extensions.digest(format('demo-%s-%s', d, v % 15), 'sha256') as hash,
         (array['instagram', 'instagram', 'whatsapp', 'direct', 'tiktok'])[v % 5 + 1] as fonte
    from generate_series(0, 6) as d, lateral generate_series(0, 19 + d * 3) as v
), _views as (
  insert into events (profile_id, type, occurred_at, visitor_hash, country, source, device)
  select 'b0b0b0b0-0000-4000-8000-000000000001', 'view', quando, hash, 'BR', fonte, 'mobile' from visitas
)
insert into events (profile_id, link_id, type, occurred_at, visitor_hash, country, source, device)
select 'b0b0b0b0-0000-4000-8000-000000000001',
       (array['c0c0c0c0-0000-4000-8000-000000000001', 'c0c0c0c0-0000-4000-8000-000000000002',
              'c0c0c0c0-0000-4000-8000-000000000003'])[v % 3 + 1]::uuid,
       'click', quando, hash, 'BR', fonte, 'mobile'
  from visitas where v % 2 = 0;

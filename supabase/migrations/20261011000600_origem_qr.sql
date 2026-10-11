-- S19: o QR code da página leva a /usuario?origem=qr. A visita que chega por
-- ele conta com a origem "qr" nos insights (o QR impresso não tem referer).
alter table public.events drop constraint events_source_check;
alter table public.events add constraint events_source_check
  check (source in ('instagram', 'tiktok', 'whatsapp', 'youtube', 'x', 'facebook',
                    'search', 'qr', 'direct', 'other'));

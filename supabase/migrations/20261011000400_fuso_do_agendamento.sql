-- F08: o fuso em que o criador agendou o link. starts_at e ends_at continuam
-- em UTC; o fuso só serve para mostrar de volta o horário como foi digitado.
-- Sem fuso, vale o da página (profiles.timezone).
alter table public.links
  add column schedule_tz text check (schedule_tz is null or char_length(schedule_tz) between 1 and 64);

-- Presentaciones ByC · esquema de códigos y visitas
-- Correr una vez en Supabase → SQL Editor. Es idempotente.
-- RLS queda activado sin políticas públicas: solo las funciones de Netlify
-- (con la clave de servicio) leen y escriben. El dashboard de Supabase sí lo ve todo.

-- ─── Códigos de acceso: uno por persona y presentación ─────────────────────
create table if not exists public.codigos (
  id            bigint generated always as identity primary key,
  presentacion  text        not null,
  codigo        text        not null check (codigo ~ '^[A-Z0-9-]{4,40}$'),
  persona       text        not null,
  organizacion  text,
  activo        boolean     not null default true,
  expira_en     timestamptz,
  nota          text,
  creado_en     timestamptz not null default now(),
  unique (presentacion, codigo)
);

-- ─── Visitas: cada evento de cada sesión ───────────────────────────────────
create table if not exists public.visitas (
  id            bigint generated always as identity primary key,
  creado_en     timestamptz not null default now(),
  presentacion  text        not null,
  evento        text        not null check (evento in ('ingreso','codigo_invalido','bloqueado','vista','seccion','salida')),
  sesion        uuid,
  codigo        text,
  persona       text,
  organizacion  text,
  seccion       text,
  segundos      integer,
  scroll_max    smallint,
  ip            text,
  pais          text,
  ciudad        text,
  user_agent    text,
  detalle       jsonb       not null default '{}'::jsonb
);
create index if not exists visitas_pres_fecha on public.visitas (presentacion, creado_en desc);
create index if not exists visitas_sesion     on public.visitas (sesion);
create index if not exists visitas_ip_fallos  on public.visitas (ip, creado_en) where evento = 'codigo_invalido';

alter table public.codigos enable row level security;
alter table public.visitas enable row level security;
revoke all on public.codigos, public.visitas from anon, authenticated;
-- Las funciones de Netlify usan la clave de servicio: permisos explícitos por si el proyecto
-- se creó sin "Automatically expose new tables".
grant usage on schema public to service_role;
grant select, insert, update on public.codigos to service_role;
grant select, insert on public.visitas to service_role;

-- ─── Generar un código: select public.nuevo_codigo('lo-recabarren','LR','Nombre Apellido','Empresas Juan Yarur');
create or replace function public.nuevo_codigo(
  p_presentacion text, p_prefijo text, p_persona text, p_organizacion text default null, p_expira timestamptz default null
) returns text language plpgsql security definer set search_path = public as $$
declare
  alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- sin 0/O, 1/I/L
  bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  pos constant int[] := array[0,1,2,3,4,5,10,11];  -- bytes 100% aleatorios del UUID v4
  cuerpo text := '';
  c text;
  i int;
begin
  foreach i in array pos loop
    cuerpo := cuerpo || substr(alfabeto, (get_byte(bytes, i) % length(alfabeto)) + 1, 1);
  end loop;
  c := upper(p_prefijo) || '-' || substr(cuerpo, 1, 4) || '-' || substr(cuerpo, 5, 4);
  insert into public.codigos (presentacion, codigo, persona, organizacion, expira_en)
  values (p_presentacion, c, p_persona, p_organizacion, p_expira);
  return c;
end $$;
revoke all on function public.nuevo_codigo(text, text, text, text, timestamptz) from public, anon, authenticated;

-- ─── Vistas de seguimiento (para mirar en el Table Editor o con SQL) ────────

-- Una fila por sesión: quién, cuándo, cuánto rato y hasta dónde llegó.
create or replace view public.sesiones with (security_invoker = on) as
select
  v.presentacion,
  v.sesion,
  max(v.persona)                                      as persona,
  max(v.organizacion)                                 as organizacion,
  min(v.creado_en)                                    as inicio,
  max(v.creado_en)                                    as ultima_actividad,
  count(*) filter (where v.evento = 'vista')          as aperturas,
  coalesce(max(v.segundos) filter (where v.evento = 'salida'), 0) as segundos,
  coalesce(max(v.scroll_max), 0)                      as scroll_max,
  max(v.ciudad)                                       as ciudad,
  max(v.pais)                                         as pais
from public.visitas v
where v.sesion is not null
group by v.presentacion, v.sesion;

-- Una fila por persona: el resumen que importa.
create or replace view public.resumen_visitas with (security_invoker = on) as
select
  presentacion,
  persona,
  organizacion,
  count(*)                          as sesiones,
  sum(aperturas)                    as aperturas,
  round(sum(segundos) / 60.0, 1)    as minutos_totales,
  max(scroll_max)                   as scroll_max,
  min(inicio)                       as primera_visita,
  max(ultima_actividad)             as ultima_visita
from public.sesiones
group by presentacion, persona, organizacion;

-- Tiempo por sección y persona (del registro de salida más completo de cada sesión;
-- cada salida trae los acumulados de esa pestaña).
create or replace view public.tiempo_por_seccion with (security_invoker = on) as
with ultima as (
  select distinct on (sesion) presentacion, sesion, persona, detalle
  from public.visitas
  where evento = 'salida' and sesion is not null
  order by sesion, segundos desc nulls last, creado_en desc
)
select u.presentacion, u.persona, s.key as seccion, sum((s.value)::int) as segundos
from ultima u, jsonb_each_text(coalesce(u.detalle -> 'secciones', '{}'::jsonb)) s
group by u.presentacion, u.persona, s.key;

revoke all on public.sesiones, public.resumen_visitas, public.tiempo_por_seccion from anon, authenticated;

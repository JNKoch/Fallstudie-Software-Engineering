create extension if not exists pgcrypto;

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  state jsonb not null,
  current_player text check (current_player in ('X', 'O')),
  winner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol in ('X', 'O')),
  player_order integer not null check (player_order in (1, 2)),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, symbol),
  unique (room_id, player_order)
);

create table if not exists public.game_moves (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  move_payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_game_rooms_updated_at on public.game_rooms;
create trigger set_game_rooms_updated_at
before update on public.game_rooms
for each row execute function public.set_updated_at();

alter table public.game_rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_moves enable row level security;

drop policy if exists "rooms_insert_authenticated" on public.game_rooms;
create policy "rooms_insert_authenticated"
on public.game_rooms
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "rooms_select_joined_or_waiting" on public.game_rooms;
create policy "rooms_select_joined_or_waiting"
on public.game_rooms
for select
to authenticated
using (
  status = 'waiting'
  or exists (
    select 1 from public.room_players
    where room_players.room_id = game_rooms.id
      and room_players.user_id = auth.uid()
  )
);

drop policy if exists "rooms_update_joined_players" on public.game_rooms;
create policy "rooms_update_joined_players"
on public.game_rooms
for update
to authenticated
using (
  exists (
    select 1 from public.room_players
    where room_players.room_id = game_rooms.id
      and room_players.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.room_players
    where room_players.room_id = game_rooms.id
      and room_players.user_id = auth.uid()
  )
);

drop policy if exists "players_select_joined_or_waiting_rooms" on public.room_players;
create policy "players_select_joined_or_waiting_rooms"
on public.room_players
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.game_rooms
    where game_rooms.id = room_players.room_id
      and game_rooms.status = 'waiting'
  )
  or exists (
    select 1 from public.room_players viewer
    where viewer.room_id = room_players.room_id
      and viewer.user_id = auth.uid()
  )
);

drop policy if exists "players_insert_self_into_waiting_room" on public.room_players;
create policy "players_insert_self_into_waiting_room"
on public.room_players
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.game_rooms
    where game_rooms.id = room_players.room_id
      and game_rooms.status = 'waiting'
  )
);

drop policy if exists "moves_select_room_players" on public.game_moves;
create policy "moves_select_room_players"
on public.game_moves
for select
to authenticated
using (
  exists (
    select 1 from public.room_players
    where room_players.room_id = game_moves.room_id
      and room_players.user_id = auth.uid()
  )
);

drop policy if exists "moves_insert_room_players" on public.game_moves;
create policy "moves_insert_room_players"
on public.game_moves
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.room_players
    where room_players.room_id = game_moves.room_id
      and room_players.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.game_rooms;
alter publication supabase_realtime add table public.room_players;

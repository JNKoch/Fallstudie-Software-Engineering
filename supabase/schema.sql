create extension if not exists pgcrypto;

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  state jsonb not null,
  current_player text check (current_player in ('X', 'O', 'red', 'yellow')),
  winner text,
  room_revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol in ('X', 'O', 'red', 'yellow')),
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

alter table public.game_rooms
  add column if not exists room_revision integer not null default 0;

alter table public.game_rooms
  drop constraint if exists game_rooms_current_player_check;
alter table public.game_rooms
  add constraint game_rooms_current_player_check
  check (current_player in ('X', 'O', 'red', 'yellow'));

alter table public.room_players
  drop constraint if exists room_players_symbol_check;
alter table public.room_players
  add constraint room_players_symbol_check
  check (symbol in ('X', 'O', 'red', 'yellow'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.tic_tac_toe_winner(p_board jsonb)
returns text
language plpgsql
immutable
as $$
declare
  _winning_lines integer[][] := array[
    array[0, 1, 2],
    array[3, 4, 5],
    array[6, 7, 8],
    array[0, 3, 6],
    array[1, 4, 7],
    array[2, 5, 8],
    array[0, 4, 8],
    array[2, 4, 6]
  ];
  _line integer[];
  _first_cell text;
begin
  foreach _line slice 1 in array _winning_lines loop
    _first_cell := p_board ->> _line[1];

    if _first_cell is not null
      and _first_cell = p_board ->> _line[2]
      and _first_cell = p_board ->> _line[3] then
      return _first_cell;
    end if;
  end loop;

  return null;
end;
$$;

create or replace function public.connect_four_winner(p_board jsonb)
returns text
language plpgsql
immutable
as $$
declare
  _row_index integer;
  _column_index integer;
  _cell_index integer;
  _player text;
begin
  for _row_index in 0..5 loop
    for _column_index in 0..6 loop
      _cell_index := _row_index * 7 + _column_index;
      _player := p_board ->> _cell_index;

      if _player in ('red', 'yellow') and (
        (_column_index <= 3
          and _player = p_board ->> (_cell_index + 1)
          and _player = p_board ->> (_cell_index + 2)
          and _player = p_board ->> (_cell_index + 3))
        or (_row_index <= 2
          and _player = p_board ->> (_cell_index + 7)
          and _player = p_board ->> (_cell_index + 14)
          and _player = p_board ->> (_cell_index + 21))
        or (_row_index <= 2 and _column_index <= 3
          and _player = p_board ->> (_cell_index + 8)
          and _player = p_board ->> (_cell_index + 16)
          and _player = p_board ->> (_cell_index + 24))
        or (_row_index <= 2 and _column_index >= 3
          and _player = p_board ->> (_cell_index + 6)
          and _player = p_board ->> (_cell_index + 12)
          and _player = p_board ->> (_cell_index + 18))
      ) then
        return _player;
      end if;
    end loop;
  end loop;

  return null;
end;
$$;

create or replace function public.create_game_room(p_game_id text, p_initial_state jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _room_id uuid;
  _first_symbol text;
  _initial_current_player text;
begin
  if _user_id is null then
    raise exception 'Bitte melde dich an.';
  end if;

  if p_game_id = 'tic-tac-toe' then
    _first_symbol := 'X';
    _initial_current_player := case
      when p_initial_state ->> 'currentPlayer' in ('X', 'O') then p_initial_state ->> 'currentPlayer'
      else 'X'
    end;
  elsif p_game_id = 'connect-four' then
    _first_symbol := 'red';
    _initial_current_player := case
      when p_initial_state ->> 'currentPlayer' in ('red', 'yellow') then p_initial_state ->> 'currentPlayer'
      else 'red'
    end;
  else
    raise exception 'Dieses Spiel unterstützt keine Online-Räume.';
  end if;

  insert into public.game_rooms (game_id, created_by, status, state, current_player, winner)
  values (
    p_game_id,
    _user_id,
    'waiting',
    p_initial_state,
    _initial_current_player,
    nullif(p_initial_state ->> 'winner', '')
  )
  returning id into _room_id;

  insert into public.room_players (room_id, user_id, symbol, player_order)
  values (_room_id, _user_id, _first_symbol, 1);

  return _room_id;
end;
$$;

create or replace function public.join_game_room(p_room_id uuid)
returns table (room_id uuid, symbol text)
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _room public.game_rooms%rowtype;
  _existing_symbol text;
  _assigned_symbol text;
  _assigned_order integer;
begin
  if _user_id is null then
    raise exception 'Bitte melde dich an.';
  end if;

  select *
  into _room
  from public.game_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Raum nicht gefunden.';
  end if;

  select room_players.symbol
  into _existing_symbol
  from public.room_players
  where room_players.room_id = p_room_id
    and room_players.user_id = _user_id;

  if found then
    return query
    select p_room_id, _existing_symbol;
    return;
  end if;

  if _room.status <> 'waiting' then
    raise exception 'Diesem Raum kann nicht mehr beigetreten werden.';
  end if;

  if exists (
    select 1
    from public.room_players
    where room_players.room_id = p_room_id
      and room_players.player_order = 2
  ) then
    raise exception 'Der Raum ist bereits voll.';
  end if;

  if _room.game_id = 'tic-tac-toe' then
    _assigned_symbol := 'O';
  elsif _room.game_id = 'connect-four' then
    _assigned_symbol := 'yellow';
  else
    raise exception 'Dieses Spiel unterstützt keine Online-Räume.';
  end if;
  _assigned_order := 2;

  insert into public.room_players (room_id, user_id, symbol, player_order)
  values (p_room_id, _user_id, _assigned_symbol, _assigned_order);

  update public.game_rooms
  set
    status = case
      when exists (
        select 1
        from public.room_players
        where room_players.room_id = p_room_id
          and room_players.player_order = 2
      ) then 'active'
      else status
    end,
    room_revision = room_revision + 1
  where id = p_room_id;

  return query
  select p_room_id, _assigned_symbol;
end;
$$;

create or replace function public.submit_tic_tac_toe_move(
  p_room_id uuid,
  p_expected_room_revision integer,
  p_cell_index integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _room public.game_rooms%rowtype;
  _player_symbol text;
  _board jsonb;
  _next_board jsonb;
  _winner text;
  _next_status text;
  _next_current_player text;
  _next_revision integer;
begin
  if _user_id is null then
    raise exception 'Bitte melde dich an.';
  end if;

  if p_cell_index is null or p_cell_index < 0 or p_cell_index > 8 then
    raise exception 'Dieses Feld existiert nicht.';
  end if;

  select *
  into _room
  from public.game_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Raum nicht gefunden.';
  end if;

  if _room.game_id <> 'tic-tac-toe' then
    raise exception 'Dieses Spiel unterstützt noch keine Online-Züge.';
  end if;

  if _room.room_revision <> p_expected_room_revision then
    raise exception 'Der Raum wurde bereits aktualisiert. Bitte lade den Raum neu.';
  end if;

  select room_players.symbol
  into _player_symbol
  from public.room_players
  where room_players.room_id = p_room_id
    and room_players.user_id = _user_id;

  if _player_symbol is null then
    raise exception 'Du bist nicht Teil dieses Raums.';
  end if;

  if _room.status <> 'active' then
    raise exception 'Warte, bis eine zweite Person dem Raum beigetreten ist.';
  end if;

  if _room.state ->> 'status' <> 'playing' then
    raise exception 'Dieses Spiel ist bereits beendet.';
  end if;

  if _room.current_player is distinct from _player_symbol then
    raise exception '% ist am Zug.', _room.current_player;
  end if;

  _board := _room.state -> 'board';

  if jsonb_typeof(_board) <> 'array' or jsonb_array_length(_board) <> 9 then
    raise exception 'Der Raumzustand ist ungültig.';
  end if;

  if _board ->> p_cell_index is not null then
    raise exception 'Dieses Feld ist bereits belegt.';
  end if;

  _next_board := jsonb_set(_board, array[p_cell_index::text], to_jsonb(_player_symbol), false);
  _winner := public.tic_tac_toe_winner(_next_board);

  if _winner is not null then
    _next_status := 'won';
    _next_current_player := _player_symbol;
  elsif not exists (
    select 1
    from jsonb_array_elements(_next_board) as board_cell(cell)
    where board_cell.cell = 'null'::jsonb
  ) then
    _next_status := 'draw';
    _next_current_player := _player_symbol;
  else
    _next_status := 'playing';
    _next_current_player := case when _player_symbol = 'X' then 'O' else 'X' end;
  end if;

  insert into public.game_moves (room_id, user_id, move_payload)
  values (
    p_room_id,
    _user_id,
    jsonb_build_object('cellIndex', p_cell_index, 'symbol', _player_symbol)
  );

  update public.game_rooms
  set
    state = jsonb_build_object(
      'board', _next_board,
      'currentPlayer', _next_current_player,
      'status', _next_status,
      'winner', to_jsonb(_winner)
    ),
    current_player = case when _next_status = 'playing' then _next_current_player else null end,
    winner = _winner,
    status = case when _next_status = 'playing' then 'active' else 'finished' end,
    room_revision = room_revision + 1
  where id = p_room_id
  returning room_revision into _next_revision;

  return _next_revision;
end;
$$;

create or replace function public.submit_connect_four_move(
  p_room_id uuid,
  p_expected_room_revision integer,
  p_column_index integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _room public.game_rooms%rowtype;
  _player_symbol text;
  _board jsonb;
  _next_board jsonb;
  _row_index integer;
  _cell_index integer;
  _winner text;
  _next_status text;
  _next_current_player text;
  _next_revision integer;
begin
  if _user_id is null then
    raise exception 'Bitte melde dich an.';
  end if;

  if p_column_index is null or p_column_index < 0 or p_column_index > 6 then
    raise exception 'Diese Spalte existiert nicht.';
  end if;

  select *
  into _room
  from public.game_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Raum nicht gefunden.';
  end if;

  if _room.game_id <> 'connect-four' then
    raise exception 'Dieser Raum gehört nicht zu 4 Gewinnt.';
  end if;

  if _room.room_revision <> p_expected_room_revision then
    raise exception 'Der Raum wurde bereits aktualisiert. Bitte lade den Raum neu.';
  end if;

  select room_players.symbol
  into _player_symbol
  from public.room_players
  where room_players.room_id = p_room_id
    and room_players.user_id = _user_id;

  if _player_symbol is null then
    raise exception 'Du bist nicht Teil dieses Raums.';
  end if;

  if _room.status <> 'active' then
    raise exception 'Warte, bis eine zweite Person dem Raum beigetreten ist.';
  end if;

  if _room.state ->> 'status' <> 'playing' then
    raise exception 'Dieses Spiel ist bereits beendet.';
  end if;

  if _room.current_player is distinct from _player_symbol then
    raise exception '% ist am Zug.', case when _room.current_player = 'red' then 'Rot' else 'Gelb' end;
  end if;

  _board := _room.state -> 'board';

  if jsonb_typeof(_board) <> 'array' or jsonb_array_length(_board) <> 42 then
    raise exception 'Der Raumzustand ist ungültig.';
  end if;

  _row_index := null;
  for _candidate_row in reverse 5..0 loop
    if _board ->> (_candidate_row * 7 + p_column_index) is null then
      _row_index := _candidate_row;
      exit;
    end if;
  end loop;

  if _row_index is null then
    raise exception 'Diese Spalte ist voll.';
  end if;

  _cell_index := _row_index * 7 + p_column_index;
  _next_board := jsonb_set(_board, array[_cell_index::text], to_jsonb(_player_symbol), false);
  _winner := public.connect_four_winner(_next_board);

  if _winner is not null then
    _next_status := 'won';
    _next_current_player := _player_symbol;
  elsif not exists (
    select 1
    from jsonb_array_elements(_next_board) as board_cell(cell)
    where board_cell.cell = 'null'::jsonb
  ) then
    _next_status := 'draw';
    _next_current_player := _player_symbol;
  else
    _next_status := 'playing';
    _next_current_player := case when _player_symbol = 'red' then 'yellow' else 'red' end;
  end if;

  insert into public.game_moves (room_id, user_id, move_payload)
  values (
    p_room_id,
    _user_id,
    jsonb_build_object('columnIndex', p_column_index, 'player', _player_symbol)
  );

  update public.game_rooms
  set
    state = jsonb_build_object(
      'board', _next_board,
      'currentPlayer', _next_current_player,
      'status', _next_status,
      'winner', to_jsonb(_winner),
      'lastMove', jsonb_build_object(
        'rowIndex', _row_index,
        'columnIndex', p_column_index,
        'cellIndex', _cell_index
      )
    ),
    current_player = case when _next_status = 'playing' then _next_current_player else null end,
    winner = _winner,
    status = case when _next_status = 'playing' then 'active' else 'finished' end,
    room_revision = room_revision + 1
  where id = p_room_id
  returning room_revision into _next_revision;

  return _next_revision;
end;
$$;

create or replace function public.restart_connect_four_room(
  p_room_id uuid,
  p_expected_room_revision integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _room public.game_rooms%rowtype;
  _next_status text;
  _next_revision integer;
begin
  if _user_id is null then
    raise exception 'Bitte melde dich an.';
  end if;

  select *
  into _room
  from public.game_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Raum nicht gefunden.';
  end if;

  if _room.game_id <> 'connect-four' then
    raise exception 'Dieser Raum gehört nicht zu 4 Gewinnt.';
  end if;

  if _room.room_revision <> p_expected_room_revision then
    raise exception 'Der Raum wurde bereits aktualisiert. Bitte lade den Raum neu.';
  end if;

  if not exists (
    select 1
    from public.room_players
    where room_players.room_id = p_room_id
      and room_players.user_id = _user_id
  ) then
    raise exception 'Du bist nicht Teil dieses Raums.';
  end if;

  _next_status := case
    when (
      select count(*)
      from public.room_players
      where room_players.room_id = p_room_id
    ) >= 2 then 'active'
    else 'waiting'
  end;

  update public.game_rooms
  set
    status = _next_status,
    state = jsonb_build_object(
      'board', to_jsonb(array_fill(null::text, array[42])),
      'currentPlayer', 'red',
      'status', 'playing',
      'winner', null,
      'lastMove', null
    ),
    current_player = 'red',
    winner = null,
    room_revision = room_revision + 1
  where id = p_room_id
  returning room_revision into _next_revision;

  return _next_revision;
end;
$$;

create or replace function public.restart_tic_tac_toe_room(
  p_room_id uuid,
  p_expected_room_revision integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _room public.game_rooms%rowtype;
  _next_status text;
  _next_revision integer;
begin
  if _user_id is null then
    raise exception 'Bitte melde dich an.';
  end if;

  select *
  into _room
  from public.game_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Raum nicht gefunden.';
  end if;

  if _room.game_id <> 'tic-tac-toe' then
    raise exception 'Dieses Spiel unterstützt noch keine neue Runde.';
  end if;

  if _room.room_revision <> p_expected_room_revision then
    raise exception 'Der Raum wurde bereits aktualisiert. Bitte lade den Raum neu.';
  end if;

  if not exists (
    select 1
    from public.room_players
    where room_players.room_id = p_room_id
      and room_players.user_id = _user_id
  ) then
    raise exception 'Du bist nicht Teil dieses Raums.';
  end if;

  _next_status := case
    when (
      select count(*)
      from public.room_players
      where room_players.room_id = p_room_id
    ) >= 2 then 'active'
    else 'waiting'
  end;

  update public.game_rooms
  set
    status = _next_status,
    state = jsonb_build_object(
      'board', jsonb_build_array(null, null, null, null, null, null, null, null, null),
      'currentPlayer', 'X',
      'status', 'playing',
      'winner', null
    ),
    current_player = 'X',
    winner = null,
    room_revision = room_revision + 1
  where id = p_room_id
  returning room_revision into _next_revision;

  return _next_revision;
end;
$$;

drop trigger if exists set_game_rooms_updated_at on public.game_rooms;
create trigger set_game_rooms_updated_at
before update on public.game_rooms
for each row execute function public.set_updated_at();

alter table public.game_rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_moves enable row level security;

create or replace function public.is_room_participant(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_players
    where room_players.room_id = p_room_id
      and room_players.user_id = auth.uid()
  );
$$;

create or replace function public.is_room_waiting(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_rooms
    where game_rooms.id = p_room_id
      and game_rooms.status = 'waiting'
  );
$$;

drop policy if exists "rooms_insert_authenticated" on public.game_rooms;
drop policy if exists "rooms_select_joined_or_waiting" on public.game_rooms;
create policy "rooms_select_joined_or_waiting"
on public.game_rooms
for select
to authenticated
using (
  status = 'waiting'
  or public.is_room_participant(id)
);

drop policy if exists "rooms_update_joined_players" on public.game_rooms;
drop policy if exists "players_select_joined_or_waiting_rooms" on public.room_players;
create policy "players_select_joined_or_waiting_rooms"
on public.room_players
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_room_waiting(room_id)
  or public.is_room_participant(room_id)
);

drop policy if exists "players_insert_self_into_waiting_room" on public.room_players;
drop policy if exists "moves_select_room_players" on public.game_moves;
create policy "moves_select_room_players"
on public.game_moves
for select
to authenticated
using (
  public.is_room_participant(room_id)
);

drop policy if exists "moves_insert_room_players" on public.game_moves;
grant execute on function public.is_room_participant(uuid) to authenticated;
grant execute on function public.is_room_waiting(uuid) to authenticated;
grant execute on function public.create_game_room(text, jsonb) to authenticated;
grant execute on function public.join_game_room(uuid) to authenticated;
grant execute on function public.submit_tic_tac_toe_move(uuid, integer, integer) to authenticated;
grant execute on function public.restart_tic_tac_toe_room(uuid, integer) to authenticated;
grant execute on function public.submit_connect_four_move(uuid, integer, integer) to authenticated;
grant execute on function public.restart_connect_four_room(uuid, integer) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_rooms'
  ) then
    alter publication supabase_realtime add table public.game_rooms;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_players'
  ) then
    alter publication supabase_realtime add table public.room_players;
  end if;
end
$$;

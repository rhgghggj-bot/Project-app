-- Réactions emoji sur les messages du chat de groupe.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists messages_groupe_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages_groupe(id) on delete cascade,
  user_id uuid not null references profiles(id),
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists idx_reactions_message on messages_groupe_reactions(message_id);

alter table messages_groupe_reactions enable row level security;

create policy "membres du groupe voient les reactions"
  on messages_groupe_reactions for select
  using (exists (
    select 1 from messages_groupe m join membres_groupe mg on mg.groupe_id = m.groupe_id
    where m.id = messages_groupe_reactions.message_id and mg.user_id = auth.uid()
  ));

create policy "un membre reagit ou retire sa reaction"
  on messages_groupe_reactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (
    select 1 from messages_groupe m join membres_groupe mg on mg.groupe_id = m.groupe_id
    where m.id = messages_groupe_reactions.message_id and mg.user_id = auth.uid()
  ));

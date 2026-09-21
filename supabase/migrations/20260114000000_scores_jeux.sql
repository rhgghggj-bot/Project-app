-- Classement des jeux entre amis : un seul meilleur score par utilisateur
-- et par jeu, mis à jour uniquement s'il progresse. Le classement est
-- calculé côté client en croisant avec les membres d'un groupe.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists scores_jeux (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  jeu text not null,
  meilleur_score int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, jeu)
);

create index if not exists idx_scores_jeux_jeu on scores_jeux(jeu);

alter table scores_jeux enable row level security;

create policy "tout le monde voit les scores pour le classement"
  on scores_jeux for select
  using (true);

create policy "un utilisateur gere son propre score"
  on scores_jeux for insert
  with check (user_id = auth.uid());

create policy "un utilisateur met a jour son propre score"
  on scores_jeux for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

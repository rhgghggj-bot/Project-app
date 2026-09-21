-- Disponibilités communes de groupe : chaque membre coche les créneaux
-- (matin/après-midi/soir) où il est libre sur les 14 prochains jours, l'app
-- affiche ensuite les créneaux où le plus de monde est disponible.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists disponibilites_groupe (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  user_id uuid not null references profiles(id),
  date date not null,
  creneau text not null check (creneau in ('matin', 'apres-midi', 'soir')),
  created_at timestamptz not null default now(),
  unique (groupe_id, user_id, date, creneau)
);

create index if not exists idx_disponibilites_groupe on disponibilites_groupe(groupe_id, date);

alter table disponibilites_groupe enable row level security;

create policy "membres du groupe voient les disponibilites"
  on disponibilites_groupe for select
  using (exists (
    select 1 from membres_groupe mg where mg.groupe_id = disponibilites_groupe.groupe_id and mg.user_id = auth.uid()
  ));

create policy "un membre declare ses propres disponibilites"
  on disponibilites_groupe for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from membres_groupe mg where mg.groupe_id = disponibilites_groupe.groupe_id and mg.user_id = auth.uid())
  );

create policy "un membre retire sa propre disponibilite"
  on disponibilites_groupe for delete
  using (user_id = auth.uid());

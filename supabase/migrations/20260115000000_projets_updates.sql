-- Mises à jour de progression sur un projet social/participatif : le
-- créateur poste un texte (+ image optionnelle), les soutiens et les
-- personnes qui ont aimé le projet reçoivent une notification.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists projets_updates (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references projets(id) on delete cascade,
  auteur_id uuid not null references profiles(id),
  texte text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_projets_updates_projet on projets_updates(projet_id);

alter table projets_updates enable row level security;

create policy "tout le monde voit les mises a jour d un projet"
  on projets_updates for select
  using (true);

create policy "le createur du projet poste des mises a jour"
  on projets_updates for insert
  with check (
    auteur_id = auth.uid()
    and exists (select 1 from projets p where p.id = projets_updates.projet_id and p.user_id = auth.uid())
  );

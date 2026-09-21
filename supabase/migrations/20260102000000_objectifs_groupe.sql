-- Objectifs d'épargne partagés par groupe (ex: "Voyage à Barcelone — 2000 CHF"),
-- avec suivi des contributions de chaque membre. Pure fonctionnalité de suivi,
-- pas de mouvement d'argent réel — pas besoin de Stripe pour celle-ci.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists objectifs_groupe (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  titre text not null,
  montant_cible numeric not null check (montant_cible > 0),
  date_limite date,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists objectifs_groupe_contributions (
  id uuid primary key default gen_random_uuid(),
  objectif_id uuid not null references objectifs_groupe(id) on delete cascade,
  user_id uuid not null references profiles(id),
  montant numeric not null check (montant > 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_objectifs_groupe_groupe on objectifs_groupe(groupe_id);
create index if not exists idx_objectifs_contributions_objectif on objectifs_groupe_contributions(objectif_id);

alter table objectifs_groupe enable row level security;
alter table objectifs_groupe_contributions enable row level security;

create policy "membres du groupe voient les objectifs"
  on objectifs_groupe for select
  using (exists (
    select 1 from membres_groupe mg
    where mg.groupe_id = objectifs_groupe.groupe_id and mg.user_id = auth.uid()
  ));

create policy "membres du groupe creent des objectifs"
  on objectifs_groupe for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from membres_groupe mg
      where mg.groupe_id = objectifs_groupe.groupe_id and mg.user_id = auth.uid()
    )
  );

create policy "le createur peut supprimer son objectif"
  on objectifs_groupe for delete
  using (created_by = auth.uid());

create policy "membres du groupe voient les contributions"
  on objectifs_groupe_contributions for select
  using (exists (
    select 1 from objectifs_groupe og
    join membres_groupe mg on mg.groupe_id = og.groupe_id
    where og.id = objectifs_groupe_contributions.objectif_id and mg.user_id = auth.uid()
  ));

create policy "un membre ajoute sa propre contribution"
  on objectifs_groupe_contributions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from objectifs_groupe og
      join membres_groupe mg on mg.groupe_id = og.groupe_id
      where og.id = objectifs_groupe_contributions.objectif_id and mg.user_id = auth.uid()
    )
  );

create policy "un membre supprime sa propre contribution"
  on objectifs_groupe_contributions for delete
  using (user_id = auth.uid());

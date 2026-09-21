-- Tâches ménagères tournantes pour la colocation : une tâche (poubelles,
-- ménage...) est assignée automatiquement à tour de rôle parmi les membres
-- inscrits, semaine après semaine. La rotation est calculée côté client à
-- partir du numéro de semaine ISO — pas besoin de job planifié.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists taches_menageres (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  titre text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists taches_menageres_membres (
  id uuid primary key default gen_random_uuid(),
  tache_id uuid not null references taches_menageres(id) on delete cascade,
  user_id uuid not null references profiles(id),
  ordre int not null default 0,
  unique (tache_id, user_id)
);

create table if not exists taches_menageres_completions (
  id uuid primary key default gen_random_uuid(),
  tache_id uuid not null references taches_menageres(id) on delete cascade,
  periode text not null,
  user_id uuid not null references profiles(id),
  fait_at timestamptz not null default now(),
  unique (tache_id, periode)
);

create index if not exists idx_taches_menageres_groupe on taches_menageres(groupe_id);
create index if not exists idx_taches_menageres_membres_tache on taches_menageres_membres(tache_id);
create index if not exists idx_taches_menageres_completions_tache on taches_menageres_completions(tache_id);

alter table taches_menageres enable row level security;
alter table taches_menageres_membres enable row level security;
alter table taches_menageres_completions enable row level security;

create policy "membres du groupe voient les taches menageres"
  on taches_menageres for select
  using (exists (select 1 from membres_groupe mg where mg.groupe_id = taches_menageres.groupe_id and mg.user_id = auth.uid()));

create policy "membres du groupe creent des taches menageres"
  on taches_menageres for insert
  with check (created_by = auth.uid() and exists (select 1 from membres_groupe mg where mg.groupe_id = taches_menageres.groupe_id and mg.user_id = auth.uid()));

create policy "le createur supprime sa tache menagere"
  on taches_menageres for delete
  using (created_by = auth.uid());

create policy "membres du groupe voient les inscriptions"
  on taches_menageres_membres for select
  using (exists (
    select 1 from taches_menageres t join membres_groupe mg on mg.groupe_id = t.groupe_id
    where t.id = taches_menageres_membres.tache_id and mg.user_id = auth.uid()
  ));

create policy "un membre s inscrit ou se retire lui meme"
  on taches_menageres_membres for all
  using (user_id = auth.uid() or exists (
    select 1 from taches_menageres t where t.id = taches_menageres_membres.tache_id and t.created_by = auth.uid()
  ))
  with check (user_id = auth.uid() or exists (
    select 1 from taches_menageres t where t.id = taches_menageres_membres.tache_id and t.created_by = auth.uid()
  ));

create policy "membres du groupe voient les completions"
  on taches_menageres_completions for select
  using (exists (
    select 1 from taches_menageres t join membres_groupe mg on mg.groupe_id = t.groupe_id
    where t.id = taches_menageres_completions.tache_id and mg.user_id = auth.uid()
  ));

create policy "un membre marque sa propre completion"
  on taches_menageres_completions for insert
  with check (user_id = auth.uid());

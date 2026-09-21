-- Mode colocation : charges récurrentes de groupe (loyer, internet...) avec
-- une répartition libre par personne (pas forcément égale — une chambre plus
-- grande paie plus). Un job planifié génère automatiquement la dépense
-- partagée correspondante chaque mois (voir app/api/cron/colocation).
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists colocation_charges (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  titre text not null,
  payeur_id uuid not null references profiles(id),
  jour_du_mois int not null check (jour_du_mois between 1 and 31),
  dernier_mois_genere text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists colocation_charges_parts (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid not null references colocation_charges(id) on delete cascade,
  user_id uuid not null references profiles(id),
  montant numeric not null check (montant > 0),
  unique (charge_id, user_id)
);

create index if not exists idx_colocation_charges_groupe on colocation_charges(groupe_id);
create index if not exists idx_colocation_parts_charge on colocation_charges_parts(charge_id);

alter table colocation_charges enable row level security;
alter table colocation_charges_parts enable row level security;

create policy "membres du groupe voient les charges colocation"
  on colocation_charges for select
  using (exists (
    select 1 from membres_groupe mg where mg.groupe_id = colocation_charges.groupe_id and mg.user_id = auth.uid()
  ));

create policy "membres du groupe creent des charges colocation"
  on colocation_charges for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from membres_groupe mg where mg.groupe_id = colocation_charges.groupe_id and mg.user_id = auth.uid())
  );

create policy "le createur peut supprimer sa charge colocation"
  on colocation_charges for delete
  using (created_by = auth.uid());

create policy "membres du groupe voient les parts colocation"
  on colocation_charges_parts for select
  using (exists (
    select 1 from colocation_charges cc
    join membres_groupe mg on mg.groupe_id = cc.groupe_id
    where cc.id = colocation_charges_parts.charge_id and mg.user_id = auth.uid()
  ));

create policy "le createur de la charge ajoute ses parts"
  on colocation_charges_parts for insert
  with check (exists (
    select 1 from colocation_charges cc where cc.id = colocation_charges_parts.charge_id and cc.created_by = auth.uid()
  ));

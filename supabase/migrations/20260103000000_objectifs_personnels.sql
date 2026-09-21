-- Objectifs d'épargne personnels, persistés (le "plan d'épargne" existant
-- sur /finances est un simple calculateur en mémoire, il ne garde rien
-- d'une visite à l'autre). Ici on garde un montant_actuel qu'on incrémente
-- à chaque contribution déclarée par l'utilisateur.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists objectifs_personnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  titre text not null,
  montant_cible numeric not null check (montant_cible > 0),
  montant_actuel numeric not null default 0 check (montant_actuel >= 0),
  date_limite date,
  created_at timestamptz not null default now()
);

create index if not exists idx_objectifs_personnels_user on objectifs_personnels(user_id);

alter table objectifs_personnels enable row level security;

create policy "un utilisateur gere ses propres objectifs"
  on objectifs_personnels for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

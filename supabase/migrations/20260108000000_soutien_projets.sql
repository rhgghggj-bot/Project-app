-- Financement participatif réel sur les projets : un supporter paie
-- directement via Stripe (même compte Connect que le marketplace), l'argent
-- va droit au créateur du projet. Remplace/complète le lien Revolut manuel.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists projets_soutiens (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references projets(id) on delete cascade,
  soutien_id uuid not null references profiles(id),
  montant numeric not null check (montant > 0),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_projets_soutiens_projet on projets_soutiens(projet_id);

alter table projets_soutiens enable row level security;

create policy "tout le monde peut voir les soutiens d'un projet"
  on projets_soutiens for select
  using (true);

-- Aucune policy insert pour les clients : une ligne n'est créée que par le
-- webhook Stripe (service role) une fois le paiement confirmé, jamais par un
-- client qui prétendrait avoir payé.

-- Dépenses partagées de groupe (façon Splitwise), réglables en un tap via
-- Stripe Connect (même compte connecté que le marketplace).
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run. (Ou `supabase db push` si tu utilises la CLI Supabase.)

create table if not exists depenses_partagees (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  payeur_id uuid not null references profiles(id),
  titre text not null,
  montant_total numeric not null check (montant_total > 0),
  categorie text default 'Autre',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists depenses_partagees_parts (
  id uuid primary key default gen_random_uuid(),
  depense_id uuid not null references depenses_partagees(id) on delete cascade,
  user_id uuid not null references profiles(id),
  montant numeric not null check (montant > 0),
  statut text not null default 'du' check (statut in ('du', 'regle')),
  stripe_payment_intent_id text,
  regle_le timestamptz,
  created_at timestamptz not null default now(),
  unique (depense_id, user_id)
);

create index if not exists idx_depenses_partagees_groupe on depenses_partagees(groupe_id);
create index if not exists idx_depenses_partagees_parts_depense on depenses_partagees_parts(depense_id);
create index if not exists idx_depenses_partagees_parts_user on depenses_partagees_parts(user_id);

alter table depenses_partagees enable row level security;
alter table depenses_partagees_parts enable row level security;

-- Lecture/création : réservées aux membres du groupe concerné.
create policy "membres du groupe voient les depenses partagees"
  on depenses_partagees for select
  using (exists (
    select 1 from membres_groupe mg
    where mg.groupe_id = depenses_partagees.groupe_id and mg.user_id = auth.uid()
  ));

create policy "membres du groupe creent des depenses partagees"
  on depenses_partagees for insert
  with check (
    payeur_id = auth.uid()
    and exists (
      select 1 from membres_groupe mg
      where mg.groupe_id = depenses_partagees.groupe_id and mg.user_id = auth.uid()
    )
  );

create policy "le payeur peut supprimer sa depense partagee"
  on depenses_partagees for delete
  using (payeur_id = auth.uid());

create policy "participants voient leurs parts"
  on depenses_partagees_parts for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from depenses_partagees dp
      where dp.id = depenses_partagees_parts.depense_id and dp.payeur_id = auth.uid()
    )
  );

create policy "le payeur cree les parts de sa depense"
  on depenses_partagees_parts for insert
  with check (exists (
    select 1 from depenses_partagees dp
    where dp.id = depenses_partagees_parts.depense_id and dp.payeur_id = auth.uid()
  ));

create policy "le payeur peut supprimer les parts de sa depense"
  on depenses_partagees_parts for delete
  using (exists (
    select 1 from depenses_partagees dp
    where dp.id = depenses_partagees_parts.depense_id and dp.payeur_id = auth.uid()
  ));

-- Volontairement pas de policy UPDATE pour les utilisateurs : le passage au
-- statut "regle" ne doit se faire que via le webhook Stripe (service role,
-- après paiement confirmé) — jamais en se basant sur ce qu'un client déclare.

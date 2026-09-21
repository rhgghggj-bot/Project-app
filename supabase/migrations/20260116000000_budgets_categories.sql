-- Budgets enveloppes par catégorie de dépense : un plafond mensuel optionnel
-- par catégorie, comparé aux dépenses du mois en cours côté client (même
-- logique que l'alerte de dépassement des listes de courses).
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists budgets_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  categorie text not null,
  plafond_mensuel numeric not null check (plafond_mensuel > 0),
  created_at timestamptz not null default now(),
  unique (user_id, categorie)
);

alter table budgets_categories enable row level security;

create policy "un utilisateur gere ses propres budgets par categorie"
  on budgets_categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Le scanner classe les documents (facture/relevé/contrat/assurance) par
-- mots-clés locaux, sans apprentissage. Cette table mémorise les
-- corrections manuelles de l'utilisateur par nom d'entreprise/document, pour
-- que le prochain scan du même type de document soit classé correctement
-- direct.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists scanner_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  cle text not null,
  type text not null check (type in ('facture', 'releve_bancaire', 'contrat', 'assurance', 'autre')),
  created_at timestamptz not null default now(),
  unique (user_id, cle)
);

alter table scanner_corrections enable row level security;

create policy "un utilisateur gere ses propres corrections de scanner"
  on scanner_corrections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

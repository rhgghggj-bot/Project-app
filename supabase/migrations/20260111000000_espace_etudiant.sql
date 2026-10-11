-- Espace étudiant : notes (Suisse sur 6 / France sur 20), évaluations
-- corrigées par l'IA, cours déposés et transformés en fiches de révision
-- autour d'une entreprise fictive, résultats des quiz.
--
-- Chaque table n'est lisible que par son propriétaire (RLS). Les fichiers
-- déposés vont dans le bucket privé "etudes", rangés par dossier
-- <user_id>/..., et seul le propriétaire du dossier peut les lire.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists profils_etudiant (
  user_id uuid primary key references profiles(id) on delete cascade,
  pays text not null default 'CH' check (pays in ('CH', 'FR')),
  entreprise_id text not null default 'cafe',
  entreprise_perso jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists notes_etudiant (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  matiere text not null,
  titre text,
  note numeric not null,
  echelle text not null check (echelle in ('CH6', 'FR20')),
  coefficient numeric not null default 1 check (coefficient > 0),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  check (
    (echelle = 'CH6' and note between 1 and 6) or
    (echelle = 'FR20' and note between 0 and 20)
  )
);

create index if not exists idx_notes_etudiant_user on notes_etudiant(user_id, date);

create table if not exists evaluations_corrigees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  matiere text not null default '',
  titre text not null default '',
  fichier_path text,
  correction jsonb not null,
  ia text not null check (ia in ('claude', 'local')),
  created_at timestamptz not null default now()
);

create index if not exists idx_evaluations_corrigees_user on evaluations_corrigees(user_id, created_at desc);

create table if not exists cours_etudiant (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  matiere text not null default '',
  titre text not null default '',
  fichier_path text,
  entreprise_id text not null,
  fiches jsonb not null,
  ia text not null check (ia in ('claude', 'local')),
  created_at timestamptz not null default now()
);

create index if not exists idx_cours_etudiant_user on cours_etudiant(user_id, created_at desc);

-- Un résultat par quiz terminé : alimente la progression.
create table if not exists resultats_quiz_etudiant (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source text not null check (source in ('evaluation', 'cours')),
  source_id uuid not null,
  score int not null check (score >= 0),
  total int not null check (total > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_resultats_quiz_etudiant_user on resultats_quiz_etudiant(user_id, created_at desc);

alter table profils_etudiant enable row level security;
alter table notes_etudiant enable row level security;
alter table evaluations_corrigees enable row level security;
alter table cours_etudiant enable row level security;
alter table resultats_quiz_etudiant enable row level security;

create policy "un etudiant gere son profil d'etudes"
  on profils_etudiant for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "un etudiant gere ses notes"
  on notes_etudiant for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "un etudiant gere ses evaluations corrigees"
  on evaluations_corrigees for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "un etudiant gere ses cours"
  on cours_etudiant for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "un etudiant gere ses resultats de quiz"
  on resultats_quiz_etudiant for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fichiers déposés (copies, cours) : bucket privé, 20 Mo max par fichier.
insert into storage.buckets (id, name, public, file_size_limit)
values ('etudes', 'etudes', false, 20971520)
on conflict (id) do nothing;

create policy "un etudiant lit ses fichiers d'etudes"
  on storage.objects for select
  using (bucket_id = 'etudes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "un etudiant depose ses fichiers d'etudes"
  on storage.objects for insert
  with check (bucket_id = 'etudes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "un etudiant supprime ses fichiers d'etudes"
  on storage.objects for delete
  using (bucket_id = 'etudes' and (storage.foldername(name))[1] = auth.uid()::text);

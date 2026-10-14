-- Carnet de l'espace étudiant : prise de notes (texte mis en forme, photos,
-- dessins), rangées dans des dossiers et reliables à un chapitre du programme.
--
-- Chaque ligne n'est lisible que par son propriétaire (RLS). Les photos et
-- dessins vont dans le bucket privé "etudes" existant, sous
-- <user_id>/notes/<note_id>/… : les politiques déjà en place s'appliquent.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run. Il peut être relancé sans erreur.

create table if not exists carnet_dossiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nom text not null check (char_length(nom) between 1 and 60),
  created_at timestamptz not null default now()
);

create index if not exists idx_carnet_dossiers_user on carnet_dossiers(user_id);

create table if not exists carnet_notes (
  id uuid primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  dossier_id uuid references carnet_dossiers(id) on delete set null,
  titre text not null default '',
  -- HTML nettoyé côté appli (liste blanche de balises)
  contenu text not null default '',
  -- Texte brut, pour la recherche et l'aperçu
  texte text not null default '',
  epingle boolean not null default false,
  chapitre_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Garde-fous de taille (une note de cours fait rarement plus de 50 000 signes)
  check (char_length(titre) <= 200 and char_length(contenu) <= 500000 and char_length(texte) <= 200000)
);

create index if not exists idx_carnet_notes_user on carnet_notes(user_id, updated_at desc);
create index if not exists idx_carnet_notes_chapitre on carnet_notes(user_id, chapitre_id);

alter table carnet_dossiers enable row level security;
alter table carnet_notes enable row level security;

drop policy if exists "carnet_dossiers proprietaire" on carnet_dossiers;
create policy "carnet_dossiers proprietaire" on carnet_dossiers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "carnet_notes proprietaire" on carnet_notes;
create policy "carnet_notes proprietaire" on carnet_notes
  for all using (auth.uid() = user_id)
  -- Le dossier choisi doit appartenir au même élève
  with check (auth.uid() = user_id and (dossier_id is null or exists (
    select 1 from carnet_dossiers d where d.id = dossier_id and d.user_id = auth.uid())));

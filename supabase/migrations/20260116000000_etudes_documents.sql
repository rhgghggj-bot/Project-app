-- « Mes documents » (onglet Carnet de l'espace étudiant) : n'importe quel
-- fichier (PDF, PowerPoint, Word, images, vidéos, audio…), rangé dans les
-- mêmes dossiers que les notes. Les fichiers vont dans le bucket privé
-- "etudes" sous <user_id>/documents/… : les politiques déjà en place
-- s'appliquent. Limite par fichier portée à 50 Mo.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run. Il peut être relancé sans erreur.

create table if not exists etudes_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  dossier_id uuid references carnet_dossiers(id) on delete set null,
  nom text not null check (char_length(nom) between 1 and 200),
  chemin text not null,
  type text not null default '',
  taille bigint not null default 0 check (taille >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_etudes_documents_user on etudes_documents(user_id, created_at desc);

alter table etudes_documents enable row level security;

drop policy if exists "etudes_documents proprietaire" on etudes_documents;
create policy "etudes_documents proprietaire" on etudes_documents
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    -- Le fichier doit être dans le dossier de l'élève
    and split_part(chemin, '/', 1) = auth.uid()::text
    and (dossier_id is null or exists (
      select 1 from carnet_dossiers d where d.id = dossier_id and d.user_id = auth.uid())));

update storage.buckets set file_size_limit = 52428800 where id = 'etudes';

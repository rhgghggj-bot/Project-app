-- Avis sur les vendeurs du marketplace, laissés par l'acheteur après
-- confirmation de réception. Un avis par transaction (annonce vendue),
-- jamais avant confirmation — on ne fait pas confiance à un avis sans
-- achat réel derrière.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists marketplace_avis (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references marketplace_annonces(id) on delete cascade,
  auteur_id uuid not null references profiles(id),
  cible_id uuid not null references profiles(id),
  note int not null check (note between 1 and 5),
  commentaire text,
  created_at timestamptz not null default now(),
  unique (annonce_id, auteur_id)
);

create index if not exists idx_marketplace_avis_cible on marketplace_avis(cible_id);

alter table marketplace_avis enable row level security;

create policy "tout le monde peut lire les avis"
  on marketplace_avis for select
  using (true);

create policy "seul l'acheteur d'une vente confirmee peut laisser un avis"
  on marketplace_avis for insert
  with check (
    auteur_id = auth.uid()
    and exists (
      select 1 from marketplace_annonces a
      where a.id = marketplace_avis.annonce_id
        and a.acheteur_id = auth.uid()
        and a.statut = 'vendu'
        and a.user_id = marketplace_avis.cible_id
    )
  );

-- Alertes de recherche marketplace : un utilisateur enregistre un mot-clé
-- (+ prix max optionnel) et reçoit une notification dès qu'une nouvelle
-- annonce correspondante est publiée. Le déclenchement se fait par trigger
-- Postgres sur l'insertion d'une annonce (pas de cron nécessaire).
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists alertes_recherche (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mot_cle text not null,
  prix_max numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_alertes_recherche_user on alertes_recherche(user_id);

alter table alertes_recherche enable row level security;

create policy "un utilisateur gere ses propres alertes de recherche"
  on alertes_recherche for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function notifier_alertes_recherche() returns trigger as $$
begin
  insert into notifications (user_id, type, titre, contenu, lien)
  select a.user_id, 'marketplace', 'Nouvelle annonce', 'Une annonce correspond à ton alerte "' || a.mot_cle || '" : ' || new.titre, '/marketplace'
  from alertes_recherche a
  where new.titre ilike '%' || a.mot_cle || '%'
    and (a.prix_max is null or new.prix <= a.prix_max)
    and a.user_id <> new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notifier_alertes_recherche on marketplace_annonces;
create trigger trg_notifier_alertes_recherche
  after insert on marketplace_annonces
  for each row execute function notifier_alertes_recherche();

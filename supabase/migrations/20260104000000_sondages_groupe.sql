-- Sondages rapides dans un groupe ("On mange où ce soir ?"), avec options et
-- votes. Un membre peut changer son vote (upsert sur son propre vote), pas
-- en ajouter plusieurs sur le même sondage.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

create table if not exists sondages_groupe (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references groupes(id) on delete cascade,
  question text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists sondages_groupe_options (
  id uuid primary key default gen_random_uuid(),
  sondage_id uuid not null references sondages_groupe(id) on delete cascade,
  texte text not null,
  ordre int not null default 0
);

create table if not exists sondages_groupe_votes (
  id uuid primary key default gen_random_uuid(),
  sondage_id uuid not null references sondages_groupe(id) on delete cascade,
  option_id uuid not null references sondages_groupe_options(id) on delete cascade,
  user_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (sondage_id, user_id)
);

create index if not exists idx_sondages_groupe_groupe on sondages_groupe(groupe_id);
create index if not exists idx_sondages_options_sondage on sondages_groupe_options(sondage_id);
create index if not exists idx_sondages_votes_sondage on sondages_groupe_votes(sondage_id);

alter table sondages_groupe enable row level security;
alter table sondages_groupe_options enable row level security;
alter table sondages_groupe_votes enable row level security;

create policy "membres du groupe voient les sondages"
  on sondages_groupe for select
  using (exists (
    select 1 from membres_groupe mg where mg.groupe_id = sondages_groupe.groupe_id and mg.user_id = auth.uid()
  ));

create policy "membres du groupe creent des sondages"
  on sondages_groupe for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from membres_groupe mg where mg.groupe_id = sondages_groupe.groupe_id and mg.user_id = auth.uid())
  );

create policy "le createur peut supprimer son sondage"
  on sondages_groupe for delete
  using (created_by = auth.uid());

create policy "membres du groupe voient les options"
  on sondages_groupe_options for select
  using (exists (
    select 1 from sondages_groupe sg
    join membres_groupe mg on mg.groupe_id = sg.groupe_id
    where sg.id = sondages_groupe_options.sondage_id and mg.user_id = auth.uid()
  ));

create policy "le createur du sondage ajoute ses options"
  on sondages_groupe_options for insert
  with check (exists (
    select 1 from sondages_groupe sg where sg.id = sondages_groupe_options.sondage_id and sg.created_by = auth.uid()
  ));

create policy "membres du groupe voient les votes"
  on sondages_groupe_votes for select
  using (exists (
    select 1 from sondages_groupe sg
    join membres_groupe mg on mg.groupe_id = sg.groupe_id
    where sg.id = sondages_groupe_votes.sondage_id and mg.user_id = auth.uid()
  ));

create policy "un membre vote pour lui-meme"
  on sondages_groupe_votes for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from sondages_groupe sg
      join membres_groupe mg on mg.groupe_id = sg.groupe_id
      where sg.id = sondages_groupe_votes.sondage_id and mg.user_id = auth.uid()
    )
  );

create policy "un membre change son propre vote"
  on sondages_groupe_votes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "un membre retire son propre vote"
  on sondages_groupe_votes for delete
  using (user_id = auth.uid());

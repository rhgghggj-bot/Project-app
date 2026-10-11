-- Programmes de révision : l'année d'études de l'élève (1re, 2e, 9e…) et le
-- chapitre auquel une note se rapporte (identifiant d'un chapitre de
-- public/programmes/*.json), pour ouvrir le cours en un clic depuis la note.
--
-- À exécuter une seule fois dans Supabase, après 20260113000000 :
-- Dashboard → SQL Editor → coller ce fichier → Run.

alter table profils_etudiant add column if not exists annee text;
alter table notes_etudiant add column if not exists chapitre_id text;
create index if not exists idx_notes_etudiant_chapitre on notes_etudiant(user_id, chapitre_id);

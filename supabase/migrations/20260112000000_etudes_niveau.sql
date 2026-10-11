-- Niveau d'études de l'élève (cycle, collège, ECG, CFC, HES, lycée…),
-- filière / option et spécialités (voie générale française). Sert à
-- proposer les matières et à adapter les explications de l'IA.
--
-- À exécuter une seule fois dans Supabase, après 20260111000000 :
-- Dashboard → SQL Editor → coller ce fichier → Run.

alter table profils_etudiant
  add column if not exists niveau text,
  add column if not exists filiere text,
  add column if not exists specialites text[] not null default '{}';

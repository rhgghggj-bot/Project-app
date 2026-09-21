-- Rappels de charges récurrentes. Une dépense récurrente peut maintenant
-- avoir un jour du mois ; un job planifié (Vercel Cron, voir vercel.json et
-- app/api/cron/rappels-charges) prévient l'utilisateur 3 jours avant.
--
-- À exécuter une seule fois dans Supabase : Dashboard → SQL Editor → coller
-- ce fichier → Run.

alter table depenses add column if not exists jour_du_mois int check (jour_du_mois between 1 and 31);
alter table depenses add column if not exists dernier_rappel_mois text;

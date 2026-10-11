-- Pages de révision personnelles (artefacts HTML) : la progression de la
-- page est sauvegardée dans un fichier <page>.etat.json réécrit à chaque
-- changement, ce qui demande le droit de mise à jour (upsert) sur ses
-- propres fichiers du bucket "etudes".
--
-- À exécuter une seule fois dans Supabase, après 20260112000000 :
-- Dashboard → SQL Editor → coller ce fichier → Run.

create policy "un etudiant met a jour ses fichiers d'etudes"
  on storage.objects for update
  using (bucket_id = 'etudes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'etudes' and (storage.foldername(name))[1] = auth.uid()::text);

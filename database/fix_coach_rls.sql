-- Correction des politiques RLS pour permettre la recherche de coach
-- Exécutez ceci dans l'éditeur SQL de Supabase

-- 1. Voir les politiques actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'coaches';

-- 2. Ajouter une politique pour permettre la lecture des coaches lors de l'inscription
-- Cette politique permet à tous les utilisateurs (même non connectés) de lire les coaches
-- pour vérifier les codes lors de l'inscription
CREATE POLICY "Allow reading coaches for signup" ON coaches FOR SELECT TO anon, authenticated USING (true);

-- 3. Vérifier que la politique a été créée
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'coaches';
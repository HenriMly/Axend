-- Solution temporaire : désactiver RLS sur coaches (DÉVELOPPEMENT SEULEMENT)
-- Exécutez ceci dans l'éditeur SQL de Supabase

-- Désactiver RLS temporairement
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;

-- Pour réactiver plus tard :
-- ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
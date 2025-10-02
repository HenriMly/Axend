-- Script pour confirmer manuellement les emails en développement
-- Exécutez ceci dans l'éditeur SQL de Supabase pour confirmer les emails

-- Confirmer tous les utilisateurs non confirmés
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Vérifier le résultat
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
ORDER BY created_at DESC;
-- Script pour confirmer l'email de l'utilisateur Arhoverse
-- Exécutez ceci dans l'éditeur SQL de Supabase

-- Confirmer l'email pour l'utilisateur spécifique
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE id = '59c31190-6d97-4eb9-9137-a4c6ff8a9a27';

-- Vérifier que ça a fonctionné
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE id = '59c31190-6d97-4eb9-9137-a4c6ff8a9a27';
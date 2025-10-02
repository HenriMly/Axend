-- Script de diagnostic pour tester l'authentification
-- Exécutez ceci dans l'éditeur SQL de Supabase

-- 1. Vérifier les utilisateurs créés
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Vérifier les coaches créés
SELECT 
    id,
    coach_code,
    name,
    email,
    created_at
FROM coaches
ORDER BY created_at DESC;

-- 3. Vérifier les clients créés
SELECT 
    id,
    coach_id,
    name,
    email,
    created_at
FROM clients
ORDER BY created_at DESC;
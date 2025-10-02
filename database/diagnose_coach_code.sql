-- Script de diagnostic et correction pour le code coach
-- Exécutez ceci dans l'éditeur SQL de Supabase

-- 1. Voir le coach actuel et son code
SELECT 
    id,
    coach_code,
    name,
    email,
    created_at
FROM coaches
WHERE email = 'baka@bak.com';

-- 2. Si le code est différent, le corriger
-- Décommentez la ligne suivante si nécessaire
-- UPDATE coaches SET coach_code = 'COACH_414420' WHERE email = 'baka@bak.com';

-- 3. Vérifier tous les coaches disponibles
SELECT 
    coach_code,
    name,
    email
FROM coaches
ORDER BY created_at DESC;
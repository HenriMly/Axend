-- Vérifier les codes coaches disponibles
SELECT 
    id,
    coach_code,
    name,
    email,
    created_at
FROM coaches
ORDER BY created_at DESC;
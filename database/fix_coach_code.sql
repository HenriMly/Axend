-- Corriger le code coach pour l'utilisateur Arhoverse
UPDATE coaches 
SET coach_code = 'COACH_414420'
WHERE id = '59c31190-6d97-4eb9-9137-a4c6ff8a9a27';

-- Vérifier le résultat
SELECT 
    id,
    coach_code,
    name,
    email
FROM coaches
WHERE id = '59c31190-6d97-4eb9-9137-a4c6ff8a9a27';
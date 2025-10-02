# 🚀 Guide d'installation Supabase pour Axend Fitness

## Étape 1: Créer votre projet Supabase

1. **Allez sur [supabase.com](https://supabase.com)**
2. **Créez un compte gratuit**
3. **Cliquez sur "New Project"**
4. **Choisissez votre organisation**
5. **Donnez un nom à votre projet : "axend-fitness"**
6. **Choisissez un mot de passe pour la base de données (notez-le !)**
7. **Sélectionnez une région proche de vous**
8. **Cliquez sur "Create new project"**

## Étape 2: Configurer l'authentification

1. **Dans votre dashboard Supabase, allez dans "Authentication" > "Settings"**
2. **Dans "Site URL", mettez : `http://localhost:3000`**
3. **Dans "Redirect URLs", ajoutez : `http://localhost:3000/auth/callback`**
4. **Activez "Enable email confirmations" si vous voulez**

## Étape 3: Récupérer vos clés API

1. **Allez dans "Settings" > "API"**
2. **Copiez votre "Project URL"**
3. **Copiez votre "anon public" key**
4. **Copiez votre "service_role" key (gardez-la secrète !)**

## Étape 4: Configurer vos variables d'environnement

**Remplacez le contenu de votre fichier `.env.local` par :**

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

## Étape 5: Initialiser la base de données

1. **Dans Supabase, allez dans "SQL Editor"**
2. **Cliquez sur "New query"**
3. **Copiez tout le contenu du fichier `database/schema.sql`**
4. **Collez-le dans l'éditeur**
5. **Cliquez sur "Run" pour exécuter le script**

## Étape 6: Vérifier l'installation

1. **Allez dans "Table Editor"**
2. **Vous devriez voir les tables : coaches, clients, programs, workouts, etc.**
3. **Allez dans "Authentication" > "Users" (sera vide pour l'instant)**

## Étape 7: Tester l'application

1. **Lancez votre application : `npm run dev`**
2. **Une fois que j'aurai mis à jour le code, vous pourrez créer des comptes**
3. **L'authentification se fera via Supabase au lieu de localStorage**

## 🔐 Sécurité incluse

- **Row Level Security (RLS)** : Les coaches ne voient que leurs clients
- **Authentification JWT** : Tokens sécurisés automatiques
- **Politiques de sécurité** : Accès contrôlé à toutes les données

## 📊 Fonctionnalités bonus

- **Real-time** : Mises à jour en temps réel
- **Storage** : Pour les photos de progression (à ajouter)
- **Edge Functions** : Pour la logique métier avancée

---

**Dites-moi quand vous avez terminé ces étapes et je pourrai continuer avec la migration du code !** 🚀
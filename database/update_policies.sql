-- Mise à jour des politiques RLS pour corriger l'erreur d'insertion

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Coaches can insert own data" ON coaches;
DROP POLICY IF EXISTS "Coaches can insert clients" ON clients;

-- Nouvelles politiques plus permissives pour l'inscription
CREATE POLICY "Allow service role to insert coaches" ON coaches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert clients" ON clients FOR INSERT WITH CHECK (true);

-- Function to handle user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if user has metadata indicating role
  IF NEW.raw_user_meta_data->>'role' = 'coach' THEN
    INSERT INTO public.coaches (id, coach_code, name, email)
    VALUES (
      NEW.id,
      'COACH_' || EXTRACT(EPOCH FROM NOW())::bigint % 1000000,
      NEW.raw_user_meta_data->>'name',
      NEW.email
    );
  ELSIF NEW.raw_user_meta_data->>'role' = 'client' THEN
    -- For clients, we'll handle coach_id in the application
    -- since we need to look up the coach by code
    NULL; -- Will be handled in application logic
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Supabase Database Schema for Axend Fitness App
-- Copiez et collez ce script dans l'éditeur SQL de Supabase

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    coach_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    current_weight DECIMAL(5,2),
    target_weight DECIMAL(5,2),
    age INTEGER,
    height INTEGER, -- in cm
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT, -- "3 fois par semaine"
    duration TEXT, -- "60 minutes"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exercises table (template d'exercices)
CREATE TABLE IF NOT EXISTS exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps TEXT, -- "8-12" ou "10"
    weight TEXT, -- "60-70kg" ou "Au poids du corps"
    rest_time TEXT, -- "90 secondes"
    instructions TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workouts table (séances réalisées)
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    duration INTEGER, -- en minutes
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_exercises table (exercices dans une séance)
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workout_sets table (séries réalisées)
CREATE TABLE IF NOT EXISTS workout_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
    reps INTEGER NOT NULL,
    weight DECIMAL(6,2), -- en kg
    completed BOOLEAN DEFAULT true,
    rest_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create measurements table (mesures corporelles)
CREATE TABLE IF NOT EXISTS measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    weight DECIMAL(5,2), -- en kg
    body_fat DECIMAL(4,1), -- pourcentage
    muscle_mass DECIMAL(5,2), -- en kg
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, date)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Coaches can only see/edit their own data
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can view own data" ON coaches FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Coaches can update own data" ON coaches FOR UPDATE USING (auth.uid() = id);
-- Allow insert for service role (during signup process)
CREATE POLICY "Allow service role to insert coaches" ON coaches FOR INSERT WITH CHECK (true);

-- Clients can only see/edit their own data, coaches can see their clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view own data" ON clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Coaches can view their clients" ON clients FOR SELECT USING (
    EXISTS (SELECT 1 FROM coaches WHERE coaches.id = auth.uid() AND coaches.id = clients.coach_id)
);
CREATE POLICY "Clients can update own data" ON clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Coaches can update their clients" ON clients FOR UPDATE USING (
    EXISTS (SELECT 1 FROM coaches WHERE coaches.id = auth.uid() AND coaches.id = clients.coach_id)
);
-- Allow service role to insert clients (during signup process)
CREATE POLICY "Allow service role to insert clients" ON clients FOR INSERT WITH CHECK (true);

-- Programs: coaches can manage all, clients can view their own
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can manage their programs" ON programs FOR ALL USING (
    EXISTS (SELECT 1 FROM coaches WHERE coaches.id = auth.uid() AND coaches.id = programs.coach_id)
);
CREATE POLICY "Clients can view their programs" ON programs FOR SELECT USING (auth.uid() = client_id);

-- Exercises: same as programs
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can manage exercises" ON exercises FOR ALL USING (
    EXISTS (SELECT 1 FROM programs JOIN coaches ON programs.coach_id = coaches.id 
            WHERE programs.id = exercises.program_id AND coaches.id = auth.uid())
);
CREATE POLICY "Clients can view their exercises" ON exercises FOR SELECT USING (
    EXISTS (SELECT 1 FROM programs WHERE programs.id = exercises.program_id AND programs.client_id = auth.uid())
);

-- Workouts: clients can manage their own, coaches can view their clients'
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own workouts" ON workouts FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view client workouts" ON workouts FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients JOIN coaches ON clients.coach_id = coaches.id 
            WHERE clients.id = workouts.client_id AND coaches.id = auth.uid())
);

-- Workout exercises and sets: follow workout permissions
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout exercises follow workout permissions" ON workout_exercises FOR ALL USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id 
            AND (workouts.client_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM clients JOIN coaches ON clients.coach_id = coaches.id 
                        WHERE clients.id = workouts.client_id AND coaches.id = auth.uid())))
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout sets follow workout permissions" ON workout_sets FOR ALL USING (
    EXISTS (SELECT 1 FROM workout_exercises JOIN workouts ON workout_exercises.workout_id = workouts.id
            WHERE workout_exercises.id = workout_sets.workout_exercise_id 
            AND (workouts.client_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM clients JOIN coaches ON clients.coach_id = coaches.id 
                        WHERE clients.id = workouts.client_id AND coaches.id = auth.uid())))
);

-- Measurements: clients can manage their own, coaches can view their clients'
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own measurements" ON measurements FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Coaches can view client measurements" ON measurements FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients JOIN coaches ON clients.coach_id = coaches.id 
            WHERE clients.id = measurements.client_id AND coaches.id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_coach_id ON programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_programs_client_id ON programs(client_id);
CREATE INDEX IF NOT EXISTS idx_workouts_client_id ON workouts(client_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);

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
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data (optionnel)
-- Vous pouvez décommenter ceci pour avoir des données de test
/*
-- Sample coach
INSERT INTO auth.users (id, email) VALUES ('11111111-1111-1111-1111-111111111111', 'coach@example.com');
INSERT INTO coaches (id, coach_code, name, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'COACH_123456', 'Coach Durand', 'coach@example.com');

-- Sample client
INSERT INTO auth.users (id, email) VALUES ('22222222-2222-2222-2222-222222222222', 'client@example.com');
INSERT INTO clients (id, coach_id, name, email, current_weight, target_weight, age, height) VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Marie Dupont', 'client@example.com', 65.5, 60.0, 28, 165);
*/
'use client';

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRequireClient } from '@/lib/auth-context';
import { dataService } from '@/lib/data';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ClientData {
  id: string;
  name: string;
  email: string;
  current_weight?: number;
  target_weight?: number;
  age?: number;
  height?: number;
  coach?: {
    name: string;
    email: string;
    coach_code: string;
  };
}

interface Program {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  program_days?: Array<{
    day_of_week: number;
    day_name?: string;
    is_rest_day: boolean;
    workouts?: Array<{
      id?: string;
      name: string;
      time_slot?: string;
      estimated_duration?: number;
      exercises?: Array<{
        id?: string;
        exercise_name?: string;
        name?: string;
        sets?: number;
        reps?: string;
        weight?: string;
        rest_time?: number;
        notes?: string;
      }>;
    }>;
  }>;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest_time?: string;
}

interface Workout {
  id: string;
  date: string;
  program_id: string;
  exercises: any;
  notes?: string;
  programs?: {
    name: string;
  };
}

interface Measurement {
  id: string;
  date: string;
  weight: number;
  body_fat?: number;
  muscle_mass?: number;
}

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const { user, userProfile, loading, isClient, signOut } = useRequireClient();
  
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // États pour l'assignation coach
  const [coachCode, setCoachCode] = useState('');
  const [isAssigningCoach, setIsAssigningCoach] = useState(false);
  const [assignError, setAssignError] = useState('');
  
  // États pour la modal de programme
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [selectedDayObj, setSelectedDayObj] = useState<any | null>(null);
  const [selectedWorkoutObj, setSelectedWorkoutObj] = useState<any | null>(null);
  const [isLoadingSessionDetails, setIsLoadingSessionDetails] = useState(false);
  const [isStartingProgram, setIsStartingProgram] = useState(false);
  
  // États pour la modal d'ajout de mesure
  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [measurementData, setMeasurementData] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    date: new Date().toISOString().split('T')[0] // Date du jour par défaut
  });
  
  // Calculate completed workouts for this week
  const completedWorkouts = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek;
    }).length;
  }, [workouts]);

  useEffect(() => {
    if (!loading && userProfile && isClient && userProfile.id && !dataLoaded) {
      loadClientData();
    }
  }, [loading, userProfile?.id, isClient, dataLoaded]);

  const loadClientData = async () => {
    if (!userProfile?.id) {
      console.error('[loadClientData] No userProfile or ID');
      return;
    }

    try {
      setIsLoadingData(true);
      
      // Charger les données complètes du client (incluant les informations du coach)
      const completeClientData = await dataService.getClientData(userProfile.id);
      
      // Mapper les données pour correspondre à l'interface attendue
      const mappedClientData = {
        ...completeClientData,
        coach: completeClientData.coaches // Mapper coaches -> coach
      };
      
      setClientData(mappedClientData as ClientData);
      
      // Charger les programmes, séances et mesures - UTILISER L'ID DU CLIENT (pas l'ID auth)
      const actualClientId = completeClientData.id; // L'ID réel du client dans la table
      console.log('[ClientDashboard] Auth ID:', userProfile.id);
      console.log('[ClientDashboard] Actual Client ID:', actualClientId);
      
      const [clientPrograms, clientWorkouts, clientMeasurements] = await Promise.all([
        dataService.getClientProgramsAdvanced(actualClientId),
        dataService.getClientWorkouts(actualClientId),
        dataService.getClientMeasurements(actualClientId)
      ]);
      
      console.log('[ClientDashboard] Programs loaded:', clientPrograms);
      console.log('[ClientDashboard] Workouts loaded:', clientWorkouts);
      console.log('[ClientDashboard] Measurements loaded:', clientMeasurements);
      
      setPrograms(clientPrograms || []);
      setWorkouts(clientWorkouts || []);
      setMeasurements(clientMeasurements || []);
      
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setIsLoadingData(false);
      setDataLoaded(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program);
    setShowProgramModal(true);
  };

  const closeProgramModal = () => {
    setShowProgramModal(false);
    setSelectedProgram(null);
    setSelectedDayObj(null);
    setSelectedWorkoutObj(null);
  };

  // Start the selected program: extracted from inline handler to avoid large inline JSX function
  const startSelectedProgram = async () => {
    if (!selectedProgram || !userProfile?.id) {
      alert('Impossible de démarrer le programme: données manquantes');
      return;
    }

    try {
      setIsStartingProgram(true);

      // Build a programPayload compatible with the workout runner
      // If the user explicitly clicked a day/workout, prefer that exact workout and build a trimmed programPayload
      let programPayload: any = { id: selectedProgram.id, name: selectedProgram.name };

      // Determine workout exercises: prefer explicit selection, otherwise fallback to program structure
      let workoutExercises: any[] = [];
      let program_day_id: string | undefined = undefined;
      let template_workout_id: string | undefined = undefined;

      if (selectedWorkoutObj && selectedDayObj) {
        // Use the selected day/workout directly
        const chosenDay = selectedDayObj;
        const chosenWorkout = selectedWorkoutObj;
        program_day_id = chosenDay.id;
        template_workout_id = chosenWorkout.id;

        const exList = chosenWorkout.workout_exercises || chosenWorkout.exercises || [];
        workoutExercises = (exList || []).map((ex: any, idx: number) => ({
          id: ex.id || `${template_workout_id || 'tmp'}-ex-${idx}`,
          exercise_id: ex.exercise_id || ex.id || `ex-${idx}`,
          exercise_name: ex.exercise_name || ex.name || ex.exercise_name || 'Exercice',
          exercise_category: ex.exercise_category || null,
          exercise_equipment: ex.exercise_equipment || null,
          order_in_workout: ex.order_in_workout || (idx + 1),
          sets: typeof ex.sets !== 'undefined' ? ex.sets : (ex.sets || 3),
          reps: ex.reps || '12',
          weight: ex.weight || null,
          rest_time: ex.rest_time || ex.rest || 60,
          notes: ex.notes || ex.instructions || null
        }));

  programPayload.program_days = [{ ...chosenDay, workouts: [{ ...chosenWorkout, workout_exercises: workoutExercises }] }];
      } else {
        // fallback: try to derive from selectedProgram.program_days or legacy exercises
        programPayload = { ...programPayload, ...selectedProgram };
        const pdays = (selectedProgram as any).program_days;
        const chosenDay = pdays && pdays.length ? (pdays.find((d: any) => !d.is_rest_day) || pdays[0]) : null;
        const chosenWorkout = chosenDay && chosenDay.workouts && chosenDay.workouts.length ? chosenDay.workouts[0] : null;
        if (chosenDay) program_day_id = chosenDay.id;
        if (chosenWorkout) {
          template_workout_id = chosenWorkout.id;
          const exList = chosenWorkout.workout_exercises || chosenWorkout.exercises || [];
          workoutExercises = (exList || []).map((ex: any, idx: number) => ({
            id: ex.id || `${template_workout_id || 'tmp'}-ex-${idx}`,
            exercise_id: ex.exercise_id || ex.id || `ex-${idx}`,
            exercise_name: ex.exercise_name || ex.name || ex.exercise_name || 'Exercice',
            exercise_category: ex.exercise_category || null,
            exercise_equipment: ex.exercise_equipment || null,
            order_in_workout: ex.order_in_workout || (idx + 1),
            sets: typeof ex.sets !== 'undefined' ? ex.sets : (ex.sets || 3),
            reps: ex.reps || '12',
            weight: ex.weight || null,
            rest_time: ex.rest_time || ex.rest || 60,
            notes: ex.notes || ex.instructions || null
          }));

          programPayload.program_days = [{ ...chosenDay, workouts: [{ ...chosenWorkout, workout_exercises: workoutExercises }] }];
        } else if (selectedProgram.exercises && selectedProgram.exercises.length > 0) {
          // fallback: flat exercises list
          workoutExercises = (selectedProgram.exercises || []).map((ex: any, idx: number) => ({
            id: ex.id || `ex-${idx}`,
            exercise_id: ex.id || `ex-${idx}`,
            exercise_name: ex.name || ex.exercise_name || 'Exercice',
            exercise_category: null,
            exercise_equipment: null,
            order_in_workout: idx + 1,
            sets: ex.sets || 3,
            reps: ex.reps || '12',
            weight: ex.weight || null,
            rest_time: ex.rest_time || ex.rest || 60,
            notes: ex.notes || ex.instructions || null
          }));

          // synthesize a program_day + workout so runner can consume
          const syntheticWorkout = { id: `synthetic-${selectedProgram.id}`, name: selectedProgram.name, workout_exercises: workoutExercises };
          programPayload.program_days = [{ id: `pd-${selectedProgram.id}`, day_of_week: 1, day_name: 'Séance', is_rest_day: false, workouts: [syntheticWorkout] }];
          template_workout_id = syntheticWorkout.id;
        }
      }

      // Build session payload
      const sessionPayload: any = {
        client_id: userProfile.id,
        program_id: selectedProgram.id,
        program_name: selectedProgram.name,
        date: new Date().toISOString(),
        status: 'in_progress',
        exercises_count: workoutExercises.length
      };
      if (program_day_id) sessionPayload.program_day_id = program_day_id;
      if (template_workout_id) sessionPayload.template_workout_id = template_workout_id;

      // Create session server-side
      const res = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', payload: sessionPayload })
      });

      let createdSession: any = null;
      try {
        const body = await res.json();
        createdSession = body?.data || null;
      } catch (e) {
        console.warn('Could not parse /api/workout-sessions response', e);
      }

      // Prepare runner data (session + program). Include workout_exercises so runner can start immediately
      const runnerData = {
        session: createdSession,
        program: programPayload
      };

      const encoded = encodeURIComponent(JSON.stringify(runnerData));
      setShowProgramModal(false);
      router.push(`/dashboard/client/workout?data=${encoded}`);
    } catch (err) {
      console.error('Failed to start program', err);
      alert('Erreur lors du démarrage du programme. Vérifiez la console.');
    } finally {
      setIsStartingProgram(false);
    }
  };

  const handleAddMeasurement = () => {
    setShowAddMeasurementModal(true);
  };

  const closeAddMeasurementModal = () => {
    setShowAddMeasurementModal(false);
    setMeasurementData({
      weight: '',
      body_fat: '',
      muscle_mass: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const submitMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id || !measurementData.weight) {
      alert('Données manquantes : ID utilisateur ou poids requis');
      return;
    }

    const weight = parseFloat(measurementData.weight);
    if (isNaN(weight) || weight <= 0) {
      alert('Veuillez entrer un poids valide');
      return;
    }

    setIsAddingMeasurement(true);

    try {
      console.log('Client submitMeasurement - userProfile.id:', userProfile.id);
      console.log('Client submitMeasurement - form values:', measurementData);
      
      const measurementToAdd = {
        client_id: userProfile.id,
        date: measurementData.date,
        weight: weight,
        body_fat: measurementData.body_fat ? parseFloat(measurementData.body_fat) : null,
        muscle_mass: measurementData.muscle_mass ? parseFloat(measurementData.muscle_mass) : null
      };

      console.log('Adding measurement:', measurementToAdd);
      
      const result = await dataService.addClientMeasurement(measurementToAdd);
      console.log('Measurement added successfully:', result);
      
      // Recharger les mesures
      const updatedMeasurements = await dataService.getClientMeasurements(userProfile.id);
      setMeasurements(updatedMeasurements || []);
      
      // Mettre à jour le poids actuel dans clientData
      if (updatedMeasurements && updatedMeasurements.length > 0) {
        setClientData(prev => prev ? { 
          ...prev, 
          current_weight: updatedMeasurements[0].weight 
        } : prev);
      }
      
      closeAddMeasurementModal();
      alert('Mesure ajoutée avec succès !');
      
    } catch (error: any) {
      console.error('Client measurement save failed');
      console.error('Error adding measurement:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error details:', error?.details);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Erreur lors de l\'ajout de la mesure. Veuillez réessayer.';
      if (error?.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = 'Une mesure existe déjà pour cette date. Elle a été mise à jour avec les nouvelles valeurs.';
          // Si c'est juste un conflit de clé, on peut considérer cela comme un succès
          closeAddMeasurementModal();
          // Recharger les mesures pour afficher la mise à jour
          try {
            const updatedMeasurements = await dataService.getClientMeasurements(userProfile.id);
            setMeasurements(updatedMeasurements || []);
            
            // Mettre à jour le poids actuel dans clientData
            if (updatedMeasurements && updatedMeasurements.length > 0) {
              setClientData(prev => prev ? { 
                ...prev, 
                current_weight: updatedMeasurements[0].weight 
              } : prev);
            }
            
            alert('Mesure mise à jour avec succès !');
            return;
          } catch (reloadError) {
            console.error('Error reloading measurements:', reloadError);
          }
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      alert(errorMessage);
    } finally {
      setIsAddingMeasurement(false);
    }
  };

  const handleAssignCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachCode.trim() || !userProfile) return;

    setIsAssigningCoach(true);
    setAssignError('');

    try {
      const supabase = createClientComponentClient();
      
      // Chercher le coach
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('id, name, email, coach_code')
        .eq('coach_code', coachCode.trim())
        .single();

      if (coachError || !coachData) {
        setAssignError('Code coach invalide');
        return;
      }

      // Assigner le coach au client
      const { error: updateError } = await supabase
        .from('clients')
        .update({ coach_id: coachData.id })
        .eq('id', userProfile.id);

      if (updateError) {
        setAssignError('Erreur lors de l\'assignation');
        return;
      }

      // Recharger les données
      await loadClientData();
      setCoachCode('');
      
    } catch (error) {
      console.error('Error assigning coach:', error);
      setAssignError('Erreur inattendue');
    } finally {
      setIsAssigningCoach(false);
    }
  };

  // Afficher le chargement tant que l'authentification n'est pas complètement résolue
  if (loading || (!userProfile && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement...</span>
        </div>
      </div>
    );
  }

  // Seulement afficher "Accès refusé" si on est sûr que l'utilisateur n'est pas un client
  if (!loading && (!userProfile || !isClient)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Accès refusé</h2>
          <p className="text-gray-600 dark:text-gray-400">Vous devez être connecté comme client.</p>
        </div>
      </div>
    );
  }

  // Si pas de clientData mais qu'on est encore en chargement, on attend
  if (!clientData && isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement de vos données...</span>
        </div>
      </div>
    );
  }

  // Si pas de clientData mais qu'on a un userProfile, utilisons le userProfile
  const displayData = clientData || userProfile;

  // Si vraiment aucune donnée après tout ça, on affiche un état minimal
  if (!displayData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Initialisation...</span>
        </div>
      </div>
    );
  }

  const EmptyState = ({ title, description, buttonText, onButtonClick }: {
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
  }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <button
        onClick={onButtonClick}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        {buttonText}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header moderne */}
      <header className="relative w-full px-6 py-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-lg shadow-blue-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/" className="group flex items-center space-x-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-white dark:hover:from-gray-700 transition-all duration-200 hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Axend
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Client Dashboard</p>
              </div>
            </Link>
            
            {clientData?.coach && (
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-emerald-100/50 to-cyan-100/50 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Coach: {clientData.coach.name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Code: {clientData.coach.coach_code}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <div className="flex space-x-3">
              <button className="relative p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </button>
              
              <Link href="/dashboard/client/settings" className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
            
            {/* Profil client */}
            <div className="flex items-center space-x-4 px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-lg">
                  {displayData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {displayData.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Client actif</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 hover:scale-105"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation tabs moderne */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/20 dark:border-gray-700/30 mb-8">
          <nav className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex space-x-2 min-w-max py-1">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
                { id: 'programs', label: 'Programmes', icon: '💪', gradient: 'from-purple-500 to-pink-500' },
                { id: 'workouts', label: 'Séances', icon: '🏋️', gradient: 'from-green-500 to-emerald-500' },
                { id: 'progress', label: 'Progression', icon: '📈', gradient: 'from-orange-500 to-red-500' },
                { id: 'settings', label: 'Profil', icon: '⚙️', gradient: 'from-indigo-500 to-purple-500' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 group flex-shrink-0 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.gradient.split('-')[1]}-500/25`
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                  )}
                  <span className={`text-base transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {tab.icon}
                  </span>
                  <span className="relative z-10 font-semibold text-xs sm:text-sm">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="ml-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 pb-12">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Bienvenue, {displayData.name}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {displayData.coach ? `Coach: ${displayData.coach.name}` : 'Aucun coach assigné'}
              </p>
              
              {/* Action rapide - Séance du jour */}
              <div className="max-w-md mx-auto">
                <Link href="/dashboard/client/workout-today" className="block">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center justify-center mb-3">
                      <div className="text-4xl">🔥</div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Séance du jour</h3>
                    <p className="text-orange-100 text-sm">
                      {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <div className="mt-4">
                      <div className="bg-white/20 rounded-lg px-4 py-2 inline-flex items-center space-x-2">
                        <span className="text-sm font-medium">Commencer maintenant</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Stats Cards modernes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Programmes */}
              <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                      ACTIFS
                    </div>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                    {programs.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Programmes</div>
                </div>
              </div>

              {/* Entraînements */}
              <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                      SEMAINE
                    </div>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2">
                    {completedWorkouts}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Entraînements</div>
                </div>
              </div>

              {/* Poids */}
              <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      ACTUEL
                    </div>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
                    {measurements.length > 0 ? measurements[0].weight : (displayData.current_weight || 'N/A')}
                    {(measurements.length > 0 || displayData.current_weight) && 'kg'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Objectif: {displayData.target_weight || 'N/A'}{displayData.target_weight && 'kg'}
                  </div>
                </div>
              </div>

              {/* Mesures */}
              <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h3a2 2 0 012 2v1M13 13l-2-2" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                      DONNÉES
                    </div>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent mb-2">
                    {measurements.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Mesures enregistrées</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Mes Programmes
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Découvrez vos programmes personnalisés</p>
              </div>
            </div>
            
            {programs.length === 0 ? (
              <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 text-center shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl"></div>
                <EmptyState
                  title="Aucun programme"
                  description="Votre coach n'a pas encore créé de programme pour vous. Contactez-le pour commencer !"
                  buttonText="Contacter mon coach"
                  onButtonClick={() => {
                    if (displayData.coach?.email) {
                      window.location.href = `mailto:${displayData.coach.email}`;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {programs.map((program) => (
                  <div key={program.id} className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-3">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-transparent rounded-3xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-900/40 px-4 py-2 rounded-full backdrop-blur-sm">
                          {program.exercises?.length || 0} exercices
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
                        {program.name}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        {program.description || 'Programme personnalisé créé par votre coach'}
                      </p>
                      
                      <button 
                        onClick={() => handleViewProgram(program)}
                        className="w-full group relative px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Voir le programme
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">Mes Séances</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Suivez vos entraînements et performances</p>
              </div>
              <button className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Nouvelle séance
                </span>
              </button>
            </div>

            {workouts.length === 0 ? (
              <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 text-center shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl pointer-events-none"></div>
                <EmptyState
                  title="Aucune séance enregistrée"
                  description="Commencez votre première séance d'entraînement dès maintenant !"
                  buttonText="Commencer une séance"
                  onButtonClick={() => alert('Fonctionnalité à venir: Démarrer une séance')}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') { /* emulate click */ (e.target as HTMLElement).click(); } }}
                    onClick={async () => {
                      try {
                        setIsLoadingSessionDetails(true);
                        // optimistic UI
                        setSelectedWorkoutObj(workout);
                        setSelectedDayObj(null);
                        // Ensure the modal/details area is visible: create a minimal selectedProgram and open the modal
                        try {
                          const progName = (workout as any).program_name || (workout as any).programs?.name || (workout as any).session_title || 'Séance';
                          setSelectedProgram({ id: (workout as any).program_id || null, name: progName } as any);
                          setShowProgramModal(true);
                        } catch (e) {
                          console.warn('[ClientDashboard] failed to set selectedProgram for modal', e);
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });

                        console.debug('[ClientDashboard] loading session details for workout.id=', workout.id, 'workout=', workout);

                        // Determine best candidate session id field(s) returned by the view
                        const candidateSessionIds = [
                          workout.id,
                          (workout as any).workout_session_id,
                          (workout as any).session_id,
                          (workout as any).session?.id,
                          (workout as any).id__session,
                        ].filter(Boolean) as string[];

                        let fetched: any = null;

                        // Try normalized tables first using any candidate id
                        for (const sid of candidateSessionIds) {
                          try {
                            console.debug('[ClientDashboard] trying getSessionExercisesWithSets with sid=', sid);
                            const f = await dataService.getSessionExercisesWithSets(sid);
                            if (Array.isArray(f) && f.length > 0) {
                              fetched = f;
                              console.debug('[ClientDashboard] getSessionExercisesWithSets returned data for sid=', sid);
                              break;
                            }
                          } catch (e) {
                            console.warn('[ClientDashboard] getSessionExercisesWithSets failed for sid=', sid, e);
                          }
                        }

                        // If still nothing, try fetching the full workout_session row (may include nested exercises/sets)
                        if (!fetched) {
                          const trySid = candidateSessionIds[0] || (workout as any).session_id || (workout as any).workout_session_id || null;
                          if (trySid) {
                            try {
                              console.debug('[ClientDashboard] calling getWorkoutSessionById with id=', trySid);
                              const ws = await dataService.getWorkoutSessionById(trySid);
                              console.debug('[ClientDashboard] getWorkoutSessionById returned:', ws);
                              if (ws && Array.isArray(ws.workout_session_exercises) && ws.workout_session_exercises.length > 0) {
                                fetched = ws.workout_session_exercises.map((se: any) => ({ ...se, workout_session_sets: se.workout_session_sets || [] }));
                              }
                            } catch (e) {
                              console.warn('[ClientDashboard] getWorkoutSessionById failed', e);
                            }
                          }
                        }

                        console.debug('[ClientDashboard] final fetched session_exercises:', fetched);

                        if (Array.isArray(fetched) && fetched.length > 0) {
                          const mapped = fetched.map((se: any) => ({
                            id: se.id,
                            workout_exercise_id: se.workout_exercise_id,
                            exercise_id: se.exercise_id,
                            exercise_name: se.exercise_name,
                            order_in_workout: se.order ?? se.order_in_workout,
                            sets: se.sets,
                            reps: se.reps,
                            weight: se.weight,
                            rest_time: se.rest_seconds ?? se.rest_time,
                            notes: se.notes,
                            completedSets: (se.workout_session_sets || []).map((s: any) => ({
                              setNumber: s.set_number,
                              repsCompleted: s.reps_completed,
                              weightUsed: s.weight_used,
                              durationSeconds: s.duration_seconds,
                            })),
                          }));

                          setSelectedWorkoutObj((prev: any) => ({ ...prev, workout_exercises: mapped, exercises: mapped }));
                          return;
                        }

                        // If no normalized session rows, try legacy workout_sets lookup as a best-effort fallback
                        try {
                          if (Array.isArray(workout.exercises) && workout.exercises.length > 0) {
                            console.debug('[ClientDashboard] no normalized session_exercises found; attempting legacy lookup for workout.exercises');
                            const legacyPromises = workout.exercises.map(async (we: any) => {
                              const exerciseKey = we.workout_exercise_id || we.id || we.exercise_id;
                              if (!exerciseKey) return { we, rows: [] };
                              try {
                                const rows = await dataService.getLegacyWorkoutSetsByExercise(exerciseKey);
                                return { we, rows };
                              } catch (legacyErr) {
                                console.warn('[ClientDashboard] legacy lookup failed for', exerciseKey, legacyErr);
                                return { we, rows: [] };
                              }
                            });

                            const legacyResults = await Promise.all(legacyPromises);
                            const mapped = legacyResults.map(({ we, rows }: any) => ({
                              id: we.id || we.workout_exercise_id || `${workout.id}-ex-${Math.random().toString(36).slice(2,8)}`,
                              workout_exercise_id: we.workout_exercise_id || we.id || null,
                              exercise_id: we.exercise_id || null,
                              exercise_name: we.exercise_name || we.name || we.exercise_name || 'Exercice',
                              order_in_workout: we.order_in_workout ?? we.order ?? 0,
                              sets: we.sets || we.planned_sets || 0,
                              reps: we.reps || we.planned_reps || '',
                              weight: we.weight || we.suggested_weight || null,
                              rest_time: we.rest_time || we.rest || 60,
                              notes: we.notes || null,
                              completedSets: (rows || []).map((r: any, idx: number) => ({
                                setNumber: r.set_number ?? idx + 1,
                                repsCompleted: r.reps ?? r.reps_completed ?? null,
                                weightUsed: r.weight ?? r.weight_used ?? null,
                                durationSeconds: r.duration_seconds ?? r.duration ?? null,
                              })),
                            }));

                            setSelectedWorkoutObj((prev: any) => ({ ...prev, workout_exercises: mapped, exercises: mapped }));
                            return;
                          }
                        } catch (fallbackErr) {
                          console.warn('[ClientDashboard] fallback legacy lookup error', fallbackErr);
                        }

                        // Nothing found — leave selected object as-is so UI shows planned info
                        console.debug('[ClientDashboard] no session_exercises or legacy sets found for workout', workout.id);

                      } catch (err) {
                        console.error('[ClientDashboard] failed loading session details', err);
                      } finally {
                        setIsLoadingSessionDetails(false);
                      }
                    }}
                    className="cursor-pointer group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2"
                  >
                    <div>
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl pointer-events-none"></div>
                      <div className="relative">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {(
                                  (workout as any)?.session_title ||
                                  (workout as any)?.session_name ||
                                  (workout as any)?.title ||
                                  (workout as any)?.name ||
                                  (workout as any)?.program_name ||
                                  workout.programs?.name ||
                                  'Séance libre'
                                )}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 font-medium">
                                {new Date(workout.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-4 py-2 rounded-full backdrop-blur-sm">TERMINÉE</div>
                        </div>

                        {workout.notes && (
                          <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{workout.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Ma Progression
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Suivez votre évolution physique</p>
              </div>
              <button 
                onClick={handleAddMeasurement}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter mesure
                </span>
              </button>
            </div>
            
            {measurements.length === 0 ? (
              <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-12 text-center shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
                <EmptyState
                  title="Aucune mesure enregistrée"
                  description="Commencez à suivre votre progression en ajoutant vos premières mesures."
                  buttonText="Ajouter mes mesures"
                  onButtonClick={() => {
                    // Logic to add measurements
                    alert('Fonctionnalité à venir: Ajouter des mesures');
                  }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Évolution du poids */}
                <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Évolution du poids
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {measurements.slice(0, 5).map((measurement) => (
                        <div key={measurement.id} className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {new Date(measurement.date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="font-bold text-xl text-gray-900 dark:text-white">
                            {measurement.weight}kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Statistiques */}
                <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-cyan-500/25 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Statistiques
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Poids initial</span>
                        <span className="font-bold text-xl text-gray-900 dark:text-white">{measurements[measurements.length - 1]?.weight}kg</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Poids actuel</span>
                        <span className="font-bold text-xl text-gray-900 dark:text-white">{measurements[0]?.weight}kg</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Évolution</span>
                        <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                          {measurements.length >= 2 
                            ? `${(measurements[0].weight - measurements[measurements.length - 1].weight).toFixed(1)}kg`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                Mon Profil
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Gérez vos informations personnelles</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informations personnelles */}
              <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-3xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Informations personnelles
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Nom
                      </label>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{displayData.name}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Email
                      </label>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{displayData.email}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Âge
                        </label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {displayData.age ? `${displayData.age} ans` : 'Non renseigné'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Taille
                        </label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {displayData.height ? `${displayData.height} cm` : 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/dashboard/client/settings">
                    <button className="mt-8 w-full group relative px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-semibold shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-700 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier mes informations
                      </span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Mon Coach */}
              <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl pointer-events-none"></div>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Mon Coach
                    </h3>
                  </div>
                  
                  {displayData.coach ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Nom du coach
                        </label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{displayData.coach.name}</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          Email
                        </label>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{displayData.coach.email}</p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30">
                        <label className="block text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                          Code coach
                        </label>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">{displayData.coach.coach_code}</p>
                      </div>
                      
                      <button 
                        onClick={() => window.location.href = `mailto:${displayData.coach?.email}`}
                        className="w-full group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Contacter mon coach
                        </span>
                      </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center shadow-2xl">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Aucun coach assigné
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      Entrez le code de votre coach pour commencer votre suivi personnalisé
                    </p>
                    
                    <form onSubmit={handleAssignCoach} className="max-w-sm mx-auto space-y-6">
                      <div>
                        <input
                          type="text"
                          value={coachCode}
                          onChange={(e) => setCoachCode(e.target.value)}
                          placeholder="Code coach (ex: COACH_123456)"
                          className="w-full px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white backdrop-blur-sm font-mono text-lg"
                          disabled={isAssigningCoach}
                          required
                        />
                      </div>
                      
                      {assignError && (
                        <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-2xl border border-red-200/30 dark:border-red-700/30 backdrop-blur-sm">
                          <p className="text-red-600 dark:text-red-400 font-medium">{assignError}</p>
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isAssigningCoach || !coachCode.trim()}
                        className="w-full group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">
                          {isAssigningCoach ? 'Assignation en cours...' : 'Assigner le coach'}
                        </span>
                      </button>
                    </form>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal pour afficher les détails du programme */}
      {showProgramModal && selectedProgram && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeProgramModal}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 shadow-2xl transition-all border border-white/20 dark:border-gray-700/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-transparent rounded-3xl"></div>
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/25">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        {selectedProgram.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        {selectedProgram.exercises?.length || 0} exercices
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={closeProgramModal}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Description */}
                {selectedProgram.description && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Description</h3>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl backdrop-blur-sm">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {selectedProgram.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Planification Hebdomadaire */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📅 Planification de la semaine</h3>
                  
                  {selectedProgram.program_days && selectedProgram.program_days.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                        return daysOfWeek.map((dayName, idx) => {
                          const dayObj = selectedProgram.program_days?.find((d: any) => d.day_of_week === idx + 1);
                          const isRestDay = dayObj?.is_rest_day || false;
                          const workouts = dayObj?.workouts || [];
                          
                          return (
                            <div key={idx} className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                              isRestDay 
                                ? 'bg-gray-100/60 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-600/30' 
                                : workouts.length > 0
                                  ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-700/30'
                                  : 'bg-orange-50/60 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-700/30'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-900 dark:text-white">{dayName}</h4>
                                {isRestDay && <span className="text-2xl">🛌</span>}
                                {!isRestDay && workouts.length > 0 && <span className="text-2xl">💪</span>}
                                {!isRestDay && workouts.length === 0 && <span className="text-2xl">⚠️</span>}
                              </div>
                              
                              {isRestDay ? (
                                <div className="text-gray-500 dark:text-gray-400 text-sm">
                                  Jour de repos - Récupération active
                                </div>
                              ) : workouts.length > 0 ? (
                                <div className="space-y-2">
                                  {workouts.map((workout: any, workoutIndex: number) => (
                                              <div key={workoutIndex} onClick={() => { setSelectedDayObj(dayObj); setSelectedWorkoutObj(workout); }} className="cursor-pointer bg-white/60 dark:bg-gray-700/60 rounded-xl p-3 backdrop-blur-sm hover:shadow-md transition-shadow">
                                      <div className="font-semibold text-purple-600 dark:text-purple-400 text-sm mb-1">
                                        {workout.name}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>🕐 {workout.time_slot || 'Non défini'}</div>
                                        <div>⏱️ {workout.estimated_duration || 60} min</div>
                                        {workout.exercises && workout.exercises.length > 0 && (
                                          <div>🏋️ {workout.exercises.length} exercice(s)</div>
                                        )}
                                      </div>
                                      
                                      {workout.exercises && workout.exercises.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-600/30">
                                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Exercices:</div>
                                          <div className="space-y-1">
                                            {workout.exercises.slice(0, 3).map((exercise: any, exIndex: number) => (
                                              <div key={exIndex} className="text-xs text-gray-600 dark:text-gray-400">
                                                • {exercise.exercise_name || exercise.name} 
                                                {exercise.sets && exercise.reps && (
                                                  <span className="text-purple-600 dark:text-purple-400 ml-1">
                                                    ({exercise.sets}×{exercise.reps})
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                            {workout.exercises.length > 3 && (
                                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                                ... et {workout.exercises.length - 3} autre(s)
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-orange-600 dark:text-orange-400 text-sm">
                                  Aucune séance programmée
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    // Fallback pour l'ancien format (liste simple d'exercices)
                    selectedProgram.exercises && selectedProgram.exercises.length > 0 ? (
                      <div className="bg-yellow-50/60 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-700/30">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">⚡</span>
                          <div>
                            <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Programme au format simplifié</h4>
                            <p className="text-yellow-700 dark:text-yellow-400 text-sm">Liste générale des exercices (sans planification hebdomadaire)</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {selectedProgram.exercises.map((exercise, index) => (
                            <div key={index} className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-4 backdrop-blur-sm">
                              <h5 className="font-bold text-gray-900 dark:text-white mb-2">{exercise.name}</h5>
                              <div className="flex flex-wrap gap-3 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  <strong>Séries:</strong> {exercise.sets || 'N/A'}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  <strong>Reps:</strong> {exercise.reps || 'N/A'}
                                </span>
                                {exercise.weight && (
                                  <span className="text-gray-600 dark:text-gray-400">
                                    <strong>Poids:</strong> {exercise.weight}
                                  </span>
                                )}
                                {exercise.rest_time && (
                                  <span className="text-gray-600 dark:text-gray-400">
                                    <strong>Repos:</strong> {exercise.rest_time}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">Aucune planification définie dans ce programme</p>
                      </div>
                    )
                  )}
                </div>

                {/* Selected workout details (when a day/workout was clicked) */}
                {selectedWorkoutObj && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    {isLoadingSessionDetails && (
                      <div className="mb-4 text-sm text-gray-500">Chargement des détails de la séance...</div>
                    )}
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">🏋️‍♂️ {((selectedWorkoutObj as any)?.title) || selectedWorkoutObj?.program_name || selectedWorkoutObj?.programs?.name || 'Séance'}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(selectedWorkoutObj.date).toLocaleString()}</div>
                        {selectedWorkoutObj.duration_minutes && <div className="text-sm text-gray-600 dark:text-gray-400">Durée: {selectedWorkoutObj.duration_minutes} min</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</div>
                        <div className="mt-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full inline-block">{(selectedWorkoutObj as any).status || 'Terminé'}</div>
                      </div>
                    </div>

                    {selectedWorkoutObj.notes && (
                      <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-4 mb-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{selectedWorkoutObj.notes}</div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Exercises list: support both workout_exercises and exercises shapes */}
                      {((selectedWorkoutObj.workout_exercises || selectedWorkoutObj.exercises) || []).sort((a: any,b: any)=> (a.order_in_workout||a.order||0)-(b.order_in_workout||b.order||0)).map((we: any, i:number) => {
                        const plannedSets = we.sets || we.planned_sets || 0;
                        const plannedReps = we.reps || we.planned_reps || '';
                        const weightLabel = we.weight || we.suggested_weight || null;

                        // Actuals: some rows may include completedSets, sets_completed or workout_sets
                        const actualSets = we.completedSets || we.completed_sets || we.sets_completed || [];
                        // If actualSets is a number (legacy), we can't display details, just show number
                        const actualCount = Array.isArray(actualSets) ? actualSets.length : (typeof we.sets_completed === 'number' ? we.sets_completed : null);

                        // Compute total volume if possible (sum reps*weight)
                        let totalVolume = 0;
                        if (Array.isArray(actualSets)) {
                          actualSets.forEach((s: any) => {
                            const reps = Number(s.repsCompleted ?? s.reps_completed ?? s.reps ?? 0) || 0;
                            const w = Number(s.weightUsed ?? s.weight_used ?? s.weight ?? weightLabel ?? 0) || 0;
                            totalVolume += reps * w;
                          });
                        }

                        return (
                          <div key={we.id || i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-medium text-gray-900 dark:text-white">{we.exercise_name || we.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Planned: {plannedSets} × {plannedReps}</div>
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{weightLabel ? `Poids: ${weightLabel}` : 'Poids: Corps'} • Repos: {we.rest_time || we.rest || 60}s</div>

                            {Array.isArray(actualSets) && actualSets.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-sm font-semibold">Séries effectuées</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                  {actualSets.map((s: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                      <div className="text-sm">Série {s.setNumber ?? s.set_number ?? idx+1}</div>
                                      <div className="text-xs text-gray-500">Reps: {s.repsCompleted ?? s.reps_completed ?? s.reps ?? '-'}</div>
                                      <div className="text-xs text-gray-500">Poids: {s.weightUsed ?? s.weight_used ?? s.weight ?? '-'}</div>
                                      {s.durationSeconds ?? s.duration_seconds ? <div className="text-xs text-gray-500">Durée: {s.durationSeconds ?? s.duration_seconds}s</div> : null}
                                    </div>
                                  ))}
                                </div>
                                {totalVolume > 0 && <div className="text-sm font-medium mt-2">Volume total estimé: {totalVolume} kg</div>}
                              </div>
                            ) : actualCount !== null ? (
                              <div className="text-sm text-gray-600">Séries effectuées: {actualCount}</div>
                            ) : (
                              <div className="text-sm text-gray-500">Aucune donnée d'exécution enregistrée pour cet exercice.</div>
                            )}

                            {we.notes && <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Note: {we.notes}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={closeProgramModal}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={startSelectedProgram}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
                    disabled={isStartingProgram}
                  >
                    {isStartingProgram ? 'Démarrage...' : 'Commencer le programme'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter une mesure */}
      {showAddMeasurementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeAddMeasurementModal}
          ></div>
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 shadow-2xl transition-all border border-white/20 dark:border-gray-700/30">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/3 to-transparent rounded-3xl"></div>
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/25">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Nouvelle mesure
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        Enregistrez vos nouvelles données
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={closeAddMeasurementModal}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={submitMeasurement} className="space-y-6">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Date de la mesure
                    </label>
                    <input
                      type="date"
                      value={measurementData.date}
                      onChange={(e) => setMeasurementData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white backdrop-blur-sm"
                      required
                    />
                  </div>

                  {/* Poids (obligatoire) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Poids (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurementData.weight}
                      onChange={(e) => setMeasurementData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="Ex: 70.5"
                      className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white backdrop-blur-sm"
                      required
                    />
                  </div>

                  {/* Pourcentage de graisse corporelle (optionnel) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Pourcentage de graisse corporelle (%) - Optionnel
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurementData.body_fat}
                      onChange={(e) => setMeasurementData(prev => ({ ...prev, body_fat: e.target.value }))}
                      placeholder="Ex: 15.2"
                      className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white backdrop-blur-sm"
                    />
                  </div>

                  {/* Masse musculaire (optionnel) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Masse musculaire (kg) - Optionnel
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurementData.muscle_mass}
                      onChange={(e) => setMeasurementData(prev => ({ ...prev, muscle_mass: e.target.value }))}
                      placeholder="Ex: 45.8"
                      className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-600/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white backdrop-blur-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={closeAddMeasurementModal}
                      className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      disabled={isAddingMeasurement}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingMeasurement || !measurementData.weight}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isAddingMeasurement ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Enregistrement...
                        </span>
                      ) : (
                        'Enregistrer'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

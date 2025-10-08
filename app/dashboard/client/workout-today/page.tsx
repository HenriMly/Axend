'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dataService } from '@/lib/data';
import { useRequireClient } from '@/lib/auth-context';

interface TodayWorkout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  estimatedDuration?: number;
  programName?: string;
}

interface WorkoutExercise {
  id: string;
  name: string;
  targetReps?: string;
  targetSets?: number;
  targetWeight?: string;
  instructions?: string;
  // Données saisies par l'utilisateur
  actualSets?: number;
  actualReps?: string;
  actualWeight?: string;
  completed?: boolean;
}

interface WorkoutSession {
  id: string;
  date: string;
  workoutName: string;
  duration?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  nextGoals?: string;
  completed: boolean;
}

export default function WorkoutToday() {
  const { user, userProfile } = useRequireClient();
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletedForm, setShowCompletedForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadTodayWorkout = async () => {
      if (!userProfile || userProfile.role !== 'client') return;
      
      setIsLoading(true);
      try {
        // Récupérer la séance du jour
        const programData = await dataService.getTodayWorkout(userProfile.id);
        
        // Extraire les séances du jour actuel
        const today = new Date().getDay(); // 0 = dimanche, 1 = lundi, etc.
        const dayOfWeek = today === 0 ? 7 : today; // Convertir dimanche (0) en 7

        if (programData && (programData as any).program_days) {
          const todayProgramDay = (programData as any).program_days.find((day: any) => day.day_of_week === dayOfWeek);
          
          if (todayProgramDay && !todayProgramDay.is_rest_day && todayProgramDay.workouts && todayProgramDay.workouts.length > 0) {
            // Construire la séance du jour à partir du premier workout
            const firstWorkout = todayProgramDay.workouts[0];
            const exercises = firstWorkout.workout_exercises?.map((ex: any) => ({
              id: ex.id,
              name: ex.exercise_name,
              targetSets: ex.sets,
              targetReps: ex.reps,
              targetWeight: ex.weight,
              instructions: ex.notes,
              actualSets: 0,
              actualReps: '',
              actualWeight: '',
              completed: false
            })) || [];

            setTodayWorkout({
              id: firstWorkout.id,
              name: firstWorkout.name,
              exercises,
              estimatedDuration: firstWorkout.estimated_duration,
              programName: (programData as any).name
            });
          }
        }

        // Charger l'historique des séances (stocké temporairement en localStorage)
        const savedHistory = localStorage.getItem(`workout_history_${userProfile.id}`);
        if (savedHistory) {
          setWorkoutHistory(JSON.parse(savedHistory));
        }

        // Vérifier si une séance est déjà en cours aujourd'hui
        const todayStr = new Date().toDateString();
        const todaySession = JSON.parse(savedHistory || '[]').find((session: WorkoutSession) => 
          new Date(session.date).toDateString() === todayStr
        );
        
        if (todaySession) {
          setCurrentSession(todaySession);
        }
      } catch (error) {
        console.error('Error loading today workout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayWorkout();
  }, [userProfile]);

  const startWorkout = () => {
    if (!todayWorkout) return;

    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      workoutName: todayWorkout.name,
      exercises: todayWorkout.exercises.map(ex => ({
        ...ex,
        actualSets: 0,
        actualReps: '',
        actualWeight: '',
        completed: false
      })),
      completed: false
    };

    setCurrentSession(newSession);
  };

  const updateExercise = (exerciseId: string, field: keyof WorkoutExercise, value: any) => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      exercises: currentSession.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    };

    setCurrentSession(updatedSession);
  };

  const completeWorkout = () => {
    if (!currentSession) return;
    setShowCompletedForm(true);
  };

  const saveWorkoutSession = (duration: number, notes: string, nextGoals: string) => {
    if (!currentSession) return;

    const completedSession: WorkoutSession = {
      ...currentSession,
      duration,
      notes,
      nextGoals,
      completed: true
    };

    // Sauvegarder dans l'historique
    const updatedHistory = [completedSession, ...workoutHistory];
    setWorkoutHistory(updatedHistory);
    localStorage.setItem(`workout_history_${userProfile?.id}`, JSON.stringify(updatedHistory));

    // Reset
    setCurrentSession(null);
    setShowCompletedForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!todayWorkout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Pas de séance aujourd'hui
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Votre coach n'a pas programmé d'entraînement pour aujourd'hui. Profitez de votre jour de repos !
            </p>
            <button 
              onClick={() => router.push('/dashboard/client')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🏋️‍♂️ Séance du jour
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {!currentSession ? (
          /* Séance à démarrer */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {todayWorkout.name}
              </h2>
              {todayWorkout.programName && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Programme: {todayWorkout.programName}
                </p>
              )}
              {todayWorkout.estimatedDuration && (
                <p className="text-gray-600 dark:text-gray-400">
                  Durée estimée: {todayWorkout.estimatedDuration} min
                </p>
              )}
            </div>
            
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Exercices programmés ({todayWorkout.exercises.length})
              </h3>
              <div className="space-y-3 mb-6">
                {todayWorkout.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {exercise.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.targetSets && `${exercise.targetSets} séries`}
                        {exercise.targetReps && ` × ${exercise.targetReps}`}
                        {exercise.targetWeight && ` - ${exercise.targetWeight}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={startWorkout}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-lg"
              >
                🚀 Démarrer l'entraînement
              </button>
            </div>
          </div>
        ) : (
          /* Séance en cours */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    💪 {currentSession.workoutName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Entraînement en cours...
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentSession.exercises.filter(ex => ex.completed).length}/{currentSession.exercises.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">exercices</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {currentSession.exercises.map((exercise, index) => (
                <ExerciseTracker 
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onUpdate={updateExercise}
                />
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={completeWorkout}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Terminer l'entraînement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historique des séances */}
        {workoutHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📊 Historique des séances
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {workoutHistory.slice(0, 5).map((session) => (
                <WorkoutHistoryCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de fin de séance */}
      {showCompletedForm && (
        <WorkoutCompletionModal 
          onSave={saveWorkoutSession}
          onCancel={() => setShowCompletedForm(false)}
        />
      )}
    </div>
  );
}

// Composant pour tracker un exercice
interface ExerciseTrackerProps {
  exercise: WorkoutExercise;
  index: number;
  onUpdate: (exerciseId: string, field: keyof WorkoutExercise, value: any) => void;
}

function ExerciseTracker({ exercise, index, onUpdate }: ExerciseTrackerProps) {
  return (
    <div className={`p-4 border rounded-lg transition-colors ${
      exercise.completed 
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10' 
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
            exercise.completed 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {exercise.completed ? '✓' : index + 1}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {exercise.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Objectif: {exercise.targetSets} × {exercise.targetReps}
              {exercise.targetWeight && ` - ${exercise.targetWeight}`}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onUpdate(exercise.id, 'completed', !exercise.completed)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            exercise.completed 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300'
          }`}
        >
          {exercise.completed ? 'Fait ✓' : 'Marquer comme fait'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Séries réalisées
          </label>
          <input 
            type="number"
            value={exercise.actualSets || ''}
            onChange={(e) => onUpdate(exercise.id, 'actualSets', parseInt(e.target.value) || 0)}
            placeholder={exercise.targetSets?.toString() || '0'}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Répétitions
          </label>
          <input 
            type="text"
            value={exercise.actualReps || ''}
            onChange={(e) => onUpdate(exercise.id, 'actualReps', e.target.value)}
            placeholder={exercise.targetReps || '0'}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Poids utilisé
          </label>
          <input 
            type="text"
            value={exercise.actualWeight || ''}
            onChange={(e) => onUpdate(exercise.id, 'actualWeight', e.target.value)}
            placeholder={exercise.targetWeight || '0kg'}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}

// Composant pour l'historique des séances
interface WorkoutHistoryCardProps {
  session: WorkoutSession;
}

function WorkoutHistoryCard({ session }: WorkoutHistoryCardProps) {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {session.workoutName}
        </h4>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(session.date).toLocaleDateString('fr-FR')}
        </span>
      </div>
      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
        {session.duration && (
          <span>⏱️ {session.duration} min</span>
        )}
        <span>💪 {session.exercises.filter(ex => ex.completed).length}/{session.exercises.length} exercices</span>
      </div>
      {session.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
          💬 {session.notes}
        </p>
      )}
      {session.nextGoals && (
        <p className="text-sm text-blue-600 dark:text-blue-400">
          🎯 Prochains objectifs: {session.nextGoals}
        </p>
      )}
    </div>
  );
}

// Modal de fin de séance
interface WorkoutCompletionModalProps {
  onSave: (duration: number, notes: string, nextGoals: string) => void;
  onCancel: () => void;
}

function WorkoutCompletionModal({ onSave, onCancel }: WorkoutCompletionModalProps) {
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [nextGoals, setNextGoals] = useState('');

  const handleSave = () => {
    onSave(parseInt(duration) || 0, notes, nextGoals);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🎉 Séance terminée !
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ajoutez vos notes et objectifs
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durée totale (minutes)
            </label>
            <input 
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 45"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes de la séance
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passée la séance ? Difficultés rencontrées..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objectifs pour la prochaine séance
            </label>
            <textarea 
              value={nextGoals}
              onChange={(e) => setNextGoals(e.target.value)}
              placeholder="Que voulez-vous améliorer la prochaine fois ?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Enregistrer la séance
          </button>
        </div>
      </div>
    </div>
  );
}
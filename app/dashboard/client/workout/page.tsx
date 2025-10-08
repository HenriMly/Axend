'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest: string;
  instructions?: string;
}

interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
  restCompleted: boolean;
}

interface WorkoutExercise extends Exercise {
  completedSets: WorkoutSet[];
}

export default function ActiveWorkout() {
  const [workout, setWorkout] = useState<WorkoutExercise[] | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [programData, setProgramData] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Charger les données de la séance depuis les paramètres URL
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        console.log('[ActiveWorkout] Program data loaded:', parsedData);
        setProgramData(parsedData);
        
        // Convertir les exercices du programme en format WorkoutExercise
        const programWorkout = parsedData.program_days[0]?.workouts[0];
        if (programWorkout && programWorkout.workout_exercises) {
          const workoutExercises: WorkoutExercise[] = programWorkout.workout_exercises
            .sort((a: any, b: any) => a.order_in_workout - b.order_in_workout)
            .map((ex: any) => ({
              id: ex.exercise_id,
              name: ex.exercise_name,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight || '',
              rest: `${ex.rest_time || 60}`,
              instructions: ex.notes || '',
              completedSets: Array(ex.sets).fill(null).map(() => ({
                reps: 0,
                weight: 0,
                completed: false,
                restCompleted: false
              }))
            }));
          
          console.log('[ActiveWorkout] Workout exercises prepared:', workoutExercises);
          setWorkout(workoutExercises);
          setWorkoutStartTime(new Date());
          return;
        }
      } catch (error) {
        console.error('[ActiveWorkout] Error parsing program data:', error);
      }
    }

    // Fallback: Simulation d'un entraînement (ancien système)
    const mockWorkout: WorkoutExercise[] = [
      {
        id: '1',
        name: 'Squat',
        sets: 3,
        reps: '8-12',
        weight: '60-70kg',
        rest: '90',
        instructions: 'Descendez jusqu\'à ce que vos cuisses soient parallèles au sol',
        completedSets: [
          { reps: 0, weight: 0, completed: false, restCompleted: false },
          { reps: 0, weight: 0, completed: false, restCompleted: false },
          { reps: 0, weight: 0, completed: false, restCompleted: false }
        ]
      },
      {
        id: '2',
        name: 'Développé couché',
        sets: 3,
        reps: '8-10',
        weight: '50-60kg',
        rest: '120',
        instructions: 'Contrôlez la descente, poussez explosif',
        completedSets: [
          { reps: 0, weight: 0, completed: false, restCompleted: false },
          { reps: 0, weight: 0, completed: false, restCompleted: false },
          { reps: 0, weight: 0, completed: false, restCompleted: false }
        ]
      },
      {
        id: '3',
        name: 'Rowing barre',
        sets: 3,
        reps: '10-12',
        weight: '40-50kg',
        rest: '90',
        instructions: 'Tirez vers le bas de la poitrine, serrez les omoplates',
        completedSets: [
          { reps: 0, weight: 0, completed: false, restCompleted: false },
          { reps: 0, weight: 0, completed: false, restCompleted: false },
          { reps: 0, weight: 0, completed: false, restCompleted: false }
        ]
      }
    ];
    
    setWorkout(mockWorkout);
    setWorkoutStartTime(new Date());
  }, []);

  // Timer de repos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const completeSet = (reps: number, weight: number) => {
    if (!workout) return;

    const newWorkout = [...workout];
    newWorkout[currentExerciseIndex].completedSets[currentSetIndex] = {
      reps,
      weight,
      completed: true,
      restCompleted: false
    };
    setWorkout(newWorkout);

    // Démarrer le repos si ce n'est pas la dernière série
    const isLastSet = currentSetIndex === workout[currentExerciseIndex].sets - 1;
    const isLastExercise = currentExerciseIndex === workout.length - 1;

    if (!isLastSet || !isLastExercise) {
      const restTime = parseInt(workout[currentExerciseIndex].rest);
      setRestTimer(restTime);
      setIsResting(true);
    }

    // Passer à la série suivante ou à l'exercice suivant
    if (currentSetIndex < workout[currentExerciseIndex].sets - 1) {
      setCurrentSetIndex(prev => prev + 1);
    } else if (currentExerciseIndex < workout.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const finishWorkout = async () => {
    if (!workout || !workoutStartTime) return;

    const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
    
    // Ici vous pourriez sauvegarder l'entraînement dans Supabase
    console.log('Entraînement terminé:', {
      duration,
      exercises: workout,
      notes: workoutNotes
    });

    router.push('/dashboard/client?tab=workouts');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkoutDuration = () => {
    if (!workoutStartTime) return '0:00';
    const duration = Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000);
    return formatTime(duration);
  };

  const getTotalProgress = () => {
    if (!workout) return 0;
    const totalSets = workout.reduce((acc, ex) => acc + ex.sets, 0);
    const completedSets = workout.reduce((acc, ex) => 
      acc + ex.completedSets.filter(set => set.completed).length, 0
    );
    return Math.round((completedSets / totalSets) * 100);
  };

  const isWorkoutComplete = () => {
    if (!workout) return false;
    return workout.every(ex => ex.completedSets.every(set => set.completed));
  };

  if (!workout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentExercise = workout[currentExerciseIndex];
  const currentSet = currentExercise?.completedSets[currentSetIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/client" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Arrêter</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Entraînement en cours</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Durée</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{getWorkoutDuration()}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Progression</div>
              <div className="text-lg font-bold text-blue-600">{getTotalProgress()}%</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progression globale</span>
            <span>{getTotalProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTotalProgress()}%` }}
            ></div>
          </div>
        </div>

        {isResting ? (
          /* Rest Screen */
          <div className="text-center py-16">
            <div className="mb-8">
              <div className="text-6xl font-bold text-blue-600 mb-4">{formatTime(restTimer)}</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Temps de repos</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Prochaine série : {currentExercise.name} - Série {currentSetIndex + 1}
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={skipRest}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Passer le repos
              </button>
            </div>
          </div>
        ) : (
          /* Exercise Screen */
          <div className="space-y-8">
            {/* Current Exercise */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentExercise.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Série {currentSetIndex + 1} sur {currentExercise.sets}
                </p>
              </div>

              {currentExercise.instructions && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Instructions</h3>
                  <p className="text-blue-800 dark:text-blue-200">{currentExercise.instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Répétitions</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{currentExercise.reps}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Poids suggéré</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{currentExercise.weight || 'Au poids du corps'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Repos</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{currentExercise.rest}s</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Série</div>
                  <div className="text-lg font-bold text-blue-600">{currentSetIndex + 1}/{currentExercise.sets}</div>
                </div>
              </div>

              {/* Set Input */}
              <SetInput 
                onComplete={completeSet}
                suggestedReps={currentExercise.reps}
                suggestedWeight={currentExercise.weight}
                isLastSet={currentSetIndex === currentExercise.sets - 1 && currentExerciseIndex === workout.length - 1}
              />
            </div>

            {/* Exercise Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aperçu des exercices</h3>
              <div className="space-y-3">
                {workout.map((exercise, index) => (
                  <div key={exercise.id} className={`p-3 rounded-lg border ${
                    index === currentExerciseIndex 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${
                        index === currentExerciseIndex 
                          ? 'text-blue-900 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {exercise.name}
                      </span>
                      <div className="flex space-x-1">
                        {exercise.completedSets.map((set, setIndex) => (
                          <div key={setIndex} className={`w-3 h-3 rounded-full ${
                            set.completed 
                              ? 'bg-green-500' 
                              : index === currentExerciseIndex && setIndex === currentSetIndex
                              ? 'bg-blue-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workout Complete */}
            {isWorkoutComplete() && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700 p-6">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-4">
                  🎉 Entraînement terminé !
                </h3>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder="Ajoutez des notes sur votre séance..."
                  className="w-full p-3 border border-green-200 dark:border-green-700 rounded-lg mb-4 dark:bg-gray-800 dark:text-white"
                  rows={3}
                />
                <button
                  onClick={finishWorkout}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Terminer l'entraînement
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour saisir les données de la série
function SetInput({ 
  onComplete, 
  suggestedReps, 
  suggestedWeight,
  isLastSet 
}: { 
  onComplete: (reps: number, weight: number) => void;
  suggestedReps: string;
  suggestedWeight?: string;
  isLastSet: boolean;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleComplete = () => {
    const repsNum = parseInt(reps) || 0;
    const weightNum = parseFloat(weight) || 0;
    onComplete(repsNum, weightNum);
    setReps('');
    setWeight('');
  };

  const getSuggestedWeightNumber = () => {
    if (!suggestedWeight) return '';
    const match = suggestedWeight.match(/(\d+)/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Répétitions réalisées
          </label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder={suggestedReps}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-bold dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Poids utilisé (kg)
          </label>
          <input
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={getSuggestedWeightNumber()}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-bold dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      <button
        onClick={handleComplete}
        disabled={!reps}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
      >
        {isLastSet ? 'Terminer la série' : 'Série terminée'}
      </button>
    </div>
  );
}
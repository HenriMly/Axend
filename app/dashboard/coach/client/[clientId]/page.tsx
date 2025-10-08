'use client';

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { dataService } from '@/lib/data';
import { useRequireCoach } from '@/lib/auth-context';

interface Client {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  lastWorkout: string | null;
  programs: string[];
  currentWeight: number;
  targetWeight: number;
  age: number;
  height: number;
  workouts: WorkoutSession[];
  measurements: Measurement[];
}

interface WorkoutSession {
  id: string;
  date: string;
  program: string;
  duration: number;
  exercises: Exercise[];
  notes?: string;
}

interface Exercise {
  name: string;
  sets: Set[];
}

interface Set {
  reps: number;
  weight: number;
  rest?: number;
}

interface Measurement {
  date: string;
  weight: number;
  bodyFat?: number;
  muscle?: number;
}

export default function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const { user, userProfile } = useRequireCoach();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [addingMeasurement, setAddingMeasurement] = useState(false);
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  
  // Unwrap the params promise using React.use()
  const { clientId } = use(params);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        // fetch client detail from DB
        const data = await dataService.getClientDetail(clientId);
        if (!mounted) return;

        // Map DB shape to our UI-friendly shape
        const mapped: Client = {
          id: data.id,
          name: data.name,
          email: data.email,
          joinedDate: data.created_at || data.joined_date || new Date().toISOString(),
          lastWorkout: null, // À corriger plus tard quand la table workouts sera créée
          programs: (data.programs || []).map((p: any) => p.name),
          currentWeight: data.current_weight || 0,
          targetWeight: data.target_weight || 0,
          age: data.age || 0,
          height: data.height || 0,
          workouts: [], // À corriger plus tard quand la table workouts sera créée
          measurements: (data.measurements || []).map((m: any) => ({ date: m.date, weight: m.weight, bodyFat: m.body_fat, muscle: m.muscle_mass }))
        };

        setClient(mapped);
      } catch (err) {
        console.error('Failed to load client detail', err);
        // if not found or not authorized, navigate back
        router.push('/dashboard/coach');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Ensure the current user is coach
    if (!userProfile || userProfile.role !== 'coach') {
      router.push('/dashboard/client');
      return;
    }

    load();

    return () => { mounted = false };
  }, [clientId, router, userProfile]);

  // Traiter les paramètres URL pour les actions rapides
  useEffect(() => {
    if (!client || isLoading) return;

    const tab = searchParams.get('tab');
    const action = searchParams.get('action');

    if (tab) {
      setActiveTab(tab);
    }

    if (action === 'create' && tab === 'programs') {
      setCreatingProgram(true);
    } else if (action === 'measure' && tab === 'progress') {
      setAddingMeasurement(true);
    }

    // Nettoyer l'URL après traitement
    if (tab || action) {
      router.replace(`/dashboard/coach/client/${clientId}`, { scroll: false });
    }
  }, [client, isLoading, searchParams, clientId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Client non trouvé</h1>
          <Link href="/dashboard/coach" className="text-blue-600 hover:text-blue-700">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/coach" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Retour</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Client Info Banner */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{client.currentWeight}kg</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Poids actuel</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{client.targetWeight}kg</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Objectif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{client.age} ans</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Âge</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{client.height}cm</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Taille</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
              { id: 'workouts', name: 'Entraînements', icon: '💪' },
              { id: 'progress', name: 'Évolution', icon: '📈' },
              { id: 'programs', name: 'Programmes', icon: '📋' },
              { id: 'goals', name: 'Objectifs', icon: '🎯' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Derniers entraînements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Derniers entraînements</h3>
              </div>
              <div className="p-6 space-y-4">
                {client.workouts.slice(0, 3).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{workout.program}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(workout.date).toLocaleDateString('fr-FR')} • {workout.duration}min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {workout.exercises.length} exercices
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Programmes actifs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Programmes actifs</h3>
              </div>
              <div className="p-6 space-y-4">
                {client.programs.map((program, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{program}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">En cours</div>
                    </div>
                    <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md">
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-6">
            {client.workouts.map((workout) => (
              <div key={workout.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{workout.program}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(workout.date).toLocaleDateString('fr-FR')} • {workout.duration}min
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">{exercise.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              {set.weight > 0 ? (
                                <span className="text-gray-900 dark:text-white">
                                  {set.reps} reps × {set.weight}kg
                                </span>
                              ) : (
                                <span className="text-gray-900 dark:text-white">
                                  {workout.duration}min
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {workout.notes && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Notes:</strong> {workout.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-6">
            {/* Séances programmées cette semaine */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📅 Séances programmées cette semaine</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Planning d'entraînement du client</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => {
                    const dayNumber = index + 1;
                    const isToday = new Date().getDay() === (index === 6 ? 0 : index + 1);
                    
                    return (
                      <div key={day} className={`p-4 rounded-lg border-2 ${
                        isToday 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-medium ${
                            isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {day} {isToday && '(Aujourd\'hui)'}
                          </h4>
                          <div className={`w-3 h-3 rounded-full ${
                            isToday ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}></div>
                        </div>
                        
                        {/* Afficher les séances des programmes créés */}
                        {dayNumber === 7 ? (
                          <div className="text-center py-4">
                            <div className="text-2xl mb-2">🧘‍♂️</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Jour de repos</div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Créez un programme pour voir les séances planifiées
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Historique des entraînements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 Historique des entraînements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Séances réalisées par le client</p>
                </div>
                <button 
                  onClick={() => setAddingWorkout(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  + Ajouter séance
                </button>
              </div>
              <div className="p-6">
                {addingWorkout ? (
                  <WorkoutForm 
                    clientId={clientId}
                    onCancel={() => setAddingWorkout(false)}
                    onSaved={(workout) => {
                      setWorkoutSessions([...workoutSessions, workout]);
                      setAddingWorkout(false);
                    }}
                  />
                ) : workoutSessions.length > 0 ? (
                  <div className="space-y-4">
                    {workoutSessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            session.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {session.program}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(session.date).toLocaleDateString('fr-FR')} • {session.exercises} exercices
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {session.status === 'completed' ? (
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              ✓ {session.duration} min
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">
                              ✗ Non effectuée
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🏋️‍♂️</div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune séance enregistrée</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Commencez par ajouter les séances d'entraînement réalisées par votre client
                    </p>
                    <button 
                      onClick={() => setAddingWorkout(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Ajouter la première séance
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques d'entraînement */}
            {workoutSessions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round((workoutSessions.filter(s => s.status === 'completed').length / workoutSessions.length) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Assiduité</div>
                    </div>
                    <div className="text-green-500 text-3xl">📊</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {workoutSessions.filter(s => s.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Séances réalisées</div>
                    </div>
                    <div className="text-blue-500 text-3xl">💪</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {workoutSessions.filter(s => s.status === 'completed').length > 0 
                          ? Math.round(workoutSessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0) / workoutSessions.filter(s => s.status === 'completed').length)
                          : 0}min
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Durée moyenne</div>
                    </div>
                    <div className="text-purple-500 text-3xl">⏱️</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Évolution du poids</h3>
                <button
                  onClick={() => setAddingMeasurement(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Ajouter mesure
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {client.measurements.map((measurement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {new Date(measurement.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Poids: {measurement.weight}kg
                          {measurement.bodyFat && ` • Masse grasse: ${measurement.bodyFat}%`}
                          {measurement.muscle && ` • Masse musculaire: ${measurement.muscle}kg`}
                        </div>
                      </div>
                      <div className="text-right">
                        {index > 0 && (
                          <div className={`text-sm font-medium ${
                            measurement.weight < client.measurements[index - 1].weight
                              ? 'text-green-600 dark:text-green-400'
                              : measurement.weight > client.measurements[index - 1].weight
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {measurement.weight < client.measurements[index - 1].weight ? '↓' : 
                             measurement.weight > client.measurements[index - 1].weight ? '↑' : '→'}
                            {Math.abs(measurement.weight - client.measurements[index - 1].weight).toFixed(1)}kg
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            {client.programs.map((program, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{program}</h3>
                    <div className="flex space-x-2">
                      <button onClick={async () => {
                        try {
                          // Récupérer les programmes complets avec la structure avancée
                          console.log('Loading advanced programs for client:', client.id);
                          const programs = await dataService.getClientProgramsAdvanced(client.id);
                          console.log('Advanced programs loaded:', programs);
                          
                          const fullProgram = programs.find((p: any) => p.name === program);
                          if (fullProgram) {
                            console.log('Editing advanced program:', fullProgram);
                            setEditingProgram(fullProgram);
                          } else {
                            // Fallback à l'ancien système
                            console.log('Program not found in advanced system, trying old system...');
                            const oldPrograms = await dataService.getClientPrograms(client.id);
                            const oldProgram = oldPrograms.find((p: any) => p.name === program);
                            if (oldProgram) {
                              console.log('Found in old system:', oldProgram);
                              setEditingProgram(oldProgram);
                            } else {
                              setEditingProgram({ name: program });
                            }
                          }
                        } catch (e) {
                          console.error('Failed to load program for editing', e);
                          // Fallback en cas d'erreur
                          setEditingProgram({ name: program });
                        }
                      }} className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md">
                        Modifier
                      </button>
                      <button onClick={async () => {
                        if (!confirm('Supprimer ce programme ?')) return;
                        try {
                          // find program id by name via dataService.getClientPrograms
                          const programs = await dataService.getClientPrograms(client.id);
                          const toDelete = programs.find((p: any) => p.name === program);
                          if (toDelete) {
                            await dataService.deleteProgram(toDelete.id);
                            // reload client data
                            const re = await dataService.getClientDetail(client.id);
                            setClient(prev => prev ? { ...prev, programs: (re.programs || []).map((p:any)=>p.name) } : prev);
                          }
                        } catch (e) {
                          console.error('Failed to delete program', e);
                          alert('Impossible de supprimer le programme');
                        }
                      }} className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Programme personnalisé de {program.toLowerCase()} adapté aux objectifs du client.
                  </p>
                  <div className="mt-4 flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>🕒 3-4 séances/semaine</span>
                    <span>⏱️ 45-60 minutes</span>
                    <span>🎯 Niveau intermédiaire</span>
                  </div>
                </div>
              </div>
            ))}
            <div>
              <button onClick={() => setCreatingProgram(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Créer un programme</button>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Objectifs actuels</h3>
                  <button 
                    onClick={() => setCreatingGoal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Définir objectif
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">⚖️</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Objectif de poids</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Poids actuel</span>
                        <span className="font-medium text-gray-900 dark:text-white">{client.currentWeight}kg</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Objectif</span>
                        <span className="font-medium text-gray-900 dark:text-white">{client.targetWeight}kg</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.abs((client.currentWeight - client.targetWeight) / client.targetWeight) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">💪</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Objectif fitness</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Séances/semaine</span>
                        <span className="font-medium text-gray-900 dark:text-white">3-4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Durée moyenne</span>
                        <span className="font-medium text-gray-900 dark:text-white">60 min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cette semaine</span>
                        <span className="font-medium text-green-600 dark:text-green-400">2/3 ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Notes du coach</h5>
                  <textarea
                    placeholder="Ajoutez des notes personnalisées sur les objectifs de ce client..."
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Sauvegarder les notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Program create/edit modal */}
      {(creatingProgram || editingProgram) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingProgram ? 'Modifier le programme' : 'Créer un programme'}</h3>
            <ProgramForm
              initial={editingProgram}
              clientId={client!.id}
              coachId={userProfile!.id}
              onCancel={() => { setEditingProgram(null); setCreatingProgram(false); }}
              onSaved={async () => {
                console.log('[onSaved] Starting...');
                // reload client
                try {
                  console.log('[onSaved] Reloading client detail...');
                  const re = await dataService.getClientDetail(client!.id);
                  console.log('[onSaved] Client reloaded:', re);
                  setClient(prev => prev ? { ...prev, programs: (re.programs || []).map((p:any)=>p.name) } : prev);
                  console.log('[onSaved] Client state updated');
                } catch (e) {
                  console.error('[onSaved] Failed to reload client after program save', e);
                }
                console.log('[onSaved] Closing modals...');
                setEditingProgram(null);
                setCreatingProgram(false);
                console.log('[onSaved] Done!');
              }}
            />
          </div>
        </div>
      )}

      {/* Measurement add modal */}
      {addingMeasurement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ajouter une mesure</h3>
            <MeasurementForm
              clientId={client!.id}
              onCancel={() => setAddingMeasurement(false)}
              onSaved={async () => {
                // reload client
                try {
                  const re = await dataService.getClientDetail(client!.id);
                  const mappedMeasurements = (re.measurements || []).map((m: any) => ({ 
                    date: m.date, 
                    weight: m.weight, 
                    bodyFat: m.body_fat, 
                    muscle: m.muscle_mass 
                  }));
                  setClient(prev => prev ? { ...prev, measurements: mappedMeasurements } : prev);
                } catch (e) {
                  console.error('Failed to reload client after measurement save', e);
                }
                setAddingMeasurement(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour ajouter une mesure corporelle
interface MeasurementFormProps {
  clientId: string;
  onCancel: () => void;
  onSaved: () => void;
}

function MeasurementForm({ clientId, onCancel, onSaved }: MeasurementFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscleMass] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!weight.trim()) {
      alert('Le poids est requis');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Veuillez entrer un poids valide');
      return;
    }

    setIsSaving(true);
    try {
      const measurementData = {
        client_id: clientId, // addMeasurement attend client_id dans l'objet
        date,
        weight: weightNum,
        body_fat: bodyFat ? parseFloat(bodyFat) : undefined,
        muscle_mass: muscle ? parseFloat(muscle) : undefined
      };

      // Debug: affichons les données qu'on envoie
      console.log('Sending measurement data:', measurementData);
      
      // Essayons directement avec Supabase pour contourner le problème
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from('measurements')
        .upsert(measurementData, { onConflict: 'client_id,date' })
        .select()
        .single();
        
      if (error) {
        console.error('Direct Supabase error:', error);
        throw error;
      }
      
      console.log('Direct Supabase success:', data);
      
      await onSaved();
    } catch (e: any) {
      console.error('Measurement save failed');
      console.error('Error details:', e);
      console.error('Error message:', e?.message);
      console.error('Error code:', e?.code);
      alert(`Erreur lors de la sauvegarde de la mesure: ${e?.message || 'Erreur inconnue'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date *
        </label>
        <input 
          type="date"
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Poids (kg) *
        </label>
        <input 
          type="number"
          step="0.1"
          value={weight} 
          onChange={(e) => setWeight(e.target.value)} 
          placeholder="Ex: 70.5"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Masse grasse (%)
          </label>
          <input 
            type="number"
            step="0.1"
            value={bodyFat} 
            onChange={(e) => setBodyFat(e.target.value)} 
            placeholder="Ex: 15.2"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Masse musculaire (kg)
          </label>
          <input 
            type="number"
            step="0.1"
            value={muscle} 
            onChange={(e) => setMuscleMass(e.target.value)} 
            placeholder="Ex: 35.8"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button 
          onClick={onCancel} 
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isSaving ? 'Enregistrement...' : 'Ajouter mesure'}
        </button>
      </div>
    </div>
  );
}

// Composant pour créer/éditer un programme
interface ProgramFormProps {
  initial?: any;
  clientId: string;
  coachId: string;
  onCancel: () => void;
  onSaved: () => void;
}

// Interface pour la structure de programme avancée
interface ProgramDay {
  id?: string;
  day_of_week: number;
  day_name: string;
  is_rest_day: boolean;
  workouts: Workout[];
}

interface Workout {
  id?: string;
  name: string;
  time_slot: string;
  estimated_duration: number;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id?: string;
  exercise_id: string;
  exercise_name: string;
  exercise_category: string;
  exercise_equipment: string;
  order_in_workout: number;
  sets: number;
  reps: string;
  weight: string;
  rest_time: number;
  notes: string;
}

function ProgramForm({ initial, clientId, coachId, onCancel, onSaved }: ProgramFormProps) {
  const [step, setStep] = useState(1); // 1: Info de base, 2: Planification des jours, 3: Exercices
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(() => {
    // Nettoyer la description pour enlever la planification auto-générée
    let desc = initial?.description || '';
    if (desc.includes('\n\n📅 Planification:')) {
      desc = desc.split('\n\n📅 Planification:')[0];
    }
    return desc;
  })
  
  // Convertir l'ancien format vers le nouveau
  const [weeks, setWeeks] = useState(() => {
    if (initial?.weeks) return initial.weeks;
    // Essayer d'extraire depuis frequency (ex: "8 semaines")
    if (initial?.frequency) {
      const match = initial.frequency.match(/(\d+)\s*semaines?/);
      if (match) return parseInt(match[1]);
    }
    return 8;
  })
  
  const [goal, setGoal] = useState(() => {
    if (initial?.goal) return initial.goal;
    // Utiliser duration comme goal pour l'ancien format
    return initial?.duration || '';
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Structure des jours de la semaine
  const [programDays, setProgramDays] = useState<ProgramDay[]>(() => {
    const daysOfWeek = [
      { id: 1, name: 'Lundi' },
      { id: 2, name: 'Mardi' },
      { id: 3, name: 'Mercredi' },
      { id: 4, name: 'Jeudi' },
      { id: 5, name: 'Vendredi' },
      { id: 6, name: 'Samedi' },
      { id: 7, name: 'Dimanche' }
    ];
    
    // Si on modifie un programme existant avec des program_days
    if (initial?.program_days && initial.program_days.length > 0) {
      console.log('[ProgramForm] Loading existing program days:', initial.program_days);
      return initial.program_days.map((pd: any) => ({
        id: pd.id,
        day_of_week: pd.day_of_week,
        day_name: pd.day_name,
        is_rest_day: pd.is_rest_day,
        workouts: (pd.workouts || []).map((w: any) => ({
          id: w.id,
          name: w.name,
          time_slot: w.time_slot || 'matin',
          estimated_duration: w.estimated_duration || 60,
          exercises: (w.workout_exercises || []).map((we: any) => ({
            id: we.id,
            exercise_id: we.exercise_id,
            exercise_name: we.exercise_name,
            exercise_category: we.exercise_category,
            exercise_equipment: we.exercise_equipment,
            order_in_workout: we.order_in_workout,
            sets: we.sets,
            reps: we.reps,
            weight: we.weight,
            rest_time: we.rest_time,
            notes: we.notes
          }))
        }))
      }));
    }
    
    // Sinon, structure par défaut (nouveau programme)
    return daysOfWeek.map(day => ({
      day_of_week: day.id,
      day_name: day.name,
      is_rest_day: day.id === 7, // Dimanche repos par défaut
      workouts: []
    }));
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number | null>(null);

  const handleSave = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    
    // Étape 2: Créer le programme directement
    if (step === 2) {
      console.log('[ProgramForm] Starting program creation...');
      setIsSaving(true)
      try {
        // Construire une description enrichie avec la planification
        let enrichedDescription = description;
        
        // Ajouter les informations de planification dans la description
        const activeDays = programDays.filter(day => !day.is_rest_day && day.workouts.length > 0);
        if (activeDays.length > 0) {
          enrichedDescription += '\n\n📅 Planification:\n';
          activeDays.forEach(day => {
            enrichedDescription += `• ${day.day_name}: `;
            if (day.workouts.length > 0) {
              enrichedDescription += day.workouts.map(w => w.name).join(', ');
            }
            enrichedDescription += '\n';
          });
        }
        
        const programData = { 
          name, 
          description: enrichedDescription, 
          frequency: `${weeks} semaines`, 
          duration: goal 
        };
        
        console.log('[ProgramForm] Program data:', programData);
        console.log('[ProgramForm] Coach ID:', coachId, 'Client ID:', clientId);
        
        // Utilisons maintenant le système avancé avec les nouvelles tables !
        const advancedProgramData = {
          name,
          description,
          weeks,
          goal,
          days: programDays
        };
        
        if (initial && initial.id) {
          console.log('[ProgramForm] Updating existing program:', initial.id);
          await dataService.updateAdvancedProgram(initial.id, advancedProgramData);
          console.log('[ProgramForm] Program updated successfully');
        } else {
          console.log('[ProgramForm] Creating new advanced program...');
          const result = await dataService.createAdvancedProgram(coachId, clientId, advancedProgramData);
          console.log('[ProgramForm] Advanced program created successfully:', result);
        }
        
        console.log('[ProgramForm] Calling onSaved...');
        await onSaved();
        console.log('[ProgramForm] onSaved completed');
      } catch (e) {
        console.error('Program save failed', e);
        console.error('Error details:', (e as any)?.message, (e as any)?.code, (e as any)?.details);
        alert('Erreur lors de la sauvegarde: ' + ((e as any)?.message || e));
      } finally {
        console.log('[ProgramForm] Setting isSaving to false');
        setIsSaving(false);
      }
      return;
    }
    
    // Étape 3: Gérer les exercices (pour plus tard)
    setIsSaving(true)
    try {
      const programData = {
        name,
        description,
        weeks,
        goal,
        days: programDays
      };
      
      // Code pour plus tard quand les tables avancées seront créées
      await onSaved()
    } catch (e) {
      console.error('Program save failed', e)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleRestDay = (dayIndex: number) => {
    setProgramDays(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, is_rest_day: !day.is_rest_day, workouts: !day.is_rest_day ? [] : day.workouts } : day
    ));
  };

  const addWorkout = (dayIndex: number) => {
    setProgramDays(prev => prev.map((day, i) => 
      i === dayIndex ? {
        ...day,
        workouts: [...day.workouts, {
          name: `Séance ${day.workouts.length + 1}`,
          time_slot: 'Matin',
          estimated_duration: 60,
          exercises: []
        }]
      } : day
    ));
  };

  const removeWorkout = (dayIndex: number, workoutIndex: number) => {
    setProgramDays(prev => prev.map((day, i) => 
      i === dayIndex ? {
        ...day,
        workouts: day.workouts.filter((_, wi) => wi !== workoutIndex)
      } : day
    ));
  };

  const addExerciseToWorkout = (dayIndex: number, workoutIndex: number, exercise: any) => {
    setProgramDays(prev => prev.map((day, di) => 
      di === dayIndex ? {
        ...day,
        workouts: day.workouts.map((workout, wi) =>
          wi === workoutIndex ? {
            ...workout,
            exercises: [...workout.exercises, {
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              exercise_category: exercise.category,
              exercise_equipment: exercise.equipment,
              order_in_workout: workout.exercises.length + 1,
              sets: 3,
              reps: '12',
              weight: '',
              rest_time: 60,
              notes: ''
            }]
          } : workout
        )
      } : day
    ));
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📋 Informations du programme
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du programme *
              </label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: Prise de masse débutant"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Décrivez les objectifs et spécificités de ce programme..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durée (semaines)
                </label>
                <input 
                  type="number" 
                  value={weeks} 
                  onChange={(e) => setWeeks(parseInt(e.target.value) || 8)} 
                  min="1"
                  max="52"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objectif principal
                </label>
                <select 
                  value={goal} 
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="muscle-gain">Prise de masse</option>
                  <option value="weight-loss">Perte de poids</option>
                  <option value="strength">Force</option>
                  <option value="endurance">Endurance</option>
                  <option value="conditioning">Condition physique</option>
                  <option value="rehabilitation">Rééducation</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave} 
            disabled={!name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant: Planifier les jours →
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📅 Planification hebdomadaire - {name}
          </h3>
          <button 
            onClick={() => setStep(1)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Retour aux infos
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {programDays.map((day, dayIndex) => (
            <div key={day.day_name} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{day.day_name}</h4>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={day.is_rest_day}
                      onChange={() => toggleRestDay(dayIndex)}
                      className="rounded"
                    />
                    <span className="text-gray-600 dark:text-gray-400">Jour de repos</span>
                  </label>
                </div>
                
                {!day.is_rest_day && (
                  <button
                    onClick={() => addWorkout(dayIndex)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Ajouter séance
                  </button>
                )}
              </div>
              
              {day.is_rest_day ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                  🛌 Jour de repos - Récupération active recommandée
                </div>
              ) : (
                <div className="space-y-2">
                  {day.workouts.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      Aucune séance programmée
                    </div>
                  ) : (
                    day.workouts.map((workout, workoutIndex) => (
                      <div key={workoutIndex} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <input
                              value={workout.name}
                              onChange={(e) => {
                                setProgramDays(prev => prev.map((d, di) => 
                                  di === dayIndex ? {
                                    ...d,
                                    workouts: d.workouts.map((w, wi) =>
                                      wi === workoutIndex ? { ...w, name: e.target.value } : w
                                    )
                                  } : d
                                ));
                              }}
                              className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-600 w-32"
                            />
                            <select
                              value={workout.time_slot}
                              onChange={(e) => {
                                setProgramDays(prev => prev.map((d, di) => 
                                  di === dayIndex ? {
                                    ...d,
                                    workouts: d.workouts.map((w, wi) =>
                                      wi === workoutIndex ? { ...w, time_slot: e.target.value } : w
                                    )
                                  } : d
                                ));
                              }}
                              className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-600"
                            >
                              <option value="Matin">Matin</option>
                              <option value="Midi">Midi</option>
                              <option value="Soir">Soir</option>
                            </select>
                            <input
                              type="number"
                              value={workout.estimated_duration}
                              onChange={(e) => {
                                setProgramDays(prev => prev.map((d, di) => 
                                  di === dayIndex ? {
                                    ...d,
                                    workouts: d.workouts.map((w, wi) =>
                                      wi === workoutIndex ? { ...w, estimated_duration: parseInt(e.target.value) || 60 } : w
                                    )
                                  } : d
                                ));
                              }}
                              min="15"
                              max="180"
                              className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-600 w-20"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">min</span>
                          </div>
                          
                          <button
                            onClick={() => removeWorkout(dayIndex, workoutIndex)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {workout.exercises.length} exercice(s) - 
                          <button 
                            className="ml-1 text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setSelectedDayIndex(dayIndex);
                              setSelectedWorkoutIndex(workoutIndex);
                              setStep(3);
                            }}
                          >
                            Gérer les exercices →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Création...' : 'Créer le programme'}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Gestion des exercices
  const currentDay = selectedDayIndex !== null ? programDays[selectedDayIndex] : null;
  const currentWorkout = currentDay && selectedWorkoutIndex !== null ? currentDay.workouts[selectedWorkoutIndex] : null;

  if (step === 3 && currentDay && currentWorkout) {
    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🏋️‍♂️ Exercices - {currentDay.day_name} - {currentWorkout.name}
          </h3>
          <button 
            onClick={() => setStep(2)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Retour à la planification
          </button>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            💡 <strong>Astuce :</strong> Pour l'instant, configurez le programme de base. 
            La gestion détaillée des exercices sera disponible dans la prochaine version !
          </p>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Création...' : 'Créer le programme'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Composant pour ajouter une séance d'entraînement
interface WorkoutFormProps {
  clientId: string;
  onCancel: () => void;
  onSaved: (workout: any) => void;
}

function WorkoutForm({ clientId, onCancel, onSaved }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [program, setProgram] = useState('');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState('');
  const [status, setStatus] = useState<'completed' | 'missed'>('completed');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!program.trim() || !duration.trim() || !exercises.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      const workoutData = {
        date,
        program: program.trim(),
        duration: parseInt(duration) || 0,
        exercises: parseInt(exercises) || 0,
        status,
        notes: notes.trim()
      };

      // Ici on pourrait sauvegarder en base plus tard
      onSaved(workoutData);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ➕ Ajouter une séance d'entraînement
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date *
          </label>
          <input 
            type="date"
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Statut *
          </label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as 'completed' | 'missed')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="completed">✓ Séance réalisée</option>
            <option value="missed">✗ Séance manquée</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nom du programme *
        </label>
        <input 
          type="text"
          value={program} 
          onChange={(e) => setProgram(e.target.value)} 
          placeholder="Ex: Pectoraux/Triceps, Jambes, Cardio..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Durée (minutes) *
          </label>
          <input 
            type="number"
            value={duration} 
            onChange={(e) => setDuration(e.target.value)} 
            placeholder="Ex: 45"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre d'exercices *
          </label>
          <input 
            type="number"
            value={exercises} 
            onChange={(e) => setExercises(e.target.value)} 
            placeholder="Ex: 8"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes (optionnel)
        </label>
        <textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Commentaires sur la séance, difficultés rencontrées, remarques..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button 
          onClick={onCancel} 
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          Annuler
        </button>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Ajouter la séance'}
        </button>
      </div>
    </div>
  );
}


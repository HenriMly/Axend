'use client';

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  lastWorkout: string;
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
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Unwrap the params promise using React.use()
  const { clientId } = use(params);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === 'coach') {
        // Simulation de données détaillées du client
        const mockClient: Client = {
          id: clientId,
          name: clientId === 'client_1' ? 'Marie Dupont' : 'Pierre Martin',
          email: clientId === 'client_1' ? 'marie@example.com' : 'pierre@example.com',
          joinedDate: clientId === 'client_1' ? '2024-01-15' : '2024-02-10',
          lastWorkout: '2024-10-01',
          programs: clientId === 'client_1' ? ['Perte de poids', 'Cardio'] : ['Prise de masse', 'Force'],
          currentWeight: clientId === 'client_1' ? 65 : 75,
          targetWeight: clientId === 'client_1' ? 60 : 80,
          age: clientId === 'client_1' ? 28 : 32,
          height: clientId === 'client_1' ? 165 : 178,
          workouts: [
            {
              id: 'w1',
              date: '2024-10-01',
              program: 'Cardio',
              duration: 45,
              exercises: [
                {
                  name: 'Course à pied',
                  sets: [{ reps: 1, weight: 0, rest: 0 }]
                },
                {
                  name: 'Vélo',
                  sets: [{ reps: 1, weight: 0, rest: 0 }]
                }
              ],
              notes: 'Bonne séance, motivation au top!'
            },
            {
              id: 'w2',
              date: '2024-09-29',
              program: 'Force',
              duration: 60,
              exercises: [
                {
                  name: 'Squat',
                  sets: [{ reps: 12, weight: 60, rest: 90 }, { reps: 10, weight: 65, rest: 90 }]
                },
                {
                  name: 'Développé couché',
                  sets: [{ reps: 10, weight: 50, rest: 120 }]
                }
              ]
            }
          ],
          measurements: [
            { date: '2024-10-01', weight: clientId === 'client_1' ? 65 : 75, bodyFat: 18, muscle: 45 },
            { date: '2024-09-15', weight: clientId === 'client_1' ? 66 : 74, bodyFat: 19, muscle: 44 },
            { date: '2024-09-01', weight: clientId === 'client_1' ? 67 : 73, bodyFat: 20, muscle: 43 },
          ]
        };
        setClient(mockClient);
      } else {
        router.push('/dashboard/client');
      }
    } else {
      router.push('/auth/login');
    }
    setIsLoading(false);
  }, [clientId, router]);

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

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Évolution du poids</h3>
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
                      <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md">
                        Modifier
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md">
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
          </div>
        )}
      </div>
    </div>
  );
}
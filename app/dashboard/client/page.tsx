'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClientUser {
  id: string;
  name: string;
  email: string;
  role: string;
  coachId: string;
  currentWeight: number;
  targetWeight: number;
  age: number;
  height: number;
  programs: Program[];
  workouts: WorkoutSession[];
  measurements: Measurement[];
  coach: {
    name: string;
    email: string;
  };
}

interface Program {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  frequency: string;
  duration: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest: string;
  instructions?: string;
}

interface WorkoutSession {
  id: string;
  date: string;
  program: string;
  duration: number;
  completed: boolean;
  exercises: CompletedExercise[];
  notes?: string;
}

interface CompletedExercise {
  name: string;
  sets: CompletedSet[];
}

interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
}

interface Measurement {
  date: string;
  weight: number;
  bodyFat?: number;
  muscle?: number;
}

export default function ClientDashboard() {
  const [client, setClient] = useState<ClientUser | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role === 'client') {
        // Simulation de données client
        const mockClientData: ClientUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          coachId: user.coachId || 'coach_demo',
          currentWeight: 70,
          targetWeight: 75,
          age: 28,
          height: 175,
          coach: {
            name: 'Coach Durand',
            email: 'coach@example.com'
          },
          programs: [
            {
              id: 'p1',
              name: 'Prise de masse débutant',
              description: 'Programme de 8 semaines pour développer la masse musculaire',
              frequency: '3 fois par semaine',
              duration: '60 minutes',
              exercises: [
                {
                  name: 'Squat',
                  sets: 3,
                  reps: '8-12',
                  weight: '60-70kg',
                  rest: '90 secondes',
                  instructions: 'Descendez jusqu\'à ce que vos cuisses soient parallèles au sol'
                },
                {
                  name: 'Développé couché',
                  sets: 3,
                  reps: '8-10',
                  weight: '50-60kg',
                  rest: '120 secondes',
                  instructions: 'Contrôlez la descente, poussez explosif'
                },
                {
                  name: 'Rowing barre',
                  sets: 3,
                  reps: '10-12',
                  weight: '40-50kg',
                  rest: '90 secondes'
                }
              ]
            }
          ],
          workouts: [
            {
              id: 'w1',
              date: '2024-10-01',
              program: 'Prise de masse débutant',
              duration: 65,
              completed: true,
              exercises: [
                {
                  name: 'Squat',
                  sets: [
                    { reps: 10, weight: 60, completed: true },
                    { reps: 9, weight: 65, completed: true },
                    { reps: 8, weight: 65, completed: true }
                  ]
                },
                {
                  name: 'Développé couché',
                  sets: [
                    { reps: 10, weight: 50, completed: true },
                    { reps: 9, weight: 55, completed: true },
                    { reps: 8, weight: 55, completed: true }
                  ]
                }
              ],
              notes: 'Très bonne séance, j\'ai bien progressé sur le squat!'
            },
            {
              id: 'w2',
              date: '2024-09-29',
              program: 'Prise de masse débutant',
              duration: 60,
              completed: true,
              exercises: [
                {
                  name: 'Squat',
                  sets: [
                    { reps: 10, weight: 55, completed: true },
                    { reps: 10, weight: 60, completed: true },
                    { reps: 8, weight: 60, completed: true }
                  ]
                }
              ]
            }
          ],
          measurements: [
            { date: '2024-10-01', weight: 70.2, bodyFat: 15, muscle: 55 },
            { date: '2024-09-15', weight: 69.8, bodyFat: 16, muscle: 54 },
            { date: '2024-09-01', weight: 69.5, bodyFat: 16.5, muscle: 53.5 },
          ]
        };
        setClient(mockClientData);
      } else {
        router.push('/dashboard/coach');
      }
    } else {
      router.push('/auth/login');
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

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
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Axend Fitness
              </h1>
            </Link>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {client.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Coach: {client.coach.name}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Poids actuel</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{client.currentWeight}kg</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Objectif</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{client.targetWeight}kg</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Séances ce mois</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{client.workouts.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progression</p>
                <p className="text-3xl font-bold text-green-600">+0.7kg</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
              { id: 'programs', name: 'Mes programmes', icon: '📋' },
              { id: 'workouts', name: 'Mes séances', icon: '💪' },
              { id: 'progress', name: 'Ma progression', icon: '📈' },
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Programme actuel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Programme actuel</h3>
              </div>
              <div className="p-6">
                {client.programs[0] && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{client.programs[0].name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{client.programs[0].description}</p>
                    <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>🕒 {client.programs[0].frequency}</span>
                      <span>⏱️ {client.programs[0].duration}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dernière séance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dernière séance</h3>
              </div>
              <div className="p-6">
                {client.workouts[0] && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{client.workouts[0].program}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                        Terminée
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(client.workouts[0].date).toLocaleDateString('fr-FR')} • {client.workouts[0].duration}min
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {client.workouts[0].exercises.length} exercices terminés
                    </p>
                    {client.workouts[0].notes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">{client.workouts[0].notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            {client.programs.map((program) => (
              <div key={program.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{program.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{program.description}</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                      Commencer séance
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">🕒 Fréquence:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{program.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">⏱️ Durée:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{program.duration}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Exercices:</h4>
                  <div className="space-y-3">
                    {program.exercises.map((exercise, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-white">{exercise.name}</h5>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>Sets: {exercise.sets}</span>
                              <span>Reps: {exercise.reps}</span>
                              <span>Poids: {exercise.weight || 'Au poids du corps'}</span>
                              <span>Repos: {exercise.rest}</span>
                            </div>
                            {exercise.instructions && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                {exercise.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      workout.completed 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {workout.completed ? 'Terminée' : 'En cours'}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">{exercise.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className={`p-2 rounded ${
                              set.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
                            }`}>
                              <span className="text-gray-900 dark:text-white">
                                Set {setIndex + 1}: {set.reps} reps × {set.weight}kg
                              </span>
                              {set.completed && (
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400 inline ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
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
                            measurement.weight > client.measurements[index - 1].weight
                              ? 'text-green-600 dark:text-green-400'
                              : measurement.weight < client.measurements[index - 1].weight
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {measurement.weight > client.measurements[index - 1].weight ? '↑' : 
                             measurement.weight < client.measurements[index - 1].weight ? '↓' : '→'}
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
      </div>
    </div>
  );
}
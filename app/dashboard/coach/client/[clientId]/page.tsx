'use client';

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { dataService } from '@/lib/data';
import { useRequireCoach } from '@/lib/auth-context';

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
  const { user, userProfile } = useRequireCoach();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  
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
          lastWorkout: data.workouts?.[0]?.date || null,
          programs: (data.programs || []).map((p: any) => p.name),
          currentWeight: data.current_weight || 0,
          targetWeight: data.target_weight || 0,
          age: data.age || 0,
          height: data.height || 0,
          workouts: (data.workouts || []).map((w: any) => ({
            id: w.id,
            date: w.date,
            program: w.program_id || w.program || '',
            duration: w.duration || 0,
            exercises: (w.workout_exercises || []).map((we: any) => ({
              name: we.name || 'Exercice',
              sets: (we.workout_sets || []).map((s: any) => ({ reps: s.reps, weight: s.weight, rest: s.rest }))
            })),
            notes: w.notes || ''
          })),
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
                      <button onClick={() => setEditingProgram({ name: program })} className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingProgram ? 'Modifier le programme' : 'Créer un programme'}</h3>
            <ProgramForm
              initial={editingProgram}
              clientId={client!.id}
              coachId={userProfile!.id}
              onCancel={() => { setEditingProgram(null); setCreatingProgram(false); }}
              onSaved={async () => {
                // reload client
                try {
                  const re = await dataService.getClientDetail(client!.id);
                  setClient(prev => prev ? { ...prev, programs: (re.programs || []).map((p:any)=>p.name) } : prev);
                } catch (e) {
                  console.error('Failed to reload client after program save', e);
                }
                setEditingProgram(null);
                setCreatingProgram(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramForm({ initial, clientId, coachId, onCancel, onSaved }: { initial?: any, clientId: string, coachId: string, onCancel: () => void, onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [frequency, setFrequency] = useState(initial?.frequency || '')
  const [duration, setDuration] = useState(initial?.duration || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (initial && initial.id) {
        await dataService.updateProgram(initial.id, { name, description, frequency, duration })
      } else {
        await dataService.createProgram(coachId, clientId, { name, description, frequency, duration })
      }
      await onSaved()
    } catch (e) {
      console.error('Program save failed', e)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fréquence</label>
            <input value={frequency} onChange={(e) => setFrequency(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durée</label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </div>
  )
}
'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireClient } from '@/lib/auth-context';
import { authService } from '@/lib/auth';
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
  body_fat_percentage?: number;
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

  useEffect(() => {
    if (!loading && userProfile && isClient && userProfile.id && !dataLoaded) {
      console.log('[ClientDashboard] Loading client data for:', userProfile.id);
      loadClientData();
    }
  }, [loading, userProfile?.id, isClient, dataLoaded]);

  const loadClientData = async () => {
    if (!userProfile?.id) {
      console.error('[loadClientData] No userProfile or ID');
      return;
    }

    try {
      console.log('[loadClientData] Starting to load data for:', userProfile.id);
      setIsLoadingData(true);
      
      // Charger les données complètes du client (incluant les informations du coach)
      console.log('[loadClientData] Loading complete client data...');
      const completeClientData = await dataService.getClientData(userProfile.id);
      
      // Mapper les données pour correspondre à l'interface attendue
      const mappedClientData = {
        ...completeClientData,
        coach: completeClientData.coaches // Mapper coaches -> coach
      };
      
      setClientData(mappedClientData as ClientData);
      console.log('[loadClientData] Client data loaded, coach info:', mappedClientData.coach);
      
      // Charger les programmes
      console.log('[loadClientData] Loading programs...');
      const clientPrograms = await dataService.getClientPrograms(userProfile.id);
      setPrograms(clientPrograms || []);
      console.log('[loadClientData] Programs loaded:', clientPrograms?.length || 0);
      
      // Charger les séances
      console.log('[loadClientData] Loading workouts...');
      const clientWorkouts = await dataService.getClientWorkouts(userProfile.id);
      setWorkouts(clientWorkouts || []);
      console.log('[loadClientData] Workouts loaded:', clientWorkouts?.length || 0);
      
      // Charger les mesures
      console.log('[loadClientData] Loading measurements...');
      const clientMeasurements = await dataService.getClientMeasurements(userProfile.id);
      setMeasurements(clientMeasurements || []);
      console.log('[loadClientData] Measurements loaded:', clientMeasurements?.length || 0);
      
    } catch (error) {
      console.error('[loadClientData] Error loading client data:', error);
    } finally {
      console.log('[loadClientData] Data loading finished');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!userProfile || !isClient) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Axend
              </h1>
            </Link>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>/</span>
              <span>Dashboard Client</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {displayData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{displayData.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Client</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
            { id: 'programs', label: 'Programmes', icon: '💪' },
            { id: 'workouts', label: 'Séances', icon: '🏋️' },
            { id: 'progress', label: 'Progression', icon: '📈' },
            { id: 'settings', label: 'Profil', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
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
              <p className="text-gray-600 dark:text-gray-400">
                {displayData.coach ? `Coach: ${displayData.coach.name}` : 'Aucun coach assigné'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Programmes</h3>
                  <span className="text-2xl">💪</span>
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{programs.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">programmes actifs</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Séances</h3>
                  <span className="text-2xl">🏋️</span>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{workouts.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">séances effectuées</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Poids actuel</h3>
                  <span className="text-2xl">⚖️</span>
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {displayData.current_weight || 'N/A'}
                  {displayData.current_weight && 'kg'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Objectif: {displayData.target_weight || 'N/A'}{displayData.target_weight && 'kg'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mesures</h3>
                  <span className="text-2xl">📏</span>
                </div>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{measurements.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">mesures enregistrées</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Programmes</h2>
            </div>
            
            {programs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {programs.map((program) => (
                  <div key={program.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {program.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {program.description}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                      {program.exercises?.length || 0} exercices
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Voir le programme
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Séances</h2>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                + Nouvelle séance
              </button>
            </div>
            
            {workouts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <EmptyState
                  title="Aucune séance enregistrée"
                  description="Commencez votre première séance d'entraînement dès maintenant !"
                  buttonText="Commencer une séance"
                  onButtonClick={() => {
                    // Logic to start a workout
                    alert('Fonctionnalité à venir: Démarrer une séance');
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <div key={workout.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {workout.programs?.name || 'Séance libre'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(workout.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm">
                        Terminée
                      </span>
                    </div>
                    {workout.notes && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {workout.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ma Progression</h2>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                + Ajouter une mesure
              </button>
            </div>
            
            {measurements.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Évolution du poids
                  </h3>
                  <div className="space-y-3">
                    {measurements.slice(0, 5).map((measurement) => (
                      <div key={measurement.id} className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(measurement.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {measurement.weight}kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Statistiques
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Poids initial</span>
                      <span className="font-semibold">{measurements[measurements.length - 1]?.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Poids actuel</span>
                      <span className="font-semibold">{measurements[0]?.weight}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Évolution</span>
                      <span className="font-semibold text-green-600">
                        {measurements.length >= 2 
                          ? `${(measurements[0].weight - measurements[measurements.length - 1].weight).toFixed(1)}kg`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informations personnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom
                    </label>
                    <p className="text-gray-900 dark:text-white">{displayData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{displayData.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Âge
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {displayData.age ? `${displayData.age} ans` : 'Non renseigné'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Taille
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {displayData.height ? `${displayData.height} cm` : 'Non renseigné'}
                    </p>
                  </div>
                </div>
                <button className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Modifier mes informations
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Mon Coach
                </h3>
                {displayData.coach ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom du coach
                      </label>
                      <p className="text-gray-900 dark:text-white">{displayData.coach.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-white">{displayData.coach.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Code coach
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono">{displayData.coach.coach_code}</p>
                    </div>
                    <button 
                      onClick={() => window.location.href = `mailto:${displayData.coach?.email}`}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Contacter mon coach
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Aucun coach assigné
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Entrez le code de votre coach pour commencer votre suivi personnalisé
                      </p>
                    </div>
                    
                    <form onSubmit={handleAssignCoach} className="max-w-sm mx-auto space-y-4">
                      <div>
                        <input
                          type="text"
                          value={coachCode}
                          onChange={(e) => setCoachCode(e.target.value)}
                          placeholder="Code coach (ex: COACH_123456)"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          disabled={isAssigningCoach}
                          required
                        />
                      </div>
                      
                      {assignError && (
                        <p className="text-red-600 dark:text-red-400 text-sm">{assignError}</p>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isAssigningCoach || !coachCode.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        {isAssigningCoach ? 'Assignation...' : 'Assigner le coach'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

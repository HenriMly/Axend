'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dataService } from '@/lib/data';
import { useRequireCoach } from '@/lib/auth-context';

interface ClientTodayWorkout {
  clientId: string;
  clientName: string;
  clientEmail: string;
  hasWorkoutToday: boolean;
  workoutName?: string;
  programName?: string;
  estimatedDuration?: number;
  exerciseCount?: number;
  isRestDay?: boolean;
  workoutStatus?: 'not-started' | 'in-progress' | 'completed';
  completedAt?: string;
  sessionData?: {
    duration?: number;
    notes?: string;
    nextGoals?: string;
    completedExercises?: number;
    totalExercises?: number;
  };
}

export default function CoachTodayWorkouts() {
  const { user, userProfile } = useRequireCoach();
  const [clientWorkouts, setClientWorkouts] = useState<ClientTodayWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  useEffect(() => {
    const loadClientWorkouts = async () => {
      if (!userProfile || userProfile.role !== 'coach') return;
      
      setIsLoading(true);
      try {
        // Récupérer tous les clients du coach
        const clients = await dataService.getCoachClients(userProfile.id);
        
        const workoutsData: ClientTodayWorkout[] = [];
        
        for (const client of clients) {
          try {
            // Récupérer le programme du jour pour chaque client
            const todayWorkout = await dataService.getTodayWorkout(client.id);
            
            const today = new Date(selectedDate).getDay();
            const dayOfWeek = today === 0 ? 7 : today;
            
            let clientData: ClientTodayWorkout = {
              clientId: client.id,
              clientName: client.name || client.email,
              clientEmail: client.email,
              hasWorkoutToday: false,
              isRestDay: false,
              workoutStatus: 'not-started'
            };

            if (todayWorkout && (todayWorkout as any).program_days) {
              const todayProgramDay = (todayWorkout as any).program_days.find((day: any) => day.day_of_week === dayOfWeek);
              
              if (todayProgramDay) {
                if (todayProgramDay.is_rest_day) {
                  clientData.isRestDay = true;
                } else if (todayProgramDay.workouts && todayProgramDay.workouts.length > 0) {
                  const firstWorkout = todayProgramDay.workouts[0];
                  clientData.hasWorkoutToday = true;
                  clientData.workoutName = firstWorkout.name;
                  clientData.programName = (todayWorkout as any).name;
                  clientData.estimatedDuration = firstWorkout.estimated_duration;
                  clientData.exerciseCount = firstWorkout.workout_exercises?.length || 0;
                  
                  // Vérifier le statut depuis localStorage (simulation)
                  const savedHistory = localStorage.getItem(`workout_history_${client.id}`);
                  const todayStr = new Date(selectedDate).toDateString();
                  
                  if (savedHistory) {
                    const history = JSON.parse(savedHistory);
                    const todaySession = history.find((session: any) => 
                      new Date(session.date).toDateString() === todayStr
                    );
                    
                    if (todaySession) {
                      clientData.workoutStatus = 'completed';
                      clientData.completedAt = todaySession.date;
                      clientData.sessionData = {
                        duration: todaySession.duration,
                        notes: todaySession.notes,
                        nextGoals: todaySession.nextGoals,
                        completedExercises: todaySession.exercises?.filter((ex: any) => ex.completed).length || 0,
                        totalExercises: todaySession.exercises?.length || 0
                      };
                    }
                  }
                }
              }
            }
            
            workoutsData.push(clientData);
          } catch (error) {
            console.error(`Error loading workout for client ${client.id}:`, error);
            // Ajouter le client même en cas d'erreur
            workoutsData.push({
              clientId: client.id,
              clientName: client.name || client.email,
              clientEmail: client.email,
              hasWorkoutToday: false,
              workoutStatus: 'not-started'
            });
          }
        }
        
        setClientWorkouts(workoutsData);
      } catch (error) {
        console.error('Error loading client workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClientWorkouts();
  }, [userProfile, selectedDate]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (client: ClientTodayWorkout) => {
    if (client.isRestDay) return '🧘‍♂️ Jour de repos';
    if (!client.hasWorkoutToday) return '❌ Pas de séance';
    
    switch (client.workoutStatus) {
      case 'completed':
        return `✅ Terminée à ${new Date(client.completedAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      case 'in-progress':
        return '🔄 En cours...';
      default:
        return '⏳ Pas encore commencée';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📅 Séances du jour
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Suivi des entraînements de vos clients
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button 
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clientWorkouts.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total clients</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {clientWorkouts.filter(c => c.workoutStatus === 'completed').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Séances terminées</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <span className="text-2xl">💪</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {clientWorkouts.filter(c => c.hasWorkoutToday && !c.isRestDay).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Séances programmées</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <span className="text-2xl">🧘‍♂️</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {clientWorkouts.filter(c => c.isRestDay).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jours de repos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Détail par client - {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>

          <div className="p-6">
            {clientWorkouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucun client trouvé
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Vous n'avez pas encore de clients assignés.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientWorkouts.map((client) => (
                  <ClientWorkoutCard key={client.clientId} client={client} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour chaque client
interface ClientWorkoutCardProps {
  client: ClientTodayWorkout;
}

function ClientWorkoutCard({ client }: ClientWorkoutCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusText = (client: ClientTodayWorkout) => {
    if (client.isRestDay) return '🧘‍♂️ Jour de repos';
    if (!client.hasWorkoutToday) return '❌ Pas de séance programmée';
    
    switch (client.workoutStatus) {
      case 'completed':
        return `✅ Terminée à ${new Date(client.completedAt!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      case 'in-progress':
        return '🔄 En cours...';
      default:
        return '⏳ Pas encore commencée';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {client.clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {client.clientName}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {client.clientEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {client.hasWorkoutToday && !client.isRestDay && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {client.workoutName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {client.exerciseCount} exercices • {client.estimatedDuration}min
              </p>
            </div>
          )}
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.workoutStatus!)}`}>
            {getStatusText(client)}
          </div>

          {client.workoutStatus === 'completed' && client.sessionData && (
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/40"
            >
              {showDetails ? 'Masquer' : 'Détails'}
            </button>
          )}
        </div>
      </div>

      {/* Détails de la séance terminée */}
      {showDetails && client.sessionData && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h5>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>⏱️ Durée: {client.sessionData.duration || 'Non renseignée'} min</p>
                <p>💪 Exercices: {client.sessionData.completedExercises}/{client.sessionData.totalExercises}</p>
              </div>
            </div>
            
            {client.sessionData.notes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{client.sessionData.notes}"
                </p>
              </div>
            )}
            
            {client.sessionData.nextGoals && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Prochains objectifs</h5>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  🎯 {client.sessionData.nextGoals}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
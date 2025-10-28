'use client';

import Link from "next/link";
import CoachCharts from './CoachCharts';
import CoachExtraCharts from './CoachExtraCharts';
import MiniDonut from '@/components/ui/MiniDonut';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireCoach } from "@/lib/auth-context";
import { dataService } from '@/lib/data';

interface Client {
  id: string;
  name: string;
  email: string;
  joined_date: string;
  lastWorkout: string | null;
  programs: string[];
  current_weight: number | null;
  target_weight: number | null;
  workoutCount: number;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  role: string;
  coach_code: string;
  clients: Client[];
}
export default function CoachDashboard() {
  const { user, userProfile, loading, isCoach, signOut } = useRequireCoach();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [clientQuery, setClientQuery] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // Pour stocker le détail de la séance du jour pour chaque client
  const [clientDayDetails, setClientDayDetails] = useState<Record<string, {
    programName: string;
    dayName: string;
    exercises: { name: string }[];
  } | null>>({});
  const router = useRouter();

  // Ajout séance coach - states
  const [date, setDate] = useState<string>('');
  const [programName, setProgramName] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [addedExercises, setAddedExercises] = useState<any[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Recherche d'exercices (externe ou locale)
  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      // Exemple: fetch depuis API externe ou locale
      const res = await fetch(`/api/external-exercises?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Ajouter un exercice à la liste
  const addExternalExerciseToList = (ex: any) => {
    setAddedExercises(prev => [...prev, ex]);
  };

  // Retirer un exercice
  const removeExercise = (idx: number) => {
    setAddedExercises(prev => prev.filter((_, i) => i !== idx));
  };

  // Reset du formulaire
  const resetForm = () => {
    setDate('');
    setProgramName('');
    setSessionTitle('');
    setSearchQuery('');
    setSearchResults([]);
    setAddedExercises([]);
    setDuration('');
    setNotes('');
  };

  // Assurer que le composant est monté côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!loading && userProfile && isCoach) {
      setIsLoading(true);
      setError(null);
      dataService.getCoachClients(userProfile.id)
        .then(async (clients) => {
          const coachData = {
            ...userProfile,
            clients: clients
          };
          setCoach(coachData as Coach);

          const today = new Date();
          const todayDayOfWeek = today.getDay(); // 0 (dimanche) à 6 (samedi)
          const clientDetails: Record<string, { programName: string; dayName: string; exercises: { name: string }[] } | null> = {};
          for (const client of clients) {
            let found = false;
            try {
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];
              const todayWorkoutData = await dataService.getTodayWorkout(client.id);
              let exercises: { name: string }[] = [];
              let programName = '';
              let dayName = '';
              if (todayWorkoutData && todayWorkoutData.length > 0) {
                const prog = todayWorkoutData[0];
                const day = prog.program_days && prog.program_days[0];
                if (day && day.workouts && day.workouts.length > 0) {
                  exercises = day.workouts.flatMap((w: any) =>
                    (w.workout_exercises || []).map((ex: any) => ({ name: ex.exercise_name }))
                  );
                }
                programName = prog.name;
                dayName = day ? day.day_name : '';
              }
              // Vérifie si la séance a été réalisée aujourd'hui (dans la vue)
              const isCompleted = await dataService.isSessionCompletedForDate(client.id, todayStr);
              if (programName || isCompleted) {
                clientDetails[client.id] = {
                  programName,
                  dayName,
                  exercises
                };
                // Ajoute une propriété pour l'état de réalisation
                (clientDetails[client.id] as any).isCompleted = isCompleted;
                found = true;
              }
            } catch (e) {
              console.error('[COACH DEBUG] Error for clientId:', client.id, e);
            }
            if (!found) clientDetails[client.id] = null;
          }
          setClientDayDetails(clientDetails);
        })
        .catch((err: any) => {
          setError(err?.message || String(err));
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, userProfile, loading, isCoach]);

  const handleLogout = async () => {
    console.log('[CoachDashboard] Logout button clicked');
    try {
      await signOut();
      console.log('[CoachDashboard] Sign out completed');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Attendre que le composant soit monté côté client
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Impossible de charger les clients</h2>
          {error ? (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          ) : (
            <p className="text-sm text-gray-600 mb-4">Aucun client trouvé ou chargement interrompu.</p>
          )}
          <div className="flex justify-center gap-4">
            <button type="button" onClick={() => {
              setIsLoading(true);
              setError(null);
              dataService.getCoachClients(userProfile!.id)
                .then(clients => setCoach({ ...(userProfile as any), clients } as Coach))
                .catch((e:any) => setError(e?.message || String(e)))
                .finally(() => setIsLoading(false));
            }} className="px-4 py-2 bg-blue-600 text-white rounded">Réessayer</button>
            <button type="button" onClick={() => router.push('/')} className="px-4 py-2 bg-gray-200 rounded">Accueil</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header moderne */}
      <header className="relative w-full px-4 sm:px-6 py-4 sm:py-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-lg shadow-blue-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link href="/" className="group flex items-center space-x-3 sm:space-x-4 px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-white dark:hover:from-gray-700 transition-all duration-200 hover:shadow-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white font-bold text-lg sm:text-xl">A</span>
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Axend Coach
                  </h1>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Professional Edition</p>
                </div>
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-3 sm:gap-6 items-center">
              {/* Notifications */}
              <div className="flex space-x-2 sm:space-x-3">
                <button type="button" className="relative p-2 sm:p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                </button>
                
                <Link href="/dashboard/coach/settings" className="p-2 sm:p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
              
              {/* Profil coach */}
              <div className="flex items-center space-x-2 sm:space-x-4 px-3 sm:px-6 py-2 sm:py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <span className="text-white font-bold text-sm sm:text-lg">
                    {coach.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                    {coach.name}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>Coach • {coach.coach_code}</span>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 hover:scale-105"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {/* Stats Cards modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Clients */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  TOTAL
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
                {coach.clients.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Clients actifs</div>
            </div>
          </div>

          {/* Actifs cette semaine */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  ACTIFS
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2">
                {coach.clients.filter(client => {
                  const lastWorkout = client.lastWorkout ? new Date(client.lastWorkout) : null;
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  return lastWorkout ? lastWorkout >= oneMonthAgo : false;
                }).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ce mois-ci</div>
            </div>
          </div>

          {/* Programmes actifs */}
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
                  PROGRAMMES
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                {coach.clients.reduce((total, client) => total + client.programs.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">En cours</div>
            </div>
          </div>

          {/* Taux de réussite */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                  SUCCESS
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent mb-2">
                87%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Taux de réussite</div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-700" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>
        </div>

  {/* Charts section for coach */}
  <CoachCharts clients={coach.clients} />
  <CoachExtraCharts clients={coach.clients} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button type="button" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter un client</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inviter un nouveau client</p>
              </div>
            </div>
          </button>

          <button type="button" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Créer un programme</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nouveau plan d'entraînement</p>
              </div>
            </div>
          </button>

          <button type="button" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voir les stats</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyses et rapports</p>
              </div>
            </div>
          </button>
        </div>

        {/* Action rapide - Séances du jour */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-4xl">📅</div>
              <div>
                <h3 className="text-xl font-bold mb-1">Séances du jour</h3>
                <p className="text-orange-100 text-sm">
                  Suivez les entraînements de vos clients en temps réel
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {coach.clients.map((client) => {
                const dayDetail = clientDayDetails[client.id];
                return (
                  <div key={client.id} className="bg-white/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">{client.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white">{client.name}</div>
                        <div className="text-xs text-orange-100">{client.email}</div>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 text-sm text-orange-50 w-full md:w-auto">
                      {dayDetail ? (
                        <div>
                          <span className="font-semibold">Séance prévue aujourd'hui</span>
                          <div className="text-xs mt-1">Programme : <span className="font-bold">{dayDetail.programName}</span></div>
                          <div className="text-xs">Jour : <span className="font-bold">{dayDetail.dayName}</span></div>
                          {dayDetail.exercises.length > 0 ? (
                            <ul className="mt-1 ml-2 list-disc text-xs">
                              {dayDetail.exercises.map((ex, idx) => (
                                <li key={idx}>{ex.name}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-xs italic">Aucun exercice prévu</div>
                          )}
                          {/* Affichage de l'état de la séance */}
                          <div className="mt-2">
                            {dayDetail && (dayDetail as any).isCompleted ? (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">Séance réalisée</span>
                                <button
                                  className="ml-2 px-3 py-1 bg-white/80 text-green-700 rounded shadow hover:bg-green-100 text-xs font-semibold"
                                  onClick={() => router.push(`/dashboard/coach/client/${client.id}?show=lastworkout`)}
                                >
                                  Voir les résultats
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-1 bg-orange-400 text-white rounded-full text-xs font-semibold">Non réalisée</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span>Aucune séance aujourd'hui</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Mes Clients</h2>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <div className="relative w-full sm:w-auto">
                  <input
                    aria-label="Rechercher des clients"
                    placeholder="Rechercher..."
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full sm:w-48 lg:w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    type="button"
                    onClick={() => setClientFilter('all')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      clientFilter === 'all' 
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Tous
                  </button>
                  <button 
                    type="button"
                    onClick={() => setClientFilter('active')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      clientFilter === 'active' 
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Actifs
                  </button>
                  <button 
                    type="button"
                    onClick={() => setClientFilter('inactive')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      clientFilter === 'inactive' 
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Inactifs
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4">
              {coach.clients
                .filter(c => {
                  // Filtre par recherche
                  if (clientQuery) {
                    const q = clientQuery.trim().toLowerCase();
                    if (!(c.name && c.name.toLowerCase().includes(q)) && !(c.email && c.email.toLowerCase().includes(q))) {
                      return false;
                    }
                  }
                  
                  // Filtre par statut (actif/inactif) - basé sur 1 mois
                  if (clientFilter === 'active') {
                    const lastWorkout = c.lastWorkout ? new Date(c.lastWorkout) : null;
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    return lastWorkout ? lastWorkout >= oneMonthAgo : false;
                  } else if (clientFilter === 'inactive') {
                    const lastWorkout = c.lastWorkout ? new Date(c.lastWorkout) : null;
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    return !lastWorkout || lastWorkout < oneMonthAgo;
                  }
                  
                  return true; // 'all'
                })
                .map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/coach/client/${client.id}`}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                        <div className="flex space-x-4 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Inscrit le {new Date(client.joined_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Dernier entraînement: {client.lastWorkout ? new Date(client.lastWorkout).toLocaleDateString('fr-FR') : 'Aucun'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex space-x-2 mb-2">
                        {client.programs.map((program, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                          >
                            {program}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {client.current_weight || 'N/A'}kg → {client.target_weight || 'N/A'}kg
                          </div>
                        </div>
                        <div>
                          {/* Mini donut progress */}
                          {client.current_weight && client.target_weight ? (
                            (() => {
                              const diff = client.target_weight - client.current_weight;
                              const total = Math.abs(client.target_weight) || 1;
                              // If target is higher than current, percent done = current/target*100
                              const percent = client.target_weight > client.current_weight
                                ? (client.current_weight / client.target_weight) * 100
                                : ((client.current_weight - client.target_weight) / total) * 100;
                              return <MiniDonut percent={Math.min(100, Math.max(0, percent))} />;
                            })()
                          ) : (
                            <MiniDonut percent={0} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Card is clickable; actions removed to make whole card navigable */}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

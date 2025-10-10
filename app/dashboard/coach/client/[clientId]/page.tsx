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

interface ProgramDetail {
  id: string;
  name: string;
  description?: string;
  weeks?: number;
  goal?: string;
  program_days?: Array<{
    day_of_week: number;
    day_name?: string;
    is_rest_day: boolean;
    workouts?: Array<{
      id?: string;
      name: string;
      time_slot?: string;
      estimated_duration?: number;
    }>;
  }>;
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
  const [goalValue, setGoalValue] = useState<string>('');
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [deletingMeasurementDate, setDeletingMeasurementDate] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [addingMeasurement, setAddingMeasurement] = useState(false);
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [workoutSessions, setWorkoutSessions] = useState<any[]>([]);
  // Keep the client.workouts preview in sync with persisted/local workout sessions
  // NOTE: avoid including `client` in deps to prevent update cycles — only run when workoutSessions changes
  useEffect(() => {
    if (!client) return;
    setClient(prev => {
      if (!prev) return prev;
      // If workouts appear identical (same length and same ids/dates), avoid updating to prevent re-render loop
      try {
        const a = prev.workouts || [];
        const b = workoutSessions || [];
        if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
          let same = true;
          for (let i = 0; i < a.length; i++) {
            if (!a[i] || !b[i] || String(a[i].id) !== String(b[i].id) || String(a[i].date) !== String(b[i].date)) { same = false; break; }
          }
          if (same) return prev;
        }
      } catch (e) {
        // ignore and fallback to updating
      }
      return { ...prev, workouts: workoutSessions };
    });
  }, [workoutSessions]);
  const [programDetails, setProgramDetails] = useState<ProgramDetail[]>([]);
  const [clientGoals, setClientGoals] = useState<any[]>([]);
  const [selectedProgramIndex, setSelectedProgramIndex] = useState<number>(0);
  // Week selector (start at Monday of current week)
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // if Sunday (0) -> go back 6 days, else set to Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0,0,0,0);
    return monday;
  });
  const [editingWorkout, setEditingWorkout] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
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

        // Load persisted workouts if available
        try {
          const persisted = await dataService.getClientWorkouts(clientId, 50);
          // Map persisted shape to local UI shape
          const mappedWorkouts = (persisted || []).map((w: any) => ({
            id: w.id,
            date: w.date,
            program: w.program_name || w.program || w.name || '',
            duration: w.duration_minutes || w.estimated_duration || 0,
            exercises: (w.exercises && w.exercises.length) || w.exercises_count || 0,
            notes: w.notes || '',
            status: w.status || 'completed'
          }));
          if (mounted) setWorkoutSessions(mappedWorkouts);
        } catch (workoutErr) {
          console.debug('[ClientDetail] No persisted workouts or query failed', workoutErr);
        }

        // Try to load detailed programs (advanced structure) for the client
        try {
          const progDetails = await dataService.getClientProgramsAdvanced(clientId);
          if (mounted) setProgramDetails(progDetails || []);
        } catch (e) {
          // fallback: try the simpler programs endpoint if advanced not available
          try {
            const simple = await dataService.getClientPrograms(clientId);
            if (mounted) setProgramDetails(simple || []);
          } catch (err) {
            console.debug('No program details available', err);
          }
        }

        // Load client goals
        try {
          const goals = await dataService.getClientGoals(clientId);
          if (mounted) setClientGoals(goals || []);
        } catch (gErr) {
          console.debug('Failed to load client goals', gErr);
        }
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

  // Helper: get earliest measurement weight (by date) if available
  const getEarliestMeasurementWeight = (measurements: Measurement[] | undefined) => {
    if (!measurements || measurements.length === 0) return null;
    try {
      let earliest = measurements[0];
      for (const m of measurements) {
        if (new Date(m.date) < new Date(earliest.date)) earliest = m;
      }
      return earliest.weight;
    } catch (e) {
      return measurements[0].weight;
    }
  };

  // Compute progress for a given goal. Returns { percent, current, initial, target } or null if not computable
  const computeGoalProgress = (g: any) => {
    if (!g || g.target_value == null) return null;
    const target = Number(g.target_value);
    if (isNaN(target)) return null;

    // Weight-based heuristic: unit 'kg' or title mentions poids
    const isWeightGoal = (g.unit && String(g.unit).toLowerCase().includes('kg')) || /poids|weight/i.test(String(g.title || '')) || (g.goal_type === 'weight');

    if (isWeightGoal) {
      // Determine initial (earliest) and current (latest) from measurements by date if available
      let initial: number | null = null;
      let current: number | null = null;
      try {
        const ms = client?.measurements || [];
        if (ms.length > 0) {
          let earliest = ms[0];
          let latest = ms[0];
          for (const m of ms) {
            const d = new Date(m.date);
            if (d < new Date(earliest.date)) earliest = m;
            if (d > new Date(latest.date)) latest = m;
          }
          initial = earliest.weight;
          current = latest.weight;
        }
      } catch (e) {
        // fallback to helper
        initial = getEarliestMeasurementWeight(client?.measurements);
      }

      // Fallbacks
      if (initial == null) initial = client?.currentWeight ?? target;
      if (current == null) current = client?.currentWeight ?? initial;

      // If initial === target, consider progress completed only if current equals target
      if (initial === target) return { percent: current === target ? 100 : 0, current, initial, target };

      // percent formula that works for both loss (target < initial) and gain (target > initial)
      const raw = ((current - initial) / (target - initial)) * 100;
      const percent = Math.round(Math.max(0, Math.min(100, raw)));
      return { percent, current, initial, target };
    }

    // Generic numeric goals: try to derive from measurements if a matching unit/key exists — not implemented yet
    return null;
  };

  // Derive an active weight goal (if any) and progress for the quick cards
  const weightGoal = clientGoals.find((g: any) => (
    (g.unit && String(g.unit).toLowerCase().includes('kg')) || /poids|weight/i.test(String(g.title || '')) || g.goal_type === 'weight'
  ));
  const progressForWeight = weightGoal ? computeGoalProgress(weightGoal) : null;
  // choose latest measurement weight if available for display
  const latestMeasurementWeight = (() => {
    try {
      const ms = client?.measurements || [];
      if (ms.length === 0) return null;
      let latest = ms[0];
      for (const m of ms) if (new Date(m.date) > new Date(latest.date)) latest = m;
      return latest.weight;
    } catch (e) { return null; }
  })();
  // Prioriser la mesure la plus récente, puis le poids actuel
  const currentWeightDisplayed = latestMeasurementWeight ?? client?.currentWeight ?? 0;
  const targetWeightDisplayed = progressForWeight ? progressForWeight.target : (weightGoal ? Number(weightGoal.target_value) : client?.targetWeight ?? 0);
  const weightPercent = (() => {
    if (progressForWeight) return progressForWeight.percent;
    
    if (!currentWeightDisplayed || !targetWeightDisplayed) return 0;
    
    // Calculer la progression basée sur le poids de départ vers l'objectif
    const startWeight = client?.measurements && client.measurements.length > 0 
      ? client.measurements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].weight
      : client?.currentWeight || currentWeightDisplayed;
    
    const totalProgress = targetWeightDisplayed - startWeight;
    const currentProgress = currentWeightDisplayed - startWeight;
    
    if (totalProgress === 0) return currentWeightDisplayed === targetWeightDisplayed ? 100 : 0;
    
    return Math.max(0, Math.min(100, Math.round((currentProgress / totalProgress) * 100)));
  })();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header avec design moderne */}
      <header className="relative w-full px-6 py-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-lg shadow-blue-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard/coach" className="group flex items-center space-x-3 px-4 py-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Dashboard</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <span className="text-white font-bold text-xl">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{client.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      Actif
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-lg">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16m-7-7l7 7-7 7" />
                </svg>
              </button>
              <button className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 hover:shadow-lg hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards modernes */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Poids actuel */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  ACTUEL
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent mb-1">
                {currentWeightDisplayed}kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Poids actuel</div>
            </div>
          </div>

          {/* Objectif */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  CIBLE
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent mb-1">
                {targetWeightDisplayed}kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Objectif</div>
            </div>
          </div>

          {/* Âge */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  PROFIL
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent mb-1">
                {client.age}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">ans</div>
            </div>
          </div>

          {/* Taille */}
          <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100/50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  TAILLE
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-600 bg-clip-text text-transparent mb-1">
                {client.height}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">cm</div>
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="mt-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Progression vers l'objectif
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentWeightDisplayed}kg → {targetWeightDisplayed}kg
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {weightPercent}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {Math.abs(currentWeightDisplayed - targetWeightDisplayed).toFixed(1)}kg restants
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${weightPercent}%` }}
              >
                <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs moderne */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-2 border border-white/20 dark:border-gray-700/30">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 min-w-max">
              {[
                { id: 'overview', name: 'Vue d\'ensemble', icon: '📊', gradient: 'from-blue-500 to-cyan-500' },
                { id: 'workouts', name: 'Entraînements', icon: '💪', gradient: 'from-purple-500 to-pink-500' },
                { id: 'progress', name: 'Évolution', icon: '📈', gradient: 'from-green-500 to-emerald-500' },
                { id: 'programs', name: 'Programmes', icon: '📋', gradient: 'from-orange-500 to-red-500' },
                { id: 'goals', name: 'Objectifs', icon: '🎯', gradient: 'from-indigo-500 to-purple-500' },
                { id: 'personal', name: 'Infos personnelles', icon: '👤', gradient: 'from-pink-500 to-rose-500' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-300 group ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.gradient.split('-')[1]}-500/25 transform scale-105`
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                  )}
                  <span className={`text-lg transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {tab.icon}
                  </span>
                  <span className="relative z-10 font-semibold">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Derniers entraînements */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
              <div className="relative p-6 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Derniers entraînements
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Activité récente</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                    {client.workouts.length} séances
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {client.workouts.slice(0, 3).map((workout) => {
                  // defensive exercises count: sometimes exercises is a number (count) or an array
                  const exercisesCount = Array.isArray(workout.exercises) ? workout.exercises.length : (typeof workout.exercises === 'number' ? workout.exercises : 0);
                  // truncated notes preview
                  const notesPreview = workout.notes ? (String(workout.notes).length > 80 ? String(workout.notes).slice(0, 77) + '...' : String(workout.notes)) : '';

                  return (
                    <div key={workout.id || `${workout.date}-${workout.program}`} className="group relative bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">{workout.program}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                              <span>📅 {new Date(workout.date).toLocaleDateString('fr-FR')}</span>
                              <span>•</span>
                              <span>⏱️ {workout.duration}min</span>
                            </div>
                            {notesPreview && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg">💬 {notesPreview}</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full mb-3">
                            {exercisesCount} exercices
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => {
                              const idx = workoutSessions.findIndex(s => s.id && workout.id && String(s.id) === String(workout.id));
                              setEditingIndex(idx >= 0 ? idx : null);
                              setEditingWorkout(workout);
                            }} className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg hover:scale-105 transition-all duration-200">
                              ✏️ Éditer
                            </button>
                            <button onClick={async () => {
                              if (!confirm('Supprimer cette séance ?')) return;
                              try {
                                if (workout.id) {
                                  const res = await fetch('/api/workout-sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: workout.id }) });
                                  const j = await res.json();
                                  if (!res.ok) {
                                    console.error('Failed to delete session', j);
                                    alert('Impossible de supprimer la séance');
                                    return;
                                  }
                                  setWorkoutSessions(prev => prev.filter(s => String(s.id) !== String(workout.id)));
                                  setClient(prev => prev ? { ...prev, workouts: (prev.workouts || []).filter(w => String(w.id) !== String(workout.id)) } : prev);
                                } else {
                                  setWorkoutSessions(prev => prev.filter(s => !(s.date === workout.date && s.program === workout.program && s.duration === workout.duration)));
                                  setClient(prev => prev ? { ...prev, workouts: (prev.workouts || []).filter(w => !(w.date === workout.date && w.program === workout.program && w.duration === workout.duration)) } : prev);
                                }
                              } catch (e) {
                                console.error('Delete request failed', e);
                                alert('Erreur lors de la suppression');
                              }
                            }} className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg hover:scale-105 transition-all duration-200">
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Programmes actifs */}
            <div className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
              <div className="relative p-6 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Programmes actifs
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Suivi en temps réel</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-purple-100/50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-full">
                    {client.programs.length} programmes
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {client.programs.map((program, index) => (
                  <div key={index} className="group relative bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-700/80 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-orange-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-orange-500/5 rounded-2xl transition-all duration-300"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-lg">{program}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>En cours</span>
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-600 dark:text-purple-400 font-semibold rounded-xl border border-purple-200/50 dark:border-purple-600/30 hover:scale-105 transition-all duration-200">
                        ⚙️ Modifier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed per-workout exercises view removed — keep scheduled sessions and history below */}

        {activeTab === 'workouts' && (
          <div className="space-y-6">
            {/* Séances programmées cette semaine */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📅 Séances programmées</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Filtrer par semaine</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => {
                      const prev = new Date(selectedWeekStart);
                      prev.setDate(prev.getDate() - 7);
                      setSelectedWeekStart(prev);
                    }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">← Semaine précédente</button>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {(() => { const start = selectedWeekStart; const end = new Date(start); end.setDate(start.getDate() + 6); return `${start.toLocaleDateString('fr-FR')} — ${end.toLocaleDateString('fr-FR')}` })()}
                    </div>
                    <button onClick={() => {
                      const next = new Date(selectedWeekStart);
                      next.setDate(next.getDate() + 7);
                      setSelectedWeekStart(next);
                    }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">Semaine suivante →</button>
                  </div>
                </div>
              <div className="p-6">
                {programDetails && programDetails.length > 0 ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Afficher le programme :</div>
                      <select
                        value={selectedProgramIndex}
                        onChange={(e) => setSelectedProgramIndex(parseInt(e.target.value))}
                        className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {programDetails.map((p, i) => (
                          <option key={p.id || i} value={i}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {(() => {
                        const prog = programDetails[selectedProgramIndex];
                        const days = prog?.program_days || [];
                        const daysOfWeek = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
                        return daysOfWeek.map((dayName, idx) => {
                          const dayObj = days.find(d => d.day_of_week === idx+1);
                          const workouts = dayObj?.workouts || [];
                          const isRest = dayObj ? !!dayObj.is_rest_day : true;
                          const date = new Date(selectedWeekStart);
                          date.setDate(selectedWeekStart.getDate() + idx);
                          const isToday = new Date().toDateString() === date.toDateString();
                          return (
                            <div key={dayName} className={`p-4 rounded-lg border-2 ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-medium ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                  {dayName} {isToday && '(Aujourd\'hui)'}
                                </h4>
                                <div className={`w-3 h-3 rounded-full ${isToday ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                              </div>
                              {isRest ? (
                                <div className="text-center py-4">
                                  <div className="text-2xl mb-2">🧘‍♂️</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Jour de repos</div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {workouts.length === 0 ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Aucune séance programmée</div>
                                  ) : (
                                    workouts.map((w, wi) => (
                                      <div
                                        key={wi}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                          // Open edit modal prefilled with this scheduled session
                                          const dateIso = date.toISOString().split('T')[0];
                                          const wAny: any = w;
                                          setEditingWorkout({
                                            id: null,
                                            date: dateIso,
                                            program: wAny.name,
                                            duration: wAny.estimated_duration || 60,
                                            exercises: (wAny.workout_exercises && wAny.workout_exercises.length) || wAny.exercises_count || 0,
                                            status: 'completed',
                                            notes: ''
                                          });
                                          setEditingIndex(null);
                                        }}
                                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:shadow-md"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium text-gray-900 dark:text-white">{w.name}</div>
                                          <div className="text-sm text-gray-600 dark:text-gray-400">{w.time_slot || ''} • {w.estimated_duration || 0} min</div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="font-medium text-gray-900 dark:text-white">{day}</div>
                        <div className="text-gray-500 dark:text-gray-400">Aucune séance programmée</div>
                      </div>
                    ))}
                  </div>
                )}
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
                    programs={client.programs}
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
                        <div className="text-right space-y-2">
                          {session.status === 'completed' ? (
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              ✓ {session.duration} min
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">
                              ✗ Non effectuée
                            </div>
                          )}
                          <div>
                            <button onClick={() => { setEditingIndex(index); setEditingWorkout(session); }} className="text-sm text-blue-600 hover:underline mr-3">Éditer</button>
                            <button onClick={async () => {
                              if (!confirm('Supprimer cette séance ?')) return;
                              try {
                                const res = await fetch('/api/workout-sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: session.id }) });
                                const j = await res.json();
                                if (!res.ok) {
                                  console.error('Failed to delete session', j);
                                  alert('Impossible de supprimer la séance');
                                  return;
                                }
                                // remove from UI
                                setWorkoutSessions(prev => prev.filter((_, i) => i !== index && _.id !== session.id));
                              } catch (e) {
                                console.error('Delete request failed', e);
                                alert('Erreur lors de la suppression');
                              }
                            }} className="text-sm text-red-600 hover:underline">Supprimer</button>
                          </div>
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
              <div className="lg:col-span-2">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 overflow-hidden mb-6">
                  <div className="p-6 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                      📈 Statistiques d'entraînement
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Performance globale du client</p>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Assiduité */}
                    <div className="group relative bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            ASSIDUITÉ
                          </div>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                          {Math.round((workoutSessions.filter(s => s.status === 'completed').length / workoutSessions.length) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Taux de réalisation</div>
                        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((workoutSessions.filter(s => s.status === 'completed').length / workoutSessions.length) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Séances réalisées */}
                    <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                            SÉANCES
                          </div>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                          {workoutSessions.filter(s => s.status === 'completed').length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Réalisées</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          sur {workoutSessions.length} programmées
                        </div>
                      </div>
                    </div>

                    {/* Durée moyenne */}
                    <div className="group relative bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                            DURÉE
                          </div>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                          {workoutSessions.filter(s => s.status === 'completed').length > 0 
                            ? Math.round(workoutSessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0) / workoutSessions.filter(s => s.status === 'completed').length)
                            : 0}
                          <span className="text-lg">min</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Moyenne par séance</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Total: {Math.round(workoutSessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.duration, 0) / 60)}h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'personal' && (
          <PersonalInfoTab client={client} setClient={setClient} />
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
                {client.measurements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📏</div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune mesure enregistrée</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Commencez par ajouter les mesures de votre client pour suivre son évolution
                    </p>
                    <button 
                      onClick={() => setAddingMeasurement(true)}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Ajouter la première mesure
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {client.measurements.map((measurement, index) => {
                      const previousMeasurement = index < client.measurements.length - 1 ? client.measurements[index + 1] : null;
                      const weightChange = previousMeasurement ? measurement.weight - previousMeasurement.weight : 0;
                      const isLatest = index === 0;
                      
                      return (
                        <div key={index} className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                          isLatest 
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700 shadow-md' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700'
                        }`}>
                          
                          {/* Badge "Dernière mesure" */}
                          {isLatest && (
                            <div className="absolute -top-3 left-6">
                              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-lg">
                                Dernière mesure
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            {/* Informations principales */}
                            <div className="flex items-center space-x-6">
                              {/* Icône et date */}
                              <div className="flex items-center space-x-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                  isLatest 
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}>
                                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="font-bold text-xl text-gray-900 dark:text-white">
                                    {new Date(measurement.date).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(new Date(measurement.date))}
                                  </div>
                                </div>
                              </div>

                              {/* Métriques */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Poids */}
                                <div className="text-center">
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Poids</div>
                                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {measurement.weight}kg
                                  </div>
                                  {previousMeasurement && (
                                    <div className={`text-sm font-medium flex items-center justify-center mt-1 ${
                                      weightChange > 0 ? 'text-red-600 dark:text-red-400' :
                                      weightChange < 0 ? 'text-green-600 dark:text-green-400' :
                                      'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {weightChange > 0 ? '↗' : weightChange < 0 ? '↘' : '→'}
                                      <span className="ml-1">{Math.abs(weightChange).toFixed(1)}kg</span>
                                    </div>
                                  )}
                                </div>

                                {/* Masse grasse */}
                                {measurement.bodyFat && (
                                  <div className="text-center">
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Masse grasse</div>
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                      {measurement.bodyFat}%
                                    </div>
                                  </div>
                                )}

                                {/* Masse musculaire */}
                                {measurement.muscle && (
                                  <div className="text-center">
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Masse musculaire</div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                      {measurement.muscle}kg
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-end space-y-2">
                              <button 
                                onClick={() => setDeletingMeasurementDate(measurement.date)} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                🗑️ Supprimer
                              </button>
                              
                              {/* Temps écoulé */}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {(() => {
                                  const days = Math.floor((new Date().getTime() - new Date(measurement.date).getTime()) / (1000 * 60 * 60 * 24));
                                  if (days === 0) return "Aujourd'hui";
                                  if (days === 1) return "Hier";
                                  if (days < 7) return `Il y a ${days} jours`;
                                  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
                                  return `Il y a ${Math.floor(days / 30)} mois`;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Statistiques globales */}
                    {client.measurements.length >= 2 && (
                      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Statistiques globales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Évolution totale</div>
                            <div className={`text-2xl font-bold ${
                              client.measurements[0].weight < client.measurements[client.measurements.length - 1].weight
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {client.measurements[0].weight < client.measurements[client.measurements.length - 1].weight ? '↘' : '↗'}
                              {Math.abs(client.measurements[0].weight - client.measurements[client.measurements.length - 1].weight).toFixed(1)}kg
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Poids minimum</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {Math.min(...client.measurements.map(m => m.weight)).toFixed(1)}kg
                            </div>
                          </div>
                          
                          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Poids maximum</div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {Math.max(...client.measurements.map(m => m.weight)).toFixed(1)}kg
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Goals progress block */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progression des objectifs</h3>
                <div className="text-sm text-gray-500">Mis à jour automatiquement</div>
              </div>
              <div className="p-6 space-y-4">
                {clientGoals.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucun objectif configuré pour ce client.</div>
                ) : (
                  clientGoals.map((g) => {
                    const p = computeGoalProgress(g);
                    return (
                      <div key={g.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{g.title}</div>
                            <div className="text-xs text-gray-500">Cible: {g.target_value}{g.unit ? ` ${g.unit}` : ''}{g.deadline ? ` • date limite: ${new Date(g.deadline).toLocaleDateString('fr-FR')}` : ''}</div>
                          </div>
                          <div className="text-right">
                            {p ? (
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{p.percent}%</div>
                            ) : (
                              <div className="text-sm text-gray-500">Pas de métrique</div>
                            )}
                          </div>
                        </div>
                        {p ? (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all" style={{ width: `${p.percent}%` }}></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Départ: {p.initial} • Actuel: {p.current} • Cible: {p.target}</div>
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-gray-500">Impossible de calculer la progression pour cet objectif automatiquement.</div>
                        )}
                      </div>
                    )
                  })
                )}
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
                        console.log('Modifier button clicked for program:', program);
                        console.log('Client ID:', client?.id);
                        
                        if (!client?.id) {
                          console.error('No client ID available');
                          return;
                        }
                        
                        try {
                          console.log('Loading program details from database...');
                          // Récupérer les programmes complets du client
                          const programs = await dataService.getClientPrograms(client.id);
                          console.log('Programs loaded:', programs);
                          
                          // Trouver le programme par nom
                          const fullProgram = programs.find((p: any) => p.name === program);
                          
                          if (fullProgram) {
                            console.log('Found full program data:', fullProgram);
                            setEditingProgram(fullProgram);
                          } else {
                            console.warn('Program not found in database, using fallback');
                            // Fallback avec les données minimales
                            const programToEdit = { 
                              name: program,
                              client_id: client.id,
                              coach_id: userProfile?.id 
                            };
                            setEditingProgram(programToEdit);
                          }
                        } catch (error) {
                          console.error('Error loading program details:', error);
                          // Fallback en cas d'erreur
                          const programToEdit = { 
                            name: program,
                            client_id: client.id,
                            coach_id: userProfile?.id 
                          };
                          setEditingProgram(programToEdit);
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
                    onClick={() => {
                      // If a weightGoal exists, prefill value from it, otherwise from client's targetWeight
                      const wg = weightGoal;
                      if (wg && wg.target_value != null) {
                        setGoalValue(String(wg.target_value));
                        setEditingGoal(wg);
                      } else {
                        setGoalValue(String(client?.targetWeight || ''));
                        setEditingGoal(null);
                      }
                      setCreatingGoal(true);
                      setMessage(null);
                    }}
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
                          <span className="font-medium text-gray-900 dark:text-white">{currentWeightDisplayed}kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Objectif</span>
                          <span className="font-medium text-gray-900 dark:text-white">{targetWeightDisplayed}kg</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${weightPercent}%`
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

                {/* Goals list header */}
                <div className="mt-6 flex items-center justify-between">
                  <h4 className="text-md font-semibold">Objectifs du client</h4>
                  <div>
                    <button onClick={() => { setEditingGoal(null); setShowNewGoal(true); setMessage(null); }} className="px-3 py-1 bg-green-600 text-white rounded">+ Ajouter objectif</button>
                  </div>
                </div>
                <div className="mt-3">
                  {clientGoals.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucun objectif pour le moment</div>
                  ) : (
                    <div className="space-y-3">
                      {clientGoals.map((g) => (
                        <div key={g.id} className="p-3 bg-white dark:bg-gray-800 border rounded flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{g.title} {g.target_value ? `— ${g.target_value}${g.unit ? ' ' + g.unit : ''}` : ''}</div>
                            {g.deadline && <div className="text-xs text-gray-500">Deadline: {new Date(g.deadline).toLocaleDateString('fr-FR')}</div>}
                            {g.notes && <div className="text-sm text-gray-600 mt-1">{g.notes}</div>}
                          </div>
                          <div className="text-right space-y-2">
                            <button onClick={() => { setEditingGoal(g); setShowNewGoal(true); setMessage(null); }} className="text-sm text-blue-600 hover:underline mr-2">Éditer</button>
                            <button onClick={() => { setDeletingGoalId(g.id); setMessage(null); }} className="text-sm text-red-600 hover:underline">Supprimer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Goal modal */}
      {creatingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Définir l'objectif de poids</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Objectif (kg)</label>
                <input type="number" step="0.1" value={goalValue} onChange={(e) => setGoalValue(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setCreatingGoal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                <button onClick={async () => {
                  const parsed = parseFloat(goalValue);
                  if (isNaN(parsed) || parsed <= 0) { setMessage({ type: 'error', text: 'Entrez un poids valide' }); return; }
                  // First, update the client's target_weight (keep existing behavior)
                  try {
                    const updated = await dataService.updateClient(client!.id, { target_weight: parsed });
                    setClient(prev => prev ? { ...prev, targetWeight: updated.target_weight || parsed } : prev);
                  } catch (e) {
                    console.error('Failed to update client target_weight', e);
                    setMessage({ type: 'error', text: 'Impossible de mettre à jour l\'objectif sur le client' });
                    // continue to try to persist goal row
                  }

                  // Then create or update a weight goal in client_goals so the Goals system and Progress stay in sync
                  try {
                    if (weightGoal && weightGoal.id) {
                      const res = await fetch('/api/client-goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', payload: { id: weightGoal.id, target_value: parsed, unit: 'kg', coach_id: userProfile!.id } }) });
                      const j = await res.json();
                      if (!res.ok) { throw j; }
                      setClientGoals(prev => prev.map(g => g.id === j.data.id ? j.data : g));
                    } else {
                      const payload: any = { client_id: client!.id, coach_id: userProfile!.id, title: 'Objectif de poids', goal_type: 'weight', target_value: parsed, unit: 'kg', status: 'active' };
                      const res = await fetch('/api/client-goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', payload }) });
                      const j = await res.json();
                      if (!res.ok) { throw j; }
                      setClientGoals(prev => [j.data, ...prev]);
                    }
                    setMessage({ type: 'success', text: 'Objectif de poids enregistré' });
                    setCreatingGoal(false);
                  } catch (e) {
                    console.error('Failed to create/update weight goal', e);
                    setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde de l\'objectif' });
                    // keep the modal open so the coach can retry
                  }
                }} className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Goals Manager Modal (create/edit) */}
      {showNewGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingGoal ? 'Modifier l\'objectif' : 'Nouveau objectif'}</h3>
            {message && (
              <div className={`p-3 rounded mb-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                {message.text}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                <input value={editingGoal?.title || ''} onChange={(e) => setEditingGoal((prev:any) => ({ ...(prev||{}), title: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Valeur cible</label>
                  <input type="number" value={editingGoal?.target_value ?? ''} onChange={(e) => setEditingGoal((prev:any) => ({ ...(prev||{}), target_value: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Unité</label>
                  <input value={editingGoal?.unit || ''} onChange={(e) => setEditingGoal((prev:any) => ({ ...(prev||{}), unit: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                <input type="date" value={editingGoal?.deadline ? new Date(editingGoal.deadline).toISOString().split('T')[0] : ''} onChange={(e) => setEditingGoal((prev:any) => ({ ...(prev||{}), deadline: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={editingGoal?.notes || ''} onChange={(e) => setEditingGoal((prev:any) => ({ ...(prev||{}), notes: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" rows={3}></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => { setShowNewGoal(false); setEditingGoal(null); setMessage(null); }} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                <button onClick={async () => {
                  // Validate
                  if (!editingGoal || !editingGoal.title || String(editingGoal.title).trim() === '') { setMessage({ type: 'error', text: 'Le titre est requis' }); return; }
                  try {
                    if (editingGoal.id) {
                      // update
                      const res = await fetch('/api/client-goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', payload: { ...editingGoal, coach_id: userProfile!.id } }) });
                      const j = await res.json();
                      if (!res.ok) { setMessage({ type: 'error', text: 'Erreur mise à jour' }); return; }
                      setClientGoals(prev => prev.map(g => g.id === j.data.id ? j.data : g));
                      setMessage({ type: 'success', text: 'Objectif mis à jour' });
                    } else {
                      // create
                      const payload: any = { ...editingGoal, client_id: client!.id, coach_id: userProfile!.id, goal_type: editingGoal.goal_type || 'custom' };
                      const res = await fetch('/api/client-goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', payload }) });
                      const j = await res.json();
                      if (!res.ok) { setMessage({ type: 'error', text: 'Erreur création' }); return; }
                      setClientGoals(prev => [j.data, ...prev]);
                      setMessage({ type: 'success', text: 'Objectif créé' });
                    }
                    // close after short delay
                    setTimeout(() => { setShowNewGoal(false); setEditingGoal(null); setMessage(null); }, 800);
                  } catch (e) {
                    console.error('Goal save error', e);
                    setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
                  }
                }} className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirmer la suppression</h3>
            <p className="mb-4">Voulez-vous vraiment supprimer cet objectif ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletingGoalId(null)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
              <button onClick={async () => {
                try {
                  const res = await fetch('/api/client-goals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deletingGoalId, coach_id: userProfile!.id }) });
                  const j = await res.json();
                  if (!res.ok) { console.error('Delete failed', j); setMessage({ type: 'error', text: 'Impossible de supprimer' }); return; }
                  setClientGoals(prev => prev.filter(g => g.id !== deletingGoalId));
                  setMessage({ type: 'success', text: 'Objectif supprimé' });
                  setDeletingGoalId(null);
                } catch (e) {
                  console.error('Delete goal error', e);
                  setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
                }
              }} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* Program create/edit modal */}
      {(creatingProgram || editingProgram) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProgram ? 'Modifier le programme' : 'Créer un programme'}
              </h3>
              <button 
                onClick={() => { setEditingProgram(null); setCreatingProgram(false); }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
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
      {/* Edit Workout Modal (local state) */}
      {editingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Éditer séance</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={editingWorkout?.date ? new Date(editingWorkout.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingWorkout((prev:any)=> ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Programme</label>
                <input value={editingWorkout.program} onChange={(e) => setEditingWorkout((prev:any)=> ({ ...prev, program: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Durée (min)</label>
                  <input type="number" value={editingWorkout.duration} onChange={(e) => setEditingWorkout((prev:any)=> ({ ...prev, duration: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Exercices (#)</label>
                  <input type="number" value={editingWorkout?.exercises ?? 0} onChange={(e) => setEditingWorkout((prev:any)=> ({ ...prev, exercises: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <select value={editingWorkout.status} onChange={(e) => setEditingWorkout((prev:any)=> ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900">
                  <option value="completed">✓ Séance réalisée</option>
                  <option value="missed">✗ Séance manquée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={editingWorkout.notes || ''} onChange={(e) => setEditingWorkout((prev:any)=> ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900" rows={3}></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => { setEditingWorkout(null); setEditingIndex(null); }} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                <button onClick={async () => {
                  console.log('[ClientDetail] Saving workout from modal, editingWorkout:', editingWorkout, 'editingIndex:', editingIndex);
                  // Persist to DB when possible
                  try {
                    if (!editingWorkout) {
                      alert('Aucune donnée de séance à sauvegarder.');
                      return;
                    }
                    if (!editingWorkout.date) {
                      alert('La date est requise');
                      return;
                    }
                    // Build payload for DB
                    const payload: any = {
                      client_id: client!.id,
                      date: editingWorkout.date,
                      duration_minutes: editingWorkout.duration || 0,
                      program_name: editingWorkout.program,
                      exercises_count: editingWorkout.exercises ?? 0,
                      status: editingWorkout.status || 'completed',
                      notes: editingWorkout.notes || ''
                    };

                    // If editing an existing persisted workout (id not local-...), update
                    try {
                      // Prefer server API that uses service-role key
                      const apiRes = await fetch('/api/workout-sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: editingWorkout.id && !String(editingWorkout.id).startsWith('local-') ? 'update' : 'create', payload: editingWorkout.id && !String(editingWorkout.id).startsWith('local-') ? { id: editingWorkout.id, ...payload } : payload })
                      });
                      const json = await apiRes.json();
                      if (apiRes.ok && json.data) {
                        const created = json.data;
                        const newSession = {
                          id: created.id,
                          date: created.date,
                          program: created.program_name || created.program || editingWorkout.program,
                          duration: created.duration_minutes || editingWorkout.duration || 0,
                          exercises: created.exercises_count || editingWorkout.exercises || 0,
                          notes: created.notes || editingWorkout.notes || '',
                          status: created.status || editingWorkout.status || 'completed'
                        };
                        if (editingWorkout.id && !String(editingWorkout.id).startsWith('local-')) {
                          // Persisted session: replace by id
                          setWorkoutSessions(prev => prev.map(s => s.id === newSession.id ? newSession : s));
                        } else if (editingIndex != null) {
                          // We were editing a local or newly-created entry in the list: replace at the same index
                          setWorkoutSessions(prev => {
                            const copy = [...prev];
                            copy[editingIndex] = newSession;
                            return copy;
                          });
                        } else {
                          // New session: prepend
                          setWorkoutSessions(prev => [newSession, ...prev]);
                        }
                      } else {
                        // fallback to local and show error
                        const errMsg = json?.error || 'unknown error';
                        console.error('API error creating/updating workout session', errMsg, json);
                        const fallback = {
                          id: editingWorkout.id || `local-${Date.now()}`,
                          date: editingWorkout.date,
                          program: editingWorkout.program,
                          duration: editingWorkout.duration || 0,
                          exercises: editingWorkout.exercises ?? 0,
                          notes: editingWorkout.notes || '',
                          status: editingWorkout.status || 'completed'
                        };
                        if (editingIndex != null) {
                          setWorkoutSessions(prev => {
                            const copy = [...prev];
                            copy[editingIndex] = fallback;
                            return copy;
                          });
                        } else {
                          setWorkoutSessions(prev => [fallback, ...prev]);
                        }
                        alert('La séance a été ajoutée localement mais la sauvegarde serveur a échoué. Vérifiez la configuration du service-role.');
                      }
                    } catch (apiErr) {
                      console.error('Failed to call server API for workout session', apiErr);
                      const fallback = {
                        id: editingWorkout.id || `local-${Date.now()}`,
                        date: editingWorkout.date,
                        program: editingWorkout.program,
                        duration: editingWorkout.duration || 0,
                        exercises: editingWorkout.exercises ?? 0,
                        notes: editingWorkout.notes || '',
                        status: editingWorkout.status || 'completed'
                      };
                      if (editingIndex != null) {
                        setWorkoutSessions(prev => {
                          const copy = [...prev];
                          copy[editingIndex] = fallback;
                          return copy;
                        });
                      } else {
                        setWorkoutSessions(prev => [fallback, ...prev]);
                      }
                      alert('La séance a été ajoutée localement mais la sauvegarde a échoué (API indisponible).');
                    }
                  } finally {
                    setEditingWorkout(null);
                    setEditingIndex(null);
                  }
                }} className="px-4 py-2 bg-blue-600 text-white rounded">Sauvegarder</button>
              </div>
            </div>
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
              onSaved={(newMeasurement: any) => {
                // Fermer le modal immédiatement
                setAddingMeasurement(false);
                
                // Ajouter ou mettre à jour la mesure dans la liste locale
                if (newMeasurement) {
                  const mappedMeasurement = {
                    date: newMeasurement.date,
                    weight: newMeasurement.weight,
                    bodyFat: newMeasurement.body_fat,
                    muscle: newMeasurement.muscle_mass
                  };
                  
                  setClient(prev => {
                    if (!prev) return prev;
                    
                    // Vérifier si une mesure existe déjà pour cette date
                    const existingIndex = prev.measurements.findIndex(m => m.date === mappedMeasurement.date);
                    
                    if (existingIndex >= 0) {
                      // Mettre à jour la mesure existante
                      const updatedMeasurements = [...prev.measurements];
                      updatedMeasurements[existingIndex] = mappedMeasurement;
                      return { ...prev, measurements: updatedMeasurements };
                    } else {
                      // Ajouter la nouvelle mesure en début de liste et trier par date décroissante
                      const updatedMeasurements = [mappedMeasurement, ...prev.measurements]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                      return { ...prev, measurements: updatedMeasurements };
                    }
                  });
                }
              }}
            />
          </div>
        </div>
      )}
      {/* Delete measurement confirmation modal */}
      {deletingMeasurementDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Supprimer la mesure</h3>
            <p className="mb-4">Voulez-vous vraiment supprimer la mesure du <strong>{new Date(deletingMeasurementDate).toLocaleDateString('fr-FR')}</strong> ?</p>
            {message && <div className={`p-3 rounded mb-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{message.text}</div>}
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setDeletingMeasurementDate(null); setMessage(null); }} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
              <button onClick={async () => {
                try {
                  // delete by client_id + date
                  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
                  const supabase = createClientComponentClient();
                  const { error } = await supabase.from('measurements').delete().match({ client_id: client!.id, date: deletingMeasurementDate });
                  if (error) {
                    console.error('Supabase delete error', error);
                    setMessage({ type: 'error', text: 'Impossible de supprimer la mesure' });
                    return;
                  }
                  // reload measurements
                  try {
                    const re = await dataService.getClientDetail(client!.id);
                    const mappedMeasurements = (re.measurements || []).map((m: any) => ({ date: m.date, weight: typeof m.weight === 'number' ? m.weight : parseFloat(m.weight), bodyFat: typeof m.body_fat === 'number' ? m.body_fat : (m.body_fat != null ? parseFloat(m.body_fat) : undefined), muscle: typeof m.muscle_mass === 'number' ? m.muscle_mass : (m.muscle_mass != null ? parseFloat(m.muscle_mass) : undefined) }));
                    setClient(prev => prev ? { ...prev, measurements: mappedMeasurements } : prev);
                    setMessage({ type: 'success', text: 'Mesure supprimée' });
                    setDeletingMeasurementDate(null);
                  } catch (e) {
                    console.error('Reload after delete failed', e);
                    setMessage({ type: 'error', text: 'Mesure supprimée (échec actualisation UI)' });
                    setDeletingMeasurementDate(null);
                  }
                } catch (e) {
                  console.error('Delete measurement failed', e);
                  setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
                }
              }} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
            </div>
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
  onSaved: (measurement?: any) => void;
}

function MeasurementForm({ clientId, onCancel, onSaved }: MeasurementFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscleMass] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    
    if (!weight.trim()) {
      setError('Le poids est requis');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Veuillez entrer un poids valide');
      return;
    }

    setIsSaving(true);
    try {
      console.log('MeasurementForm handleSave - clientId:', clientId);
      console.log('MeasurementForm handleSave - form values:', { date, weight, bodyFat, muscle });
      
      const measurementData = {
        client_id: clientId,
        date,
        weight: weightNum,
        body_fat: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscle ? parseFloat(muscle) : null
      };

      console.log('Sending measurement data:', measurementData);
      
      // Utiliser le service de données
      const result = await dataService.addClientMeasurement(measurementData);
      console.log('Measurement added successfully:', result);
      
      // Créer l'objet mesure pour l'état local
      const newMeasurement = {
        date: measurementData.date,
        weight: measurementData.weight,
        body_fat: measurementData.body_fat,
        muscle_mass: measurementData.muscle_mass
      };
      
      // Appeler onSaved avec la nouvelle mesure pour l'ajouter à la liste locale
      onSaved(newMeasurement);
    } catch (e: any) {
      console.error('Measurement save failed');
      console.error('Error details:', e);
      console.error('Error message:', e?.message);
      console.error('Error code:', e?.code);
      console.error('Full error object:', JSON.stringify(e, null, 2));
      
      let errorMessage = `Erreur lors de la sauvegarde de la mesure: ${e?.message || 'Erreur inconnue'}`;
      if (e?.message && (e.message.includes('duplicate key') || e.message.includes('unique constraint'))) {
        // Créer l'objet mesure mise à jour pour l'état local
        const updatedMeasurement = {
          date: date,
          weight: weightNum,
          body_fat: bodyFat ? parseFloat(bodyFat) : null,
          muscle_mass: muscle ? parseFloat(muscle) : null
        };
        // Considérer comme un succès et retourner la mesure mise à jour
        onSaved(updatedMeasurement);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
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
  programs?: string[];
}

function WorkoutForm({ clientId, onCancel, onSaved, programs }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // if programs are passed, default to the first program
  const [program, setProgram] = useState<string>('');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState('');
  const [status, setStatus] = useState<'completed' | 'missed'>('completed');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // If programs are provided and no program selected yet, default to first
    if (programs && programs.length > 0 && !program) {
      setProgram(programs[0]);
    }
  }, [programs]);

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
        {programs && programs.length > 0 ? (
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un programme...</option>
            {programs.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        ) : (
          <input 
            type="text"
            value={program} 
            onChange={(e) => setProgram(e.target.value)} 
            placeholder="Ex: Pectoraux/Triceps, Jambes, Cardio..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        )}
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

// Composant pour l'onglet informations personnelles
interface PersonalInfoTabProps {
  client: Client;
  setClient: (client: Client) => void;
}

function PersonalInfoTab({ client, setClient }: PersonalInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculer le poids actuel en priorisant la mesure la plus récente
  const getCurrentWeight = () => {
    try {
      const ms = client?.measurements || [];
      if (ms.length === 0) return client.currentWeight || 0;
      let latest = ms[0];
      for (const m of ms) {
        if (new Date(m.date) > new Date(latest.date)) latest = m;
      }
      return latest.weight || client.currentWeight || 0;
    } catch (e) {
      return client.currentWeight || 0;
    }
  };
  
  const currentWeight = getCurrentWeight();
  
  const [editForm, setEditForm] = useState({
    name: client.name || '',
    email: client.email || '',
    age: client.age || '',
    height: client.height || '',
    current_weight: currentWeight || '',
    target_weight: client.targetWeight || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder dans la base de données
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      const clientUpdateData = {
        name: editForm.name,
        email: editForm.email,
        age: Number(editForm.age) || null,
        height: Number(editForm.height) || null,
        current_weight: Number(editForm.current_weight) || null,
        target_weight: Number(editForm.target_weight) || null
      };
      
      // Mettre à jour le client dans la base de données
      const { error: clientError } = await supabase
        .from('clients')
        .update(clientUpdateData)
        .eq('id', client.id);
        
      if (clientError) {
        console.error('Error updating client:', clientError);
        throw clientError;
      }
      
      const updatedClient = {
        ...client,
        name: editForm.name,
        email: editForm.email,
        age: Number(editForm.age) || 0,
        height: Number(editForm.height) || 0,
        currentWeight: Number(editForm.current_weight) || 0,
        targetWeight: Number(editForm.target_weight) || 0
      };
      
      // Si le poids a changé, on ajoute une nouvelle mesure
      const currentWeight = Number(editForm.current_weight);
      const previousWeight = client.currentWeight;
      
      if (currentWeight && currentWeight !== previousWeight) {
        try {
          const measurementData = {
            client_id: client.id,
            date: new Date().toISOString().split('T')[0], // Date du jour
            weight: currentWeight
          };
          
          await supabase
            .from('measurements')
            .upsert(measurementData, { onConflict: 'client_id,date' });
          
          // Recharger les mesures pour mettre à jour l'affichage
          const updatedData = await dataService.getClientDetail(client.id);
          const mappedMeasurements = (updatedData.measurements || []).map((m: any) => ({ 
            date: m.date, 
            weight: typeof m.weight === 'number' ? m.weight : parseFloat(m.weight), 
            bodyFat: typeof m.body_fat === 'number' ? m.body_fat : (m.body_fat != null ? parseFloat(m.body_fat) : undefined), 
            muscle: typeof m.muscle_mass === 'number' ? m.muscle_mass : (m.muscle_mass != null ? parseFloat(m.muscle_mass) : undefined)
          }));
          
          updatedClient.measurements = mappedMeasurements;
        } catch (measurementError) {
          console.error('Error adding measurement:', measurementError);
          // On continue malgré l'erreur de mesure
        }
      }
      
      setClient(updatedClient);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving client info:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateBMI = () => {
    if (currentWeight && client.height) {
      const heightInMeters = client.height / 100;
      const bmi = currentWeight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const getBMICategory = (bmi: string) => {
    if (bmi === 'N/A') return { text: 'Non calculable', color: 'text-gray-500' };
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { text: 'Maigreur', color: 'text-blue-600' };
    if (bmiValue < 25) return { text: 'Normal', color: 'text-green-600' };
    if (bmiValue < 30) return { text: 'Surpoids', color: 'text-yellow-600' };
    return { text: 'Obésité', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="space-y-6">
      {/* En-tête avec photo et actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              👤 Informations personnelles
            </h3>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                ✏️ Modifier
              </button>
            ) : (
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      name: client.name || '',
                      email: client.email || '',
                      age: client.age || '',
                      height: client.height || '',
                      current_weight: currentWeight || '',
                      target_weight: client.targetWeight || ''
                    });
                  }}
                  className="px-3 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Photo de profil */}
          <div className="flex items-start space-x-6 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-bold text-2xl">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Changer la photo
              </button>
            </div>
            
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {client.name}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-1">{client.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Client depuis le {new Date(client.joinedDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              // Mode édition
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet
                  </label>
                  <input 
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input 
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Âge (années)
                  </label>
                  <input 
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taille (cm)
                  </label>
                  <input 
                    type="number"
                    value={editForm.height}
                    onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Poids actuel (kg)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={editForm.current_weight}
                    onChange={(e) => setEditForm({...editForm, current_weight: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Poids objectif (kg)
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    value={editForm.target_weight}
                    onChange={(e) => setEditForm({...editForm, target_weight: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            ) : (
              // Mode affichage
              <>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🎂</span>
                    <h5 className="font-medium text-gray-900 dark:text-white">Âge</h5>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {client.age || 'Non renseigné'} {client.age && 'ans'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">📏</span>
                    <h5 className="font-medium text-gray-900 dark:text-white">Taille</h5>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {client.height || 'Non renseigné'} {client.height && 'cm'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">⚖️</span>
                    <h5 className="font-medium text-gray-900 dark:text-white">Poids actuel</h5>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentWeight || 'Non renseigné'} {currentWeight && 'kg'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🎯</span>
                    <h5 className="font-medium text-gray-900 dark:text-white">Objectif poids</h5>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {client.targetWeight || 'Non renseigné'} {client.targetWeight && 'kg'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Indicateurs de santé */}
          {!isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-900 dark:text-white mb-4">📊 Indicateurs de santé</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">IMC</span>
                    <span className="text-2xl">🏥</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{bmi}</p>
                  <p className={`text-sm ${bmiCategory.color}`}>{bmiCategory.text}</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Objectif</span>
                    <span className="text-2xl">📈</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {currentWeight && client.targetWeight 
                      ? `${currentWeight > client.targetWeight ? '-' : '+'}${Math.abs(currentWeight - client.targetWeight)}kg`
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {currentWeight && client.targetWeight 
                      ? (currentWeight > client.targetWeight ? 'À perdre' : 'À gagner')
                      : 'Non défini'
                    }
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Progression</span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {(() => {
                      if (!currentWeight || !client.targetWeight) return 'N/A';
                      
                      // Poids de départ : première mesure ou poids initial du profil
                      const startWeight = client.measurements && client.measurements.length > 0 
                        ? client.measurements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].weight
                        : currentWeight;
                      
                      // Progression actuelle = (poids actuel - poids de départ) / (objectif - poids de départ) * 100
                      const totalProgress = client.targetWeight - startWeight;
                      const currentProgress = currentWeight - startWeight;
                      const percentage = totalProgress !== 0 ? Math.round((currentProgress / totalProgress) * 100) : 0;
                      
                      return `${Math.max(0, Math.min(100, percentage))}%`;
                    })()}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Vers l'objectif</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


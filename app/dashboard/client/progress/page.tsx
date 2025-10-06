'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Measurement {
  date: string;
  weight: number;
  bodyFat?: number;
  musclemass?: number;
  notes?: string;
}

interface WorkoutProgress {
  exercise: string;
  previousWeight: number;
  currentWeight: number;
  previousReps: number;
  currentReps: number;
  improvement: number; // en pourcentage
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  achieved: boolean;
}

export default function ClientProgress() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState('measurements');
  const [isLoading, setIsLoading] = useState(true);
  const [newMeasurement, setNewMeasurement] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    bodyFat: '',
    musclePass: '',
    notes: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simulation de données de progression
    const mockMeasurements: Measurement[] = [
      { date: '2024-10-01', weight: 70.2, bodyFat: 15, musclemass: 55, notes: 'Bon progrès ce mois-ci' },
      { date: '2024-09-15', weight: 69.8, bodyFat: 16, musclemass: 54 },
      { date: '2024-09-01', weight: 69.5, bodyFat: 16.5, musclemass: 53.5 },
      { date: '2024-08-15', weight: 69.0, bodyFat: 17, musclemass: 53 },
      { date: '2024-08-01', weight: 68.5, bodyFat: 17.5, musclemass: 52.5 },
      { date: '2024-07-15', weight: 68.0, bodyFat: 18, musclemass: 52 }
    ];

    const mockWorkoutProgress: WorkoutProgress[] = [
      {
        exercise: 'Squat',
        previousWeight: 60,
        currentWeight: 70,
        previousReps: 8,
        currentReps: 10,
        improvement: 16.7
      },
      {
        exercise: 'Développé couché',
        previousWeight: 50,
        currentWeight: 60,
        previousReps: 8,
        currentReps: 9,
        improvement: 20
      },
      {
        exercise: 'Rowing barre',
        previousWeight: 40,
        currentWeight: 50,
        previousReps: 10,
        currentReps: 12,
        improvement: 25
      },
      {
        exercise: 'Développé militaire',
        previousWeight: 30,
        currentWeight: 35,
        previousReps: 8,
        currentReps: 10,
        improvement: 16.7
      }
    ];

    const mockGoals: Goal[] = [
      {
        id: 'goal_1',
        title: 'Poids cible',
        target: 75,
        current: 70.2,
        unit: 'kg',
        deadline: '2024-12-31',
        achieved: false
      },
      {
        id: 'goal_2',
        title: 'Masse grasse',
        target: 12,
        current: 15,
        unit: '%',
        deadline: '2024-11-30',
        achieved: false
      },
      {
        id: 'goal_3',
        title: 'Squat 1RM',
        target: 100,
        current: 85,
        unit: 'kg',
        deadline: '2024-12-15',
        achieved: false
      },
      {
        id: 'goal_4',
        title: 'Séances par semaine',
        target: 3,
        current: 3,
        unit: 'séances',
        deadline: '2024-10-31',
        achieved: true
      }
    ];

    setMeasurements(mockMeasurements);
    setWorkoutProgress(mockWorkoutProgress);
    setGoals(mockGoals);
    setIsLoading(false);
  }, []);

  const addMeasurement = () => {
    const weight = parseFloat(newMeasurement.weight);
    const bodyFat = newMeasurement.bodyFat ? parseFloat(newMeasurement.bodyFat) : undefined;
    const musclemass = newMeasurement.musclePass ? parseFloat(newMeasurement.musclePass) : undefined;

    if (!weight || weight <= 0) return;

    const measurement: Measurement = {
      date: newMeasurement.date,
      weight,
      bodyFat,
      musclemass,
      notes: newMeasurement.notes || undefined
    };

    setMeasurements(prev => [measurement, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setNewMeasurement({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      bodyFat: '',
      musclePass: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const getWeightTrend = () => {
    if (measurements.length < 2) return null;
    const latest = measurements[0].weight;
    const previous = measurements[1].weight;
    const diff = latest - previous;
    return {
      value: Math.abs(diff),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      percentage: Math.abs((diff / previous) * 100)
    };
  };

  const getGoalProgress = (goal: Goal) => {
    if (goal.unit === '%' && goal.title.includes('grasse')) {
      // Pour la masse grasse, on veut diminuer
      return Math.max(0, Math.min(100, ((goal.current - goal.target) / (goal.current)) * 100));
    } else {
      // Pour les autres objectifs, on veut augmenter
      return Math.max(0, Math.min(100, (goal.current / goal.target) * 100));
    }
  };

  const weightTrend = getWeightTrend();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/client" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Retour</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Progrès</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Poids actuel</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{measurements[0]?.weight}kg</p>
                {weightTrend && (
                  <div className={`flex items-center mt-2 text-sm ${
                    weightTrend.direction === 'up' ? 'text-green-600' : 
                    weightTrend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {weightTrend.direction === 'up' ? '↗' : weightTrend.direction === 'down' ? '↘' : '→'}
                    <span className="ml-1">{weightTrend.value.toFixed(1)}kg</span>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Masse grasse</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{measurements[0]?.bodyFat}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Masse musculaire</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{measurements[0]?.musclemass}kg</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Objectifs atteints</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goals.filter(g => g.achieved).length}/{goals.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'measurements', name: 'Mesures corporelles', icon: '📏' },
              { id: 'strength', name: 'Force', icon: '💪' },
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

        {/* Tab Content */}
        {activeTab === 'measurements' && (
          <div className="space-y-8">
            {/* Add Measurement */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter une mesure</h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {showAddForm ? 'Annuler' : 'Nouvelle mesure'}
                </button>
              </div>
              
              {showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={newMeasurement.date}
                      onChange={(e) => setNewMeasurement(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Poids (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMeasurement.weight}
                      onChange={(e) => setNewMeasurement(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="70.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Masse grasse (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMeasurement.bodyFat}
                      onChange={(e) => setNewMeasurement(prev => ({ ...prev, bodyFat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="15.2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Masse musculaire (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMeasurement.musclePass}
                      onChange={(e) => setNewMeasurement(prev => ({ ...prev, musclePass: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="55.0"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (optionnel)</label>
                    <input
                      type="text"
                      value={newMeasurement.notes}
                      onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      placeholder="Commentaires sur cette mesure..."
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addMeasurement}
                      disabled={!newMeasurement.weight}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Measurements History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des mesures</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {measurements.map((measurement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {new Date(measurement.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Poids: {measurement.weight}kg
                          {measurement.bodyFat && ` • Masse grasse: ${measurement.bodyFat}%`}
                          {measurement.musclemass && ` • Masse musculaire: ${measurement.musclemass}kg`}
                        </div>
                        {measurement.notes && (
                          <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            📝 {measurement.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {index > 0 && (
                          <div className={`text-sm font-medium ${
                            measurement.weight > measurements[index - 1].weight
                              ? 'text-green-600 dark:text-green-400'
                              : measurement.weight < measurements[index - 1].weight
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {measurement.weight > measurements[index - 1].weight ? '↑' : 
                             measurement.weight < measurements[index - 1].weight ? '↓' : '→'}
                            {Math.abs(measurement.weight - measurements[index - 1].weight).toFixed(1)}kg
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

        {activeTab === 'strength' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progression en Force</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Comparaison entre vos performances actuelles et précédentes
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {workoutProgress.map((progress, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{progress.exercise}</h4>
                        <span className="px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full">
                          +{progress.improvement.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Poids</div>
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-500 dark:text-gray-400">
                              {progress.previousWeight}kg
                            </div>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {progress.currentWeight}kg
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Répétitions</div>
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-500 dark:text-gray-400">
                              {progress.previousReps}
                            </div>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {progress.currentReps}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Objectifs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Suivez vos objectifs et votre progression
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {goals.map((goal) => (
                    <div key={goal.id} className={`border-2 rounded-lg p-6 ${
                      goal.achieved 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{goal.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Échéance : {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {goal.achieved && (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Progression</span>
                          <span>{getGoalProgress(goal).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              goal.achieved ? 'bg-green-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${getGoalProgress(goal)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {goal.current}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">
                            / {goal.target} {goal.unit}
                          </span>
                        </div>
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
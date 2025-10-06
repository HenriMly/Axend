'use client';

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Program {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  frequency: string;
  duration: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  category: string;
  estimatedCalories: number;
  weeks: number;
  goals: string[];
  equipment: string[];
  tips: string[];
  progress: number;
  lastCompleted?: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest: string;
  instructions?: string;
  targetMuscles: string[];
  videoUrl?: string;
}

export default function ProgramDetail({ params }: { params: Promise<{ programId: string }> }) {
  const [program, setProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Unwrap the params promise using React.use()
  const { programId } = use(params);

  useEffect(() => {
    // Simulation de données détaillées du programme
    const mockProgram: Program = {
      id: programId,
      name: programId === 'prog_1' ? 'Prise de masse débutant' : 'Cardio intensif',
      description: programId === 'prog_1' 
        ? 'Programme complet de 8 semaines conçu spécialement pour les débutants qui souhaitent développer leur masse musculaire de façon progressive et sécurisée.'
        : 'Programme de cardio haute intensité pour améliorer votre condition physique et brûler un maximum de calories.',
      frequency: programId === 'prog_1' ? '3 fois par semaine' : '4 fois par semaine',
      duration: programId === 'prog_1' ? '60 minutes' : '45 minutes',
      difficulty: programId === 'prog_1' ? 'Débutant' : 'Intermédiaire',
      category: programId === 'prog_1' ? 'Musculation' : 'Cardio',
      estimatedCalories: programId === 'prog_1' ? 300 : 450,
      weeks: programId === 'prog_1' ? 8 : 6,
      progress: programId === 'prog_1' ? 75 : 40,
      lastCompleted: programId === 'prog_1' ? '2024-10-01' : '2024-09-28',
      goals: programId === 'prog_1' 
        ? ['Augmenter la masse musculaire', 'Améliorer la force', 'Apprendre les mouvements de base']
        : ['Améliorer l\'endurance cardiovasculaire', 'Brûler les graisses', 'Augmenter le métabolisme'],
      equipment: programId === 'prog_1'
        ? ['Barre olympique', 'Poids libres', 'Banc de musculation', 'Rack à squat']
        : ['Tapis de course', 'Vélo', 'Corde à sauter', 'Tapis de sol'],
      tips: [
        'Échauffez-vous toujours avant de commencer',
        'Hydratez-vous régulièrement pendant l\'entraînement',
        'Respectez les temps de repos entre les séries',
        'Concentrez-vous sur la technique avant d\'augmenter les charges'
      ],
      exercises: programId === 'prog_1' ? [
        {
          id: 'ex_1',
          name: 'Squat',
          sets: 3,
          reps: '8-12',
          weight: '60-70kg',
          rest: '90 secondes',
          instructions: 'Placez la barre sur vos trapèzes, descendez en fléchissant les genoux jusqu\'à ce que vos cuisses soient parallèles au sol, puis remontez en poussant sur vos talons.',
          targetMuscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
          videoUrl: 'https://example.com/squat-video'
        },
        {
          id: 'ex_2',
          name: 'Développé couché',
          sets: 3,
          reps: '8-10',
          weight: '50-60kg',
          rest: '120 secondes',
          instructions: 'Allongé sur le banc, saisissez la barre avec une prise légèrement plus large que vos épaules. Descendez la barre jusqu\'à la poitrine puis poussez vers le haut.',
          targetMuscles: ['Pectoraux', 'Triceps', 'Deltoïdes antérieurs']
        },
        {
          id: 'ex_3',
          name: 'Rowing barre',
          sets: 3,
          reps: '10-12',
          weight: '40-50kg',
          rest: '90 secondes',
          instructions: 'Penché en avant, tirez la barre vers votre bas-ventre en serrant les omoplates. Contrôlez la descente.',
          targetMuscles: ['Grand dorsal', 'Rhomboïdes', 'Biceps']
        },
        {
          id: 'ex_4',
          name: 'Développé militaire',
          sets: 3,
          reps: '8-10',
          weight: '30-40kg',
          rest: '120 secondes',
          instructions: 'Debout, poussez la barre verticalement au-dessus de votre tête en gardant le tronc gainé.',
          targetMuscles: ['Deltoïdes', 'Triceps', 'Trapèzes']
        }
      ] : [
        {
          id: 'ex_5',
          name: 'Course à pied',
          sets: 1,
          reps: '30 minutes',
          rest: '0',
          instructions: 'Alternez entre 2 minutes de course modérée et 30 secondes de sprint. Répétez le cycle.',
          targetMuscles: ['Système cardiovasculaire', 'Jambes']
        },
        {
          id: 'ex_6',
          name: 'Burpees',
          sets: 4,
          reps: '15',
          rest: '60 secondes',
          instructions: 'Position debout, descendez en squat, sautez en position planche, effectuez une pompe, revenez en squat et sautez vers le haut.',
          targetMuscles: ['Corps entier', 'Cardiovasculaire']
        }
      ]
    };
    
    setProgram(mockProgram);
    setIsLoading(false);
  }, [programId]);

  const startProgram = () => {
    router.push(`/dashboard/client/workout?program=${programId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'Intermédiaire': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Avancé': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
    }
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

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Programme non trouvé</h1>
          <Link href="/dashboard/client/programs" className="text-blue-600 hover:text-blue-700">
            Retour aux programmes
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
            <Link href="/dashboard/client/programs" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Programmes</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{program.name}</h1>
          </div>
          <button
            onClick={startProgram}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {program.progress > 0 ? 'Continuer' : 'Commencer'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Program Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(program.difficulty)}`}>
                  {program.difficulty}
                </span>
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full">
                  {program.category}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {program.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Progression</div>
              <div className="text-3xl font-bold text-blue-600">{program.progress}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${program.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{program.frequency}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fréquence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{program.duration}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Par séance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{program.weeks} sem</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Durée totale</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">~{program.estimatedCalories}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Calories/séance</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
              { id: 'exercises', name: 'Exercices', icon: '💪' },
              { id: 'equipment', name: 'Matériel', icon: '🏋️‍♂️' },
              { id: 'tips', name: 'Conseils', icon: '💡' },
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
            {/* Goals */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Objectifs</h3>
              <ul className="space-y-3">
                {program.goals.map((goal, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Last Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 Dernière activité</h3>
              {program.lastCompleted ? (
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {new Date(program.lastCompleted).toLocaleDateString('fr-FR')}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Dernière séance terminée</p>
                  <div className="mt-4">
                    <Link 
                      href="/dashboard/client?tab=workouts"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Voir l'historique →
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Vous n'avez pas encore commencé ce programme.
                  </p>
                  <button
                    onClick={startProgram}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Commencer maintenant
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-6">
            {program.exercises.map((exercise, index) => (
              <div key={exercise.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {index + 1}. {exercise.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {exercise.targetMuscles.map((muscle, i) => (
                          <span key={i} className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full">
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{exercise.sets}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Séries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{exercise.reps}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Répétitions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{exercise.weight || 'Corps'}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Poids</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{exercise.rest}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Repos</div>
                    </div>
                  </div>

                  {exercise.instructions && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instructions</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {exercise.instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">🏋️‍♂️ Matériel nécessaire</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {program.equipment.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 dark:text-white font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                💡 <strong>Conseil :</strong> Assurez-vous d'avoir accès à tout ce matériel avant de commencer le programme. 
                Vous pouvez souvent trouver des alternatives ou contacter votre coach pour des adaptations.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">💡 Conseils pour réussir</h3>
            <div className="space-y-4">
              {program.tips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">{tip}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">🎯 Rappel important</h4>
              <p className="text-green-800 dark:text-green-200 text-sm">
                La régularité est la clé du succès ! Il vaut mieux s'entraîner moins intensément mais plus régulièrement 
                que de faire des séances très intenses de façon sporadique.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
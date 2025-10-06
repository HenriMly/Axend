'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
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
  lastCompleted?: string;
  progress: number; // pourcentage de completion
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest: string;
  instructions?: string;
}

export default function ClientPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Tous');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulation de programmes du client
    const mockPrograms: Program[] = [
      {
        id: 'prog_1',
        name: 'Prise de masse débutant',
        description: 'Programme de 8 semaines pour développer la masse musculaire. Idéal pour les débutants qui veulent construire une base solide.',
        frequency: '3 fois par semaine',
        duration: '60 minutes',
        difficulty: 'Débutant',
        category: 'Musculation',
        estimatedCalories: 300,
        lastCompleted: '2024-10-01',
        progress: 75,
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
          },
          {
            name: 'Développé militaire',
            sets: 3,
            reps: '8-10',
            weight: '30-40kg',
            rest: '120 secondes'
          }
        ]
      },
      {
        id: 'prog_2',
        name: 'Cardio intensif',
        description: 'Programme de cardio haute intensité pour améliorer l\'endurance et brûler les graisses.',
        frequency: '4 fois par semaine',
        duration: '45 minutes',
        difficulty: 'Intermédiaire',
        category: 'Cardio',
        estimatedCalories: 450,
        lastCompleted: '2024-09-28',
        progress: 40,
        exercises: [
          {
            name: 'Course à pied',
            sets: 1,
            reps: '30 minutes',
            rest: '0',
            instructions: 'Alternez entre course modérée et sprints'
          },
          {
            name: 'Burpees',
            sets: 4,
            reps: '15',
            rest: '60 secondes'
          },
          {
            name: 'Mountain climbers',
            sets: 4,
            reps: '30 secondes',
            rest: '30 secondes'
          }
        ]
      },
      {
        id: 'prog_3',
        name: 'Souplesse et mobilité',
        description: 'Programme axé sur l\'amélioration de la flexibilité et la mobilité articulaire.',
        frequency: '2 fois par semaine',
        duration: '30 minutes',
        difficulty: 'Débutant',
        category: 'Stretching',
        estimatedCalories: 120,
        progress: 0,
        exercises: [
          {
            name: 'Étirements des ischio-jambiers',
            sets: 3,
            reps: '30 secondes',
            rest: '15 secondes'
          },
          {
            name: 'Étirements des quadriceps',
            sets: 3,
            reps: '30 secondes',
            rest: '15 secondes'
          },
          {
            name: 'Pose du chat-vache',
            sets: 3,
            reps: '10 répétitions',
            rest: '30 secondes'
          }
        ]
      },
      {
        id: 'prog_4',
        name: 'Force avancée',
        description: 'Programme avancé pour développer la force maximale. Réservé aux pratiquants expérimentés.',
        frequency: '4 fois par semaine',
        duration: '90 minutes',
        difficulty: 'Avancé',
        category: 'Musculation',
        estimatedCalories: 400,
        progress: 20,
        exercises: [
          {
            name: 'Squat lourd',
            sets: 5,
            reps: '3-5',
            weight: '100-120kg',
            rest: '3 minutes'
          },
          {
            name: 'Soulevé de terre',
            sets: 5,
            reps: '3-5',
            weight: '120-140kg',
            rest: '3 minutes'
          },
          {
            name: 'Développé couché lourd',
            sets: 5,
            reps: '3-5',
            weight: '80-100kg',
            rest: '3 minutes'
          }
        ]
      }
    ];
    
    setPrograms(mockPrograms);
    setIsLoading(false);
  }, []);

  const categories = ['Tous', 'Musculation', 'Cardio', 'Stretching'];
  const difficulties = ['Tous', 'Débutant', 'Intermédiaire', 'Avancé'];

  const filteredPrograms = programs.filter(program => {
    const categoryMatch = selectedCategory === 'Tous' || program.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'Tous' || program.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const startProgram = (programId: string) => {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Programmes</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulté
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {program.name}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getDifficultyColor(program.difficulty)}`}>
                      {program.difficulty}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Progression</div>
                    <div className="text-lg font-bold text-blue-600">{program.progress}%</div>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {program.description}
                </p>

                {/* Program Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fréquence</div>
                    <div className="font-medium text-gray-900 dark:text-white">{program.frequency}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Durée</div>
                    <div className="font-medium text-gray-900 dark:text-white">{program.duration}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                    <div className="font-medium text-gray-900 dark:text-white">~{program.estimatedCalories}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {program.progress > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Progression</span>
                      <span>{program.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${program.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Last Completed */}
                {program.lastCompleted && (
                  <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    Dernière séance : {new Date(program.lastCompleted).toLocaleDateString('fr-FR')}
                  </div>
                )}

                {/* Exercises Preview */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Exercices ({program.exercises.length})
                  </h4>
                  <div className="space-y-2">
                    {program.exercises.slice(0, 3).map((exercise, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 dark:text-white">{exercise.name}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {exercise.sets} × {exercise.reps}
                        </span>
                      </div>
                    ))}
                    {program.exercises.length > 3 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        +{program.exercises.length - 3} autres exercices
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => startProgram(program.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {program.progress > 0 ? 'Continuer' : 'Commencer'}
                  </button>
                  <Link
                    href={`/dashboard/client/programs/${program.id}`}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    Détails
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun programme trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Essayez de modifier vos filtres ou contactez votre coach pour obtenir de nouveaux programmes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
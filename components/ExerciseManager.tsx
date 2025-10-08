'use client';

import { useState, useEffect } from 'react';
import { exercisesAPI, Exercise } from '@/lib/exercises-api';

interface ExerciseManagerProps {
  onExerciseSelected: (exercise: Exercise) => void;
  onClose: () => void;
}

export default function ExerciseManager({ onExerciseSelected, onClose }: ExerciseManagerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  
  const categories = exercisesAPI.getCategories();
  const equipment = exercisesAPI.getEquipment();

  const searchExercises = async () => {
    setLoading(true);
    try {
      const results = await exercisesAPI.searchExercises(searchQuery, selectedCategory, selectedEquipment);
      setExercises(results);
    } catch (error) {
      console.error('Error searching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchExercises();
  }, [searchQuery, selectedCategory, selectedEquipment]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              🏋️‍♂️ Ajouter un exercice
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filtres de recherche */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom de l'exercice..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {exercisesAPI.getCategoryDisplayName(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Équipement
              </label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les équipements</option>
                {equipment.map(eq => (
                  <option key={eq} value={eq}>
                    {exercisesAPI.getEquipmentDisplayName(eq)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Liste des exercices */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Recherche des exercices...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onExerciseSelected(exercise)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {exercise.name}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center">
                          🎯 {exercise.target}
                        </span>
                        <span className="flex items-center">
                          🏷️ {exercisesAPI.getCategoryDisplayName(exercise.category)}
                        </span>
                      </div>
                    </div>
                    {exercise.gifUrl && (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <img
                          src={exercise.gifUrl}
                          alt={exercise.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {exercisesAPI.getEquipmentDisplayName(exercise.equipment)}
                    </div>
                  </div>

                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="line-clamp-2">
                        {exercise.instructions[0]}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Ajouter cet exercice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && exercises.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun exercice trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
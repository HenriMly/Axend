import { useState, useEffect } from "react";

export interface WorkoutFormProps {
  onCancel: () => void;
  onSaved: (workout: any) => void;
  programs?: Array<{ id: string; name: string } | string>;
  initialExercises?: any[];
}

export default function WorkoutForm({ onCancel, onSaved, programs, initialExercises = [] }: WorkoutFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [program, setProgram] = useState<string>('');
  const [programId, setProgramId] = useState<string>('');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [exercisesList, setExercisesList] = useState<any[]>(initialExercises || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setExercises(exercisesList.length.toString());
    let totalSeconds = 0;
    exercisesList.forEach(ex => {
      const sets = ex.sets || 0;
      const reps = parseInt(ex.reps) || 0;
      const rest = ex.rest_time || 60;
      totalSeconds += sets * (reps * 5 + rest);
    });
    const estimatedMinutes = Math.round(totalSeconds / 60);
    setDuration(estimatedMinutes.toString());
  }, [exercisesList]);

  useEffect(() => {
    if (programs && programs.length > 0 && !program) {
      const first = programs[0];
      if (typeof first === 'object' && 'id' in first && 'name' in first) {
        setProgram(first.name);
        setProgramId(first.id);
      } else if (typeof first === 'string') {
        setProgram(first);
        setProgramId('');
      }
    }
  }, [programs]);

  useEffect(() => {
    setExercisesList(initialExercises || []);
  }, [initialExercises]);

  const addEmptyExercise = () => {
    setExercisesList(prev => [...prev, { id: `tmp-${Date.now()}`, exercise_id: null, exercise_name: 'Nouvel exercice', order_in_workout: prev.length + 1, sets: 3, reps: '12', weight: '', rest_time: 60, notes: '' }]);
  };

  const addExternalExerciseToList = (exercise: any) => {
    setExercisesList(prev => [...prev, {
      ...exercise,
      exercise_name: exercise.name || exercise.exercise || exercise.title || 'Exercice',
      order_in_workout: prev.length + 1,
      sets: exercise.sets || 3,
      reps: exercise.reps || '12',
      weight: exercise.weight || '',
      rest_time: exercise.rest_time || 60,
      notes: exercise.notes || ''
    }]);
  };

  const updateExerciseAt = (index: number, patch: Partial<any>) => {
    setExercisesList(prev => prev.map((ex, i) => i === index ? { ...ex, ...patch } : ex));
  };

  const removeExerciseAt = (index: number) => {
    setExercisesList(prev => {
      const copy = prev.slice();
      copy.splice(index, 1);
      return copy.map((e, i) => ({ ...e, order_in_workout: i + 1 }));
    });
  };

  const moveExerciseInList = (from: number, to: number) => {
    setExercisesList(prev => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy.map((e, i) => ({ ...e, order_in_workout: i + 1 }));
    });
  };

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/external-exercises?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const workoutData = {
        date,
        program: program.trim(),
        title: title.trim(),
        duration: parseInt(duration) || 0,
        exercises_count: parseInt(exercises) || exercisesList.length || 0,
        status: 'completed',
        notes: notes.trim(),
        exercises_list: exercisesList
      };
      onSaved(workoutData);
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">➕ Ajouter une séance d'entraînement</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rechercher un exercice</label>
        <div className="flex gap-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ex: biceps, squat, chest" className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700" />
          <button onClick={() => runSearch(searchQuery)} className="px-3 py-2 bg-blue-600 text-white rounded">{isSearching ? 'Recherche...' : 'Rechercher'}</button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((ex, i) => (
              <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded border flex items-center justify-between">
                <div>
                  <div className="font-semibold">{ex.name || ex.exercise || ex.title}</div>
                  <div className="text-xs text-gray-500">Muscle: {ex.muscle || ex.muscles || '—'}</div>
                </div>
                <div>
                  <button onClick={() => addExternalExerciseToList(ex)} className="px-3 py-1 bg-green-600 text-white rounded">Ajouter</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Exercices détectés / ajoutés</div>
          <div className="flex items-center gap-2">
            <button onClick={addEmptyExercise} type="button" className="px-2 py-1 bg-green-600 text-white rounded">+ Exo</button>
          </div>
        </div>
        {exercisesList.length === 0 ? (
          <div className="text-sm text-gray-500">Aucun exercice détecté</div>
        ) : (
          <div className="space-y-2">
            {exercisesList.map((ex, idx) => (
              <div key={ex.id || idx} className="p-3 bg-white dark:bg-gray-800 rounded border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 w-full md:w-auto">
                  <div className="flex items-start md:items-center justify-between">
                    <div className="min-w-0">
                      <input value={ex.exercise_name || ''} onChange={(e) => updateExerciseAt(idx, { exercise_name: e.target.value })} className="font-semibold truncate text-sm w-full md:w-64 bg-transparent" />
                      <div className="text-xs text-gray-500">ordre: {ex.order_in_workout ?? idx + 1}</div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2 md:mt-0">
                      <button onClick={() => moveExerciseInList(idx, Math.max(0, idx - 1))} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">↑</button>
                      <button onClick={() => moveExerciseInList(idx, Math.min(exercisesList.length - 1, idx + 1))} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">↓</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs text-gray-500">Sets</label>
                      <input value={ex.sets ?? ''} onChange={(e) => updateExerciseAt(idx, { sets: parseInt(e.target.value) || 0 })} className="w-20 sm:w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm" />
                      <label className="text-xs text-gray-500">Reps</label>
                      <input value={ex.reps ?? ''} onChange={(e) => updateExerciseAt(idx, { reps: e.target.value })} className="w-24 sm:w-20 px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm" />
                    </div>
                    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
                      <label className="text-xs text-gray-500">Poids</label>
                      <input value={ex.weight ?? ''} onChange={(e) => updateExerciseAt(idx, { weight: e.target.value })} className="w-24 sm:w-20 px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm" />
                      <label className="text-xs text-gray-500">Repos</label>
                      <input value={ex.rest_time ?? ''} onChange={(e) => updateExerciseAt(idx, { rest_time: parseInt(e.target.value) || 0 })} className="w-24 sm:w-20 px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-gray-500">Notes</label>
                    <input value={ex.notes ?? ''} onChange={(e) => updateExerciseAt(idx, { notes: e.target.value })} className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm" />
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-start md:items-center md:flex-col md:justify-center space-y-2 md:ml-4">
                  <button onClick={() => removeExerciseAt(idx)} className="text-red-600 px-3 py-1 border border-red-200 rounded">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre de la séance (optionnel)</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Séance Pecs - Fente + HIIT" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom du programme *</label>
        {programs && programs.length > 0 && typeof programs[0] === 'object' ? (
          <select value={programId} onChange={(e) => {
            const selected = programs.find((p: any) => p.id === e.target.value);
            setProgramId(e.target.value);
            setProgram(selected ? ((selected as any).name ?? selected) : '');
          }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="">Sélectionner un programme...</option>
            {programs.map((p: any, i: number) => (<option key={i} value={p.id}>{p.name}</option>))}
          </select>
        ) : (
          <input type="text" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Ex: Pectoraux/Triceps, Jambes, Cardio..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus-border-transparent" />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durée (minutes) *</label>
          <div className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold">{duration} min</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre d'exercices *</label>
          <div className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold">{exercises}</div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (optionnel)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Commentaires sur la séance, difficultés rencontrées, remarques..." rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus-border-transparent" />
      </div>
      {exercisesList && exercisesList.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="font-semibold mb-2">Exercices détectés pour cette séance</div>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {exercisesList.map((ex, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{ex.exercise_name || ex.name || ex.exercise_name || 'Exercice'}</div>
                  <div className="text-xs text-gray-500">{(ex.sets || ex.planned_sets || ex.sets === 0) ? `${ex.sets || ex.planned_sets} × ${ex.reps || ex.planned_reps || ''}` : ''}</div>
                </div>
                <div className="text-xs text-gray-500">ordre: {ex.order_in_workout ?? ex.order ?? idx + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Annuler</button>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Ajouter la séance'}</button>
      </div>
    </div>
  );
}

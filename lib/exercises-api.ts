// API pour récupérer les exercices de musculation
// Utilise ExerciseDB (API gratuite avec exercises de musculation)

interface ExerciseAPIResponse {
  id: string;
  name: string;
  target: string; // muscle ciblé
  equipment: string;
  gifUrl: string;
  instructions: string[];
  bodyPart: string;
}

interface Exercise {
  id: string;
  name: string;
  target: string;
  equipment: string;
  category: string;
  instructions: string[];
  gifUrl?: string;
}

class ExercisesAPI {
  private baseUrl = 'https://exercisedb.p.rapidapi.com';
  private apiKey = process.env.NEXT_PUBLIC_EXERCISEDB_API_KEY || ''; // Tu devras ajouter ta clé

  // Exercices par défaut si l'API n'est pas disponible
  private defaultExercises: Exercise[] = [
    {
      id: 'squat',
      name: 'Squat',
      target: 'quadriceps',
      equipment: 'bodyweight',
      category: 'legs',
      instructions: ['Pieds écartés largeur des épaules', 'Descendre en gardant le dos droit', 'Remonter en poussant sur les talons']
    },
    {
      id: 'push-up',
      name: 'Pompes',
      target: 'pectoraux',
      equipment: 'bodyweight',
      category: 'chest',
      instructions: ['Position planche', 'Descendre en fléchissant les bras', 'Remonter en poussant']
    },
    {
      id: 'deadlift',
      name: 'Soulevé de terre',
      target: 'dorsaux',
      equipment: 'barbell',
      category: 'back',
      instructions: ['Pieds sous la barre', 'Saisir la barre', 'Soulever en gardant le dos droit']
    },
    {
      id: 'bench-press',
      name: 'Développé couché',
      target: 'pectoraux',
      equipment: 'barbell',
      category: 'chest',
      instructions: ['Allongé sur le banc', 'Saisir la barre', 'Descendre sur la poitrine', 'Pousser vers le haut']
    },
    {
      id: 'pull-up',
      name: 'Tractions',
      target: 'dorsaux',
      equipment: 'pull-up bar',
      category: 'back',
      instructions: ['Suspendre à la barre', 'Tirer le corps vers le haut', 'Descendre contrôlé']
    },
    {
      id: 'lunges',
      name: 'Fentes',
      target: 'quadriceps',
      equipment: 'bodyweight',
      category: 'legs',
      instructions: ['Faire un grand pas en avant', 'Descendre le genou arrière', 'Remonter et alterner']
    },
    {
      id: 'overhead-press',
      name: 'Développé militaire',
      target: 'épaules',
      equipment: 'barbell',
      category: 'shoulders',
      instructions: ['Debout, barre au niveau des épaules', 'Pousser la barre au-dessus de la tête', 'Redescendre contrôlé']
    },
    {
      id: 'rows',
      name: 'Rowing',
      target: 'dorsaux',
      equipment: 'barbell',
      category: 'back',
      instructions: ['Penché en avant', 'Tirer la barre vers le ventre', 'Contrôler la descente']
    },
    {
      id: 'dips',
      name: 'Dips',
      target: 'triceps',
      equipment: 'parallel bars',
      category: 'arms',
      instructions: ['Mains sur les barres parallèles', 'Descendre en fléchissant les bras', 'Remonter en poussant']
    },
    {
      id: 'plank',
      name: 'Gainage',
      target: 'abdominaux',
      equipment: 'bodyweight',
      category: 'core',
      instructions: ['Position planche sur les avant-bras', 'Garder le corps aligné', 'Maintenir la position']
    }
  ];

  async searchExercises(query: string = '', category: string = '', equipment: string = ''): Promise<Exercise[]> {
    try {
      // Si pas de clé API, utiliser les exercices par défaut
      if (!this.apiKey) {
        return this.filterDefaultExercises(query, category, equipment);
      }

      // Appel à l'API ExerciseDB
      let url = `${this.baseUrl}/exercises`;
      
      if (category) {
        url = `${this.baseUrl}/exercises/bodyPart/${category}`;
      } else if (equipment) {
        url = `${this.baseUrl}/exercises/equipment/${equipment}`;
      }

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data: ExerciseAPIResponse[] = await response.json();
      
      return data.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        target: exercise.target,
        equipment: exercise.equipment,
        category: exercise.bodyPart,
        instructions: exercise.instructions,
        gifUrl: exercise.gifUrl
      })).filter(exercise => 
        !query || exercise.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 50); // Limiter à 50 résultats

    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Fallback vers les exercices par défaut
      return this.filterDefaultExercises(query, category, equipment);
    }
  }

  private filterDefaultExercises(query: string, category: string, equipment: string): Exercise[] {
    return this.defaultExercises.filter(exercise => {
      const matchesQuery = !query || exercise.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || exercise.category === category;
      const matchesEquipment = !equipment || exercise.equipment === equipment;
      
      return matchesQuery && matchesCategory && matchesEquipment;
    });
  }

  getCategories(): string[] {
    return [
      'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 
      'cardio', 'full-body'
    ];
  }

  getEquipment(): string[] {
    return [
      'bodyweight', 'barbell', 'dumbbell', 'kettlebell', 
      'resistance-band', 'cable', 'machine', 'pull-up bar'
    ];
  }

  getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'chest': 'Pectoraux',
      'back': 'Dos',
      'legs': 'Jambes',
      'shoulders': 'Épaules',
      'arms': 'Bras',
      'core': 'Abdominaux',
      'cardio': 'Cardio',
      'full-body': 'Corps entier'
    };
    return names[category] || category;
  }

  getEquipmentDisplayName(equipment: string): string {
    const names: Record<string, string> = {
      'bodyweight': 'Poids du corps',
      'barbell': 'Barre',
      'dumbbell': 'Haltères',
      'kettlebell': 'Kettlebell',
      'resistance-band': 'Élastique',
      'cable': 'Poulie',
      'machine': 'Machine',
      'pull-up bar': 'Barre de traction'
    };
    return names[equipment] || equipment;
  }
}

export const exercisesAPI = new ExercisesAPI();
export type { Exercise };
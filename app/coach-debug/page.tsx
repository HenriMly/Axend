'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CoachDebugPage() {
  const [coachCode, setCoachCode] = useState('COACH_414420');
  const [result, setResult] = useState<string>('');

  const testCoachCode = async () => {
    try {
      setResult('🔄 Recherche du coach...');
      
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('id, coach_code, name, email')
        .eq('coach_code', coachCode)
        .single()

      if (coachError) {
        setResult(`❌ Erreur: ${coachError.message}`);
        console.error('Coach error:', coachError);
      } else if (coach) {
        setResult(`✅ Coach trouvé: ${coach.name} (${coach.email})\nID: ${coach.id}\nCode: ${coach.coach_code}`);
      } else {
        setResult('❌ Aucun coach trouvé avec ce code');
      }
    } catch (err: any) {
      setResult(`❌ Erreur: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const listAllCoaches = async () => {
    try {
      setResult('🔄 Récupération de tous les coaches...');
      
      const { data: coaches, error } = await supabase
        .from('coaches')
        .select('id, coach_code, name, email, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setResult(`❌ Erreur: ${error.message}`);
      } else {
        const coachList = coaches.map(coach => 
          `- ${coach.name} (${coach.email})\n  Code: ${coach.coach_code}\n  ID: ${coach.id}`
        ).join('\n\n');
        
        setResult(`✅ ${coaches.length} coach(s) trouvé(s):\n\n${coachList}`);
      }
    } catch (err: any) {
      setResult(`❌ Erreur: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🔧 Debug Code Coach
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Test Code Coach</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Code Coach à tester
              </label>
              <input
                type="text"
                value={coachCode}
                onChange={(e) => setCoachCode(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                placeholder="Ex: COACH_414420"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={testCoachCode}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Tester ce Code
              </button>
              
              <button
                onClick={listAllCoaches}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Voir tous les Coaches
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Résultat</h2>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 min-h-[200px]">
            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {result || 'Cliquez sur un bouton pour commencer le test...'}
            </pre>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-300">
            💡 Problèmes possibles
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-200 space-y-1">
            <li>• Le code coach est peut-être différent de celui affiché</li>
            <li>• Vérifiez les espaces ou caractères spéciaux</li>
            <li>• Le trigger de création automatique n'a peut-être pas fonctionné</li>
            <li>• Problème de casse (majuscules/minuscules)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
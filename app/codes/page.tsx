'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CoachCodeHelper() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState('');

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('id, coach_code, name, email')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoaches(data || []);
      
      // Auto-select the first coach code
      if (data && data.length > 0) {
        setSelectedCode(data[0].coach_code);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Code copié: ${text}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des codes coach...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏃‍♂️ Codes Coach Disponibles
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Voici les codes coach valides pour l&apos;inscription des clients
          </p>
        </div>

        {coaches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun coach trouvé
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Il semble qu&apos;aucun coach ne soit enregistré dans la base de données.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {coaches.map((coach, index) => (
              <div 
                key={coach.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {coach.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {coach.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {coach.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Code Coach
                          </p>
                          <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                            {coach.coach_code}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(coach.coach_code)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                          📋 Copier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">
            💡 Comment utiliser ces codes
          </h3>
          <div className="text-green-800 dark:text-green-200 space-y-2">
            <p>1. <strong>Copiez</strong> le code du coach de votre choix</p>
            <p>2. <strong>Allez</strong> sur la page d&apos;inscription client</p>
            <p>3. <strong>Collez</strong> le code coach dans le champ prévu</p>
            <p>4. <strong>Terminez</strong> votre inscription</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/auth/client/register"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            🚀 Inscription Client
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
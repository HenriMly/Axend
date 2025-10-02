'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/lib/auth';

export default function AuthDebugPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('coaches').select('count').single();
      if (error) {
        addResult(`❌ Erreur connexion Supabase: ${error.message}`);
      } else {
        addResult('✅ Connexion Supabase OK');
      }
    } catch (err: any) {
      addResult(`❌ Erreur connexion: ${err.message}`);
    }
  };

  const testSignUp = async () => {
    try {
      addResult('🔄 Test inscription coach...');
      await authService.signUpCoach(email, password, 'Test Coach');
      addResult('✅ Inscription coach réussie');
    } catch (err: any) {
      addResult(`❌ Erreur inscription: ${err.message}`);
    }
  };

  const testSignIn = async () => {
    try {
      addResult('🔄 Test connexion...');
      const result = await authService.signIn(email, password);
      addResult(`✅ Connexion réussie: ${result.user?.email}`);
      
      // Test récupération du profil
      if (result.user) {
        addResult('🔄 Test récupération profil...');
        const profile = await authService.getUserProfile(result.user.id);
        addResult(`✅ Profil récupéré: ${profile.name} (${profile.role})`);
      }
    } catch (err: any) {
      addResult(`❌ Erreur connexion: ${err.message}`);
    }
  };

  const checkAuthUsers = async () => {
    try {
      addResult('🔄 Vérification utilisateurs auth...');
      const { data: users, error } = await supabase
        .from('auth.users')
        .select('id, email, email_confirmed_at')
        .limit(5);
      
      if (error) {
        addResult(`❌ Erreur: ${error.message}`);
      } else {
        addResult(`📊 ${users?.length || 0} utilisateurs trouvés`);
        users?.forEach(user => {
          addResult(`   - ${user.email} (confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'})`);
        });
      }
    } catch (err: any) {
      addResult(`❌ Erreur: ${err.message}`);
    }
  };

  const getCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        addResult(`❌ Erreur session: ${error.message}`);
      } else if (session) {
        addResult(`✅ Session active: ${session.user.email}`);
      } else {
        addResult('ℹ️ Aucune session active');
      }
    } catch (err: any) {
      addResult(`❌ Erreur: ${err.message}`);
    }
  };

  const clearResults = () => setTestResults([]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🔧 Debug Authentification Supabase
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contrôles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Tests</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email de test
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={testSupabaseConnection}
                  className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Test Connexion DB
                </button>
                
                <button
                  onClick={getCurrentSession}
                  className="w-full p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Vérifier Session
                </button>
                
                <button
                  onClick={testSignUp}
                  className="w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Test Inscription
                </button>
                
                <button
                  onClick={testSignIn}
                  className="w-full p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Test Connexion
                </button>
                
                <button
                  onClick={checkAuthUsers}
                  className="w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Vérifier Utilisateurs
                </button>
                
                <button
                  onClick={clearResults}
                  className="w-full p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Résultats</h2>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
              <div className="font-mono text-sm space-y-1">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun test exécuté. Cliquez sur un bouton pour commencer.
                  </p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="text-gray-900 dark:text-gray-100">
                      {result}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-300">
            💡 Problèmes courants
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Email non confirmé:</strong> Vérifiez si Supabase attend une confirmation d'email</li>
            <li>• <strong>Politiques RLS:</strong> Les politiques de sécurité peuvent bloquer l'accès</li>
            <li>• <strong>Variables d'environnement:</strong> Vérifiez SUPABASE_URL et SUPABASE_ANON_KEY</li>
            <li>• <strong>Trigger manquant:</strong> Le trigger de création de profil doit être actif</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
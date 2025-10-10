'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireClient } from '@/lib/auth-context';
import { dataService } from '@/lib/data';

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: 'Sédentaire' | 'Léger' | 'Modéré' | 'Intense' | 'Très intense';
  goals: string[];
  coachId: string;
  joinedDate: string;
  notifications: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    coachMessages: boolean;
    weeklyReports: boolean;
  };
  preferences: {
    units: 'Métrique' | 'Impérial';
    language: 'Français' | 'English';
    theme: 'Auto' | 'Clair' | 'Sombre';
  };
}

export default function ClientSettings() {
  const { user, userProfile, loading: authLoading } = useRequireClient();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadClientProfile = async () => {
      if (!userProfile?.id) return;
      
      try {
        setIsLoading(true);
        const clientData = await dataService.getClientDetail(userProfile.id);
        
        const clientProfile: ClientProfile = {
          id: clientData.id,
          name: clientData.name || '',
          email: clientData.email || '',
          age: clientData.age || 0,
          height: clientData.height || 0,
          currentWeight: clientData.currentWeight || 0,
          targetWeight: clientData.targetWeight || 0,
          activityLevel: 'Modéré',
          goals: [],
          coachId: clientData.coachId || '',
          joinedDate: clientData.joinedDate || new Date().toISOString(),
          notifications: {
            workoutReminders: true,
            progressUpdates: true,
            coachMessages: true,
            weeklyReports: false
          },
          preferences: {
            units: 'Métrique',
            language: 'Français',
            theme: 'Auto'
          }
        };
        
        setProfile(clientProfile);
      } catch (error) {
        console.error('Error loading client profile:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClientProfile();
  }, [userProfile?.id]);

  const updateProfile = async (updates: Partial<ClientProfile>) => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      // Mettre à jour dans la base de données
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      
      const clientUpdateData = {
        name: updates.name || profile.name,
        age: updates.age || profile.age,
        height: updates.height || profile.height
      };
      
      const { error: clientError } = await supabase
        .from('clients')
        .update(clientUpdateData)
        .eq('id', profile.id);
        
      if (clientError) {
        console.error('Error updating client:', clientError);
        throw clientError;
      }
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setMessage({ type: 'success', text: 'Informations mises à jour avec succès !' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const deleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      // Ici vous feriez l'appel API pour supprimer le compte
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du compte.' });
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

  if (!profile) {
    return null;
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message de feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
          } border`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', name: 'Profil', icon: '👤' },
              { id: 'notifications', name: 'Notifications', icon: '🔔' },
              { id: 'preferences', name: 'Préférences', icon: '⚙️' },
              { id: 'security', name: 'Sécurité', icon: '🔒' },
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">👤 Informations personnelles</h3>
              
              {/* Email en lecture seule */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Adresse email
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{profile.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">L'email ne peut pas être modifié</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Âge *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, age: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taille (cm) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={profile.height}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, height: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="170"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => updateProfile({
                    name: profile.name,
                    age: profile.age,
                    height: profile.height
                  })}
                  disabled={isSaving || !profile.name.trim() || !profile.age || !profile.height}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder mes informations'}
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                * Champs obligatoires
              </div>
            </div>

            {/* Goals Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Mes objectifs</h3>
              
              <div className="space-y-3">
                {profile.goals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-800 dark:text-blue-300">{goal}</span>
                    <button
                      onClick={() => {
                        const newGoals = profile.goals.filter((_, i) => i !== index);
                        setProfile(prev => prev ? { ...prev, goals: newGoals } : null);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  + Ajouter un objectif
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Préférences de notification</h3>
            
            <div className="space-y-6">
              {Object.entries(profile.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {key === 'workoutReminders' && 'Rappels d\'entraînement'}
                      {key === 'progressUpdates' && 'Mises à jour de progression'}
                      {key === 'coachMessages' && 'Messages du coach'}
                      {key === 'weeklyReports' && 'Rapports hebdomadaires'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {key === 'workoutReminders' && 'Recevez des rappels pour vos séances d\'entraînement'}
                      {key === 'progressUpdates' && 'Notifications sur vos progrès et réalisations'}
                      {key === 'coachMessages' && 'Alertes pour les nouveaux messages de votre coach'}
                      {key === 'weeklyReports' && 'Résumé hebdomadaire de vos performances'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => {
                        const newNotifications = { ...profile.notifications, [key]: e.target.checked };
                        setProfile(prev => prev ? { ...prev, notifications: newNotifications } : null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => updateProfile({ notifications: profile.notifications })}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Préférences de l'application</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unités de mesure
                </label>
                <select
                  value={profile.preferences.units}
                  onChange={(e) => {
                    const newPreferences = { ...profile.preferences, units: e.target.value as any };
                    setProfile(prev => prev ? { ...prev, preferences: newPreferences } : null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="Métrique">Métrique (kg, cm)</option>
                  <option value="Impérial">Impérial (lbs, ft)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Langue
                </label>
                <select
                  value={profile.preferences.language}
                  onChange={(e) => {
                    const newPreferences = { ...profile.preferences, language: e.target.value as any };
                    setProfile(prev => prev ? { ...prev, preferences: newPreferences } : null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="Français">Français</option>
                  <option value="English">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thème
                </label>
                <select
                  value={profile.preferences.theme}
                  onChange={(e) => {
                    const newPreferences = { ...profile.preferences, theme: e.target.value as any };
                    setProfile(prev => prev ? { ...prev, preferences: newPreferences } : null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="Auto">Automatique (système)</option>
                  <option value="Clair">Clair</option>
                  <option value="Sombre">Sombre</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => updateProfile({ preferences: profile.preferences })}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Changer le mot de passe</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Changer le mot de passe
                </button>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Actions du compte</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Se déconnecter</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Déconnectez-vous de votre session actuelle</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Se déconnecter
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-300">Supprimer le compte</div>
                    <div className="text-sm text-red-700 dark:text-red-400">Supprimez définitivement votre compte et toutes vos données</div>
                  </div>
                  <button
                    onClick={deleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
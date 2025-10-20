'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireCoach } from '@/lib/auth-context';
import { dataService } from '@/lib/data';

interface CoachProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  coach_code?: string;
  clients?: string[];
  notifications: {
    clientRequests: boolean;
    weeklySummary: boolean;
    clientMessages: boolean;
  };
  preferences: {
    language: 'Français' | 'English';
    theme: 'Auto' | 'Clair' | 'Sombre';
  };
}

export default function CoachSettings() {
  const { user, userProfile, loading: authLoading, signOut } = useRequireCoach();
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadCoachProfile = async () => {
      if (!userProfile?.id) return;
      try {
        setIsLoading(true);
        // Use userProfile provided by auth context as the source of truth
        const coachData: any = userProfile;

        const coachProfile: CoachProfile = {
          id: coachData.id,
          name: coachData.name || '',
          email: coachData.email || '',
          role: coachData.role || 'coach',
          coach_code: coachData.coach_code || '',
          clients: coachData.clients || [],
          notifications: {
            clientRequests: true,
            weeklySummary: true,
            clientMessages: true
          },
          preferences: {
            language: 'Français',
            theme: 'Auto'
          }
        };

        setProfile(coachProfile);
      } catch (error) {
        console.error('Error loading coach profile:', error);
        setMessage({ type: 'error', text: 'Erreur lors du chargement du profil' });
      } finally {
        setIsLoading(false);
      }
    };

    loadCoachProfile();
  }, [userProfile?.id]);

  const updateProfile = async (updates: Partial<CoachProfile>) => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();

      const updateData: any = {
        name: updates.name || profile.name,
      };

      const { error: coachError } = await supabase
        .from('coaches')
        .update(updateData)
        .eq('id', profile.id);

      if (coachError) {
        console.error('Error updating coach:', coachError);
        throw coachError;
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

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      router.push('/');
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte coach ? Cette action est irréversible.')) return;
    // Implement deletion flow if needed
    setMessage({ type: 'error', text: 'Suppression non implémentée.' });
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

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="w-full px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/coach" className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Retour</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres coach</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
          } border`}>
            {message.text}
          </div>
        )}

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

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">👤 Informations personnelles</h3>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Adresse email</label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{profile.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code coach</label>
                  <input type="text" value={profile.coach_code} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rôle</label>
                  <input type="text" value={profile.role} readOnly className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => updateProfile({ name: profile.name })}
                  disabled={isSaving || !profile.name.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isSaving ? 'Enregistrement...' : 'Sauvegarder mes informations'}
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">* Champs obligatoires</div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Préférences de notification</h3>

            <div className="space-y-6">
              {Object.entries(profile.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {key === 'clientRequests' && 'Demandes de clients'}
                      {key === 'weeklySummary' && 'Résumé hebdomadaire'}
                      {key === 'clientMessages' && 'Messages de clients'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {key === 'clientRequests' && 'Recevez une alerte lorsqu\'un client demande à vous rejoindre'}
                      {key === 'weeklySummary' && 'Recevez un résumé hebdomadaire de l\'activité de vos clients'}
                      {key === 'clientMessages' && 'Notifications pour les nouveaux messages de vos clients'}
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

        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Préférences de l'application</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Langue</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thème</label>
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

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Changer le mot de passe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe actuel</label>
                  <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nouveau mot de passe</label>
                  <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmer le nouveau mot de passe</label>
                  <input type="password" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Changer le mot de passe</button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Actions du compte</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Se déconnecter</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Déconnectez-vous de votre session actuelle</div>
                  </div>
                  <button onClick={handleLogout} className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Se déconnecter</button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-300">Supprimer le compte</div>
                    <div className="text-sm text-red-700 dark:text-red-400">Supprimez définitivement votre compte et toutes vos données</div>
                  </div>
                  <button onClick={deleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

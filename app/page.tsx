'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'coach' | 'client';
  coach_code?: string;
  clients?: any[];
  coach_id?: string;
}

export default function Home() {
  const { user: authUser, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (authUser) {
      // Get user profile from database
      authService.getUserProfile(authUser.id)
        .then(profile => {
          setUserProfile(profile as User);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          setIsLoading(false);
        });
    } else {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [authUser, loading]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading || loading) {
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
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Logo Axend */}
            <div className="relative">
              <Image 
                src="/axendfond.png" 
                alt="Axend Logo" 
                width={40}
                height={40}
                className="rounded-xl shadow-lg object-contain"
                priority
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                Axend
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">FITNESS</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {userProfile ? (
              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {userProfile ? (
          // Authenticated user content
          <div className="text-center">
            <div className="mb-12">
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Bienvenue, {userProfile.name}!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {userProfile.role === 'coach' ? (
                  <>Gérez vos clients et leurs programmes depuis votre <span className="font-semibold text-blue-600">dashboard coach</span></>
                ) : (
                  <>Suivez vos programmes et votre progression avec votre <span className="font-semibold text-blue-600">coach</span></>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Link 
                href={userProfile.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'}
                className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 block"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {userProfile.role === 'coach' ? 'Dashboard Coach' : 'Mon Fitness'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {userProfile.role === 'coach' 
                    ? 'Gérez vos clients, leurs programmes et suivez leurs performances'
                    : 'Accédez à vos programmes, séances et suivez votre progression'
                  }
                </p>
                <span className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
                  Accéder <span className="ml-1">→</span>
                </span>
              </Link>

              {userProfile.role === 'coach' && (
                <div className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m0-3h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mes Clients</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {userProfile.clients ? `${userProfile.clients.length} clients actifs` : 'Gérez votre liste de clients'}
                  </p>
                  <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center">
                    Voir tous <span className="ml-1">→</span>
                  </button>
                </div>
              )}

              {userProfile.role === 'coach' && (
                <div className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Programmes</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Créez et gérez les programmes de vos clients
                  </p>
                  <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center">
                    Créer <span className="ml-1">→</span>
                  </button>
                </div>
              )}

              {userProfile.role === 'client' && (
                <div className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mes Séances</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Commencez votre prochaine séance d'entraînement
                  </p>
                  <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center">
                    Commencer <span className="ml-1">→</span>
                  </button>
                </div>
              )}

              {userProfile.role === 'client' && (
                <div className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ma Progression</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Suivez vos performances et votre évolution
                  </p>
                  <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center">
                    Voir <span className="ml-1">→</span>
                  </button>
                </div>
              )}
            </div>

            {userProfile.role === 'coach' && userProfile.coach_code && (
              <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl max-w-md mx-auto">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Votre code coach</h4>
                <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {userProfile.coach_code}
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Partagez ce code avec vos clients pour qu'ils puissent s'inscrire
                </p>
              </div>
            )}
          </div>
        ) : (
          // Non-authenticated user content
          <div className="text-center">
            <div className="mb-16">
              <h2 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Bienvenue sur <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Axend</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Votre plateforme de coaching sportif. Coaches et clients, travaillez ensemble pour atteindre vos objectifs.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/auth/register"
                className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Commencer maintenant
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl transition-all"
              >
                Se connecter
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Rapide et efficace</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Interface moderne et intuitive pour une productivité maximale
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Sécurisé</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Vos données sont protégées avec les dernières technologies de sécurité
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personnalisable</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Adaptez l'application à vos besoins spécifiques et préférences
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

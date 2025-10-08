'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium text-gray-700">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image 
              src="/axendfond.png" 
              alt="Axend Logo" 
              width={40}
              height={40}
              className="rounded-xl shadow-lg object-contain"
              priority
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Axend
              </h1>
              <span className="text-xs text-gray-500 font-medium -mt-1">FITNESS</span>
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
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile.name}
                  </span>
                </div>
                <Link
                  href={userProfile.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative group">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    👨‍🏋️ Coach
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <Link href="/auth/coach/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg">
                      Se connecter
                    </Link>
                    <Link href="/auth/coach/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg">
                      S'inscrire
                    </Link>
                  </div>
                </div>
                
                <div className="relative group">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg transition-all shadow-lg">
                    💪 Client
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <Link href="/auth/client/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg">
                      Se connecter
                    </Link>
                    <Link href="/auth/client/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg">
                      S'inscrire
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
              Transformez votre fitness
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              La plateforme nouvelle génération qui connecte coachs sportifs et clients pour un suivi personnalisé et des résultats exceptionnels.
            </p>
          </div>

          {userProfile ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Bienvenue, {userProfile.name}! 👋
              </p>
              <Link
                href={userProfile.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all transform hover:scale-105 shadow-xl"
              >
                Accéder à mon dashboard
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link
                href="/auth/coach/register"
                className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-blue-300"
              >
                <div className="text-4xl mb-4">👨‍🏋️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Je suis Coach</h3>
                <p className="text-gray-600 mb-4">Gérez vos clients, créez des programmes personnalisés et suivez leurs progrès.</p>
                <div className="text-blue-600 font-semibold group-hover:text-blue-700">
                  Commencer maintenant →
                </div>
              </Link>

              <Link
                href="/auth/client/register"
                className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-green-300"
              >
                <div className="text-4xl mb-4">💪</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Je suis Client</h3>
                <p className="text-gray-600 mb-4">Accédez à vos programmes, suivez vos entraînements et progressez avec votre coach.</p>
                <div className="text-green-600 font-semibold group-hover:text-green-700">
                  Rejoindre maintenant →
                </div>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
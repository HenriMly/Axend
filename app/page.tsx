'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function Home() {
  const { user, userProfile, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full animate-bounce"></div>
          </div>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chargement d'Axend...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Navigation */}
      <header className="relative w-full px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="group flex items-center space-x-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-white/50 to-gray-50/50 hover:from-white transition-all duration-200 hover:shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-200">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Axend
              </h1>
              <p className="text-xs text-gray-500">FITNESS PLATFORM</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Tarifs</a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">À propos</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
          </nav>
          
          <div className="flex gap-3 items-center">
            {userProfile ? (
              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-3 px-4 py-2 bg-white/50 rounded-2xl border border-white/20">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
                  </div>
                </div>
                <Link
                  href={userProfile.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'}
                  className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center gap-2">
                    Dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex gap-2">
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 bg-white/50 hover:bg-white rounded-xl transition-all duration-200 border border-white/20 hover:border-blue-200">
                      <span className="text-lg">👨‍🏋️</span>
                      Coach
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                      <div className="p-2">
                        <Link href="/auth/coach/login" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 rounded-xl transition-colors">
                          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Se connecter
                        </Link>
                        <Link href="/auth/coach/register" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 rounded-xl transition-colors">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          Créer un compte
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                      <span className="text-lg">💪</span>
                      Client
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                      <div className="p-2">
                        <Link href="/auth/client/login" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 rounded-xl transition-colors">
                          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Se connecter
                        </Link>
                        <Link href="/auth/client/register" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 rounded-xl transition-colors">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          Rejoindre maintenant
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl bg-white/50 hover:bg-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && !userProfile && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-30">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 mb-3">👨‍🏋️ Espace Coach</p>
                <Link href="/auth/coach/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-xl">
                  Se connecter
                </Link>
                <Link href="/auth/coach/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-xl">
                  Créer un compte coach
                </Link>
              </div>
              <hr className="border-gray-200" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 mb-3">💪 Espace Client</p>
                <Link href="/auth/client/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-xl">
                  Se connecter
                </Link>
                <Link href="/auth/client/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-xl">
                  Rejoindre maintenant
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Hero Content */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-12">
            {/* Main Hero */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full border border-blue-200/50 backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-blue-700">Plateforme nouvelle génération</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight">
                Révolutionnez
                <br />
                votre <span className="relative text-purple-600">fitness
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                La plateforme qui connecte <span className="font-semibold text-blue-600">coachs sportifs</span> et <span className="font-semibold text-emerald-600">clients</span> pour un suivi personnalisé, des programmes sur-mesure et des résultats exceptionnels.
              </p>

              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  100% Gratuit pour commencer
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Configuration en 2 minutes
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Support 24/7
                </div>
              </div>
            </div>

            {/* Auth Cards */}
            {userProfile ? (
              <div className="max-w-lg mx-auto">
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                      <span className="text-white font-bold text-2xl">
                        {userProfile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Bon retour, {userProfile.name}! 👋
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Votre espace {userProfile.role === 'coach' ? 'coach' : 'client'} vous attend.
                  </p>
                  <Link
                    href={userProfile.role === 'coach' ? '/dashboard/coach' : '/dashboard/client'}
                    className="group relative w-full inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center gap-2">
                      Accéder à mon dashboard
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Coach Card */}
                <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl">👨‍🏋️</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                      Je suis Coach
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Développez votre activité avec notre plateforme complète. Gérez vos clients, créez des programmes personnalisés, suivez les progrès et développez votre business.
                    </p>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        Gestion complète de vos clients
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        Programmes personnalisés
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        Suivi des performances en temps réel
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Link
                        href="/auth/coach/register"
                        className="w-full group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 overflow-hidden inline-block text-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">Créer mon compte coach</span>
                      </Link>
                      <Link
                        href="/auth/coach/login"
                        className="w-full px-6 py-3 text-blue-600 font-semibold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors inline-block text-center"
                      >
                        J'ai déjà un compte
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Client Card */}
                <div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-3xl"></div>
                  <div className="relative">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl">💪</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                      Je suis Client
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Atteignez vos objectifs fitness avec un accompagnement professionnel. Accédez à vos programmes, suivez vos entraînements et progressez avec votre coach personnel.
                    </p>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        Programmes adaptés à vos objectifs
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        Suivi personnalisé par votre coach
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        Tracking de vos performances
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Link
                        href="/auth/client/register"
                        className="w-full group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-semibold shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 overflow-hidden inline-block text-center"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">Rejoindre maintenant</span>
                      </Link>
                      <Link
                        href="/auth/client/login"
                        className="w-full px-6 py-3 text-emerald-600 font-semibold rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors inline-block text-center"
                      >
                        J'ai déjà un compte
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Preview */}
            <div className="mt-20 max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Pourquoi choisir Axend ?</h2>
                <p className="text-xl text-gray-600">Une plateforme complète pour révolutionner votre approche du fitness</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="group text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/60 transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Interface intuitive</h3>
                  <p className="text-gray-600">Design moderne et ergonomique pour une expérience utilisateur optimale</p>
                </div>
                
                <div className="group text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/60 transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Suivi en temps réel</h3>
                  <p className="text-gray-600">Analysez les performances et ajustez les programmes en temps réel</p>
                </div>
                
                <div className="group text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/60 transition-all duration-300 hover:-translate-y-2">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">100% personnalisé</h3>
                  <p className="text-gray-600">Programmes et suivis adaptés aux objectifs et besoins de chacun</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">500+</div>
                <div className="text-gray-600 font-medium">Coachs actifs</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">5K+</div>
                <div className="text-gray-600 font-medium">Clients satisfaits</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">50K+</div>
                <div className="text-gray-600 font-medium">Séances réalisées</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">98%</div>
                <div className="text-gray-600 font-medium">Satisfaction</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700/50 to-emerald-700/50 backdrop-blur-sm"></div>
              <div className="relative">
                <h2 className="text-4xl font-bold mb-6">Prêt à transformer votre fitness ?</h2>
                <p className="text-xl mb-8 text-blue-100">Rejoignez des milliers d'utilisateurs qui ont déjà fait confiance à Axend</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/coach/register"
                    className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Devenir coach
                  </Link>
                  <Link
                    href="/auth/client/register"
                    className="px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Commencer en tant que client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-xl border-t border-white/20 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h3 className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Axend</h3>
                <p className="text-xs text-gray-500">FITNESS PLATFORM</p>
              </div>
            </div>
            <div className="flex items-center space-x-8 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-colors">Conditions d'utilisation</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2025 Axend. Tous droits réservés. Créé avec ❤️ pour révolutionner le fitness.
          </div>
        </div>
      </footer>
    </div>
  );
}
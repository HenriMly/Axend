'use client';

import Link from "next/link";
import { useState } from 'react';

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 'dashboard',
      title: 'Tableaux de Bord Intuitifs',
      description: 'Des interfaces modernes et ergonomiques pour coachs et clients.',
      icon: '📊',
      details: [
        'Visualisation en temps réel des performances',
        'Statistiques détaillées et graphiques interactifs',
        'Interface personnalisable selon vos besoins',
        'Accès rapide aux informations essentielles'
      ],
      image: '🎯'
    },
    {
      id: 'programs',
      title: 'Programmes Personnalisés',
      description: 'Créez et gérez des programmes d\'entraînement sur-mesure.',
      icon: '💪',
      details: [
        'Bibliothèque d\'exercices complète',
        'Planification hebdomadaire flexible',
        'Adaptation automatique selon les progrès',
        'Templates pré-conçus pour gagner du temps'
      ],
      image: '🏋️'
    },
    {
      id: 'tracking',
      title: 'Suivi en Temps Réel',
      description: 'Suivez les progrès et performances de vos clients instantanément.',
      icon: '📈',
      details: [
        'Mesures corporelles et performances',
        'Historique complet des entraînements',
        'Alertes et notifications intelligentes',
        'Rapports de progression automatiques'
      ],
      image: '📊'
    },
    {
      id: 'communication',
      title: 'Communication Simplifiée',
      description: 'Restez connecté avec vos clients où que vous soyez.',
      icon: '💬',
      details: [
        'Messagerie intégrée sécurisée',
        'Notifications push en temps réel',
        'Partage de fichiers et médias',
        'Commentaires sur les séances'
      ],
      image: '📱'
    },
    {
      id: 'analytics',
      title: 'Analyses Avancées',
      description: 'Exploitez la puissance des données pour optimiser les résultats.',
      icon: '🔍',
      details: [
        'Intelligence artificielle prédictive',
        'Recommandations personnalisées',
        'Analyse comparative des performances',
        'Détection automatique des tendances'
      ],
      image: '🤖'
    },
    {
      id: 'mobile',
      title: 'Application Mobile',
      description: 'Emportez votre coach partout avec l\'app mobile dédiée.',
      icon: '📱',
      details: [
        'Synchronisation multi-plateforme',
        'Mode hors-ligne disponible',
        'Interface optimisée mobile',
        'Notifications push intelligentes'
      ],
      image: '🚀'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
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
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-blue-600 font-semibold border-b-2 border-blue-600">Fonctionnalités</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Tarifs</Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">À propos</Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</Link>
          </nav>

          <div className="flex gap-3">
            <Link href="/auth/client/login" className="px-4 py-2 text-blue-600 font-semibold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/client/register" className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full border border-blue-200/50 backdrop-blur-sm mb-8">
            <span className="text-2xl">🚀</span>
            <span className="text-sm font-medium text-blue-700">Fonctionnalités Avancées</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight mb-6">
            Tout ce dont vous avez besoin
            <br />
            pour <span className="relative text-purple-600">réussir
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Découvrez toutes les fonctionnalités qui font d'<span className="font-semibold text-blue-600">Axend</span> la plateforme fitness la plus complète et innovante du marché.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              onClick={() => setActiveFeature(index)}
              className={`group relative cursor-pointer p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 ${
                activeFeature === index ? 'ring-2 ring-blue-500 bg-white/80 -translate-y-2 shadow-2xl' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 ${
                    activeFeature === index 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/25' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-600 shadow-gray-500/25'
                  }`}>
                    <span className="text-4xl">{feature.icon}</span>
                  </div>
                </div>
                
                <h3 className={`text-2xl font-bold mb-4 transition-all duration-300 ${
                  activeFeature === index 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' 
                    : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                <div className="space-y-2">
                  {feature.details.slice(0, 2).map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                        activeFeature === index ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <svg className={`w-3 h-3 ${
                          activeFeature === index ? 'text-blue-600' : 'text-gray-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Feature View */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                  <span className="text-3xl">{features[activeFeature].icon}</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {features[activeFeature].title}
                  </h2>
                  <p className="text-gray-600">{features[activeFeature].description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {features[activeFeature].details.map((detail, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{detail}</p>
                      <p className="text-sm text-gray-600">Fonctionnalité avancée incluse dans tous les plans Axend</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/auth/client/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">Essayer gratuitement</span>
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 text-blue-600 font-semibold rounded-2xl border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  Demander une démo
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <div className="w-60 h-60 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-8xl">{features[activeFeature].image}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <section className="mt-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pourquoi nos clients nous font confiance</h2>
            <p className="text-xl text-gray-600">Des résultats prouvés et une satisfaction client exceptionnelle</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-gray-600 font-medium">Coachs certifiés</div>
            </div>
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">5K+</div>
              <div className="text-gray-600 font-medium">Clients actifs</div>
            </div>
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">98%</div>
              <div className="text-gray-600 font-medium">Satisfaction client</div>
            </div>
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">24/7</div>
              <div className="text-gray-600 font-medium">Support disponible</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700/50 to-purple-700/50 backdrop-blur-sm"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold mb-6">Prêt à découvrir Axend ?</h2>
              <p className="text-xl mb-8 text-blue-100">Commencez votre essai gratuit dès aujourd'hui</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/client/register"
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Essai gratuit 14 jours
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>

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
              <Link href="/features" className="hover:text-blue-600 transition-colors">Fonctionnalités</Link>
              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Tarifs</Link>
              <Link href="/about" className="hover:text-blue-600 transition-colors">À propos</Link>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2025 Axend. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
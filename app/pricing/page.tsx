'use client';

import Link from "next/link";
import { useState } from 'react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const plans: Record<string, any[]> = {
    coach: [
      {
        id: 'starter',
        name: 'Starter',
        subtitle: 'Parfait pour débuter',
        monthlyPrice: 0,
        annualPrice: 0,
        popular: false,
        features: [
          'Jusqu\'à 5 clients',
          'Programmes de base',
          'Suivi basique',
          'Support par email',
          'Interface web'
        ],
        limitations: [
          'Fonctionnalités limitées',
          'Pas d\'analytics avancées',
          'Support standard uniquement'
        ]
      },
      {
        id: 'pro',
        name: 'Professional',
        subtitle: 'Le plus populaire',
        monthlyPrice: 29,
        annualPrice: 290,
        popular: true,
        features: [
          'Clients illimités',
          'Programmes personnalisés complets',
          'Analytics avancées',
          'Support prioritaire',
          'Application mobile',
          'Intégrations tierces',
          'Rapports détaillés',
          'Notifications push'
        ],
        limitations: []
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        subtitle: 'Pour les grandes structures',
        monthlyPrice: 99,
        annualPrice: 990,
        popular: false,
        features: [
          'Tout du plan Professional',
          'Gestion multi-coachs',
          'Tableau de bord admin',
          'API complète',
          'Support 24/7 dédié',
          'Formation personnalisée',
          'Intégration sur-mesure',
          'Branding personnalisé'
        ],
        limitations: []
      }
    ],
    client: [
      {
        id: 'free',
        name: 'Gratuit',
        subtitle: 'Découvrez Axend',
        monthlyPrice: 0,
        annualPrice: 0,
        popular: false,
        features: [
          'Accès aux programmes de base',
          'Suivi personnel limité',
          'Support communautaire',
          'Application mobile de base'
        ],
        limitations: [
          'Fonctionnalités limitées',
          'Pas de coach dédié'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        subtitle: 'Coaching complet',
        monthlyPrice: 19,
        annualPrice: 190,
        popular: true,
        features: [
          'Accès coach personnel',
          'Programmes personnalisés',
          'Suivi détaillé complet',
          'Support prioritaire',
          'Analytics personnelles',
          'Notifications intelligentes',
          'Historique illimité'
        ],
        limitations: []
      }
    ]
  };

  const [userType, setUserType] = useState<'coach' | 'client'>('coach');

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
            <Link href="/features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Fonctionnalités</Link>
            <Link href="/pricing" className="text-blue-600 font-semibold border-b-2 border-blue-600">Tarifs</Link>
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
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-100/50 to-blue-100/50 rounded-full border border-green-200/50 backdrop-blur-sm mb-8">
            <span className="text-2xl">💎</span>
            <span className="text-sm font-medium text-green-700">Tarifs Transparents</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight mb-6">
            Des prix justes
            <br />
            pour tous les <span className="relative text-purple-600">budgets
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            Choisissez le plan qui correspond à vos besoins. Commencez gratuitement, évoluez à votre rythme.
          </p>

          {/* User Type Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-2 border border-white/20 shadow-lg">
              <div className="flex">
                <button
                  onClick={() => setUserType('coach')}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    userType === 'coach'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  👨‍🏋️ Je suis Coach
                </button>
                <button
                  onClick={() => setUserType('client')}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    userType === 'client'
                      ? 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  💪 Je suis Client
                </button>
              </div>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`font-medium ${!isAnnual ? 'text-blue-600' : 'text-gray-600'}`}>Mensuel</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                isAnnual ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                isAnnual ? 'translate-x-8' : 'translate-x-1'
              }`}></div>
            </button>
            <span className={`font-medium ${isAnnual ? 'text-blue-600' : 'text-gray-600'}`}>
              Annuel
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">-17%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-8 mb-20 ${
          userType === 'coach' ? 'md:grid-cols-3' : 'md:grid-cols-2'
        } max-w-6xl mx-auto`}>
          {plans[userType].map((plan) => (
            <div
              key={plan.id}
              className={`group relative p-8 bg-white/60 backdrop-blur-xl rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular
                  ? 'border-blue-300 bg-white/80 shadow-2xl -translate-y-1 ring-2 ring-blue-500'
                  : 'border-white/20 hover:bg-white/80'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Le plus populaire
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
              
              <div className="relative">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.subtitle}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {isAnnual ? plan.annualPrice : plan.monthlyPrice}€
                      </span>
                      <span className="text-gray-600">
                        /{isAnnual ? 'an' : 'mois'}
                      </span>
                    </div>
                    {isAnnual && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Soit {Math.round(plan.annualPrice / 12)}€/mois
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105'
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {plan.monthlyPrice === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">✅ Inclus :</h4>
                  {plan.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}

                  {plan.limitations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">⚠️ Limitations :</h4>
                      {plan.limitations.map((limitation: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 mb-2">
                          <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-gray-600 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Questions fréquentes</h2>
            <p className="text-xl text-gray-600">Tout ce que vous devez savoir sur nos tarifs</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-3">💳 Puis-je changer de plan à tout moment ?</h3>
                <p className="text-gray-600">Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre tableau de bord.</p>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-3">🎯 Y a-t-il un essai gratuit ?</h3>
                <p className="text-gray-600">Oui, tous les plans payants incluent 14 jours d'essai gratuit. Aucune carte bancaire requise.</p>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-3">🔒 Mes données sont-elles sécurisées ?</h3>
                <p className="text-gray-600">Absolument. Nous utilisons un chiffrement de niveau bancaire et respectons le RGPD.</p>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-3">📞 Quel support est disponible ?</h3>
                <p className="text-gray-600">Support email pour tous, chat prioritaire pour Pro, et support dédié 24/7 pour Enterprise.</p>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-3">💰 Y a-t-il des frais cachés ?</h3>
                <p className="text-gray-600">Non, nos prix sont transparents. Pas de frais de configuration ou de résiliation.</p>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-gray-900 mb-3">🎓 Proposez-vous des remises ?</h3>
                <p className="text-gray-600">Oui, -17% sur l'abonnement annuel et des tarifs spéciaux pour étudiants et associations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Comparaison détaillée</h2>
            <p className="text-xl text-gray-600">Toutes les fonctionnalités en un coup d'œil</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <tr>
                    <th className="text-left p-6 font-bold">Fonctionnalités</th>
                    {plans[userType].map((plan) => (
                      <th key={plan.id} className="text-center p-6 font-bold">
                        {plan.name}
                        <div className="text-sm font-normal opacity-75 mt-1">{plan.subtitle}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white/40">
                    <td className="p-6 font-semibold">Nombre de clients</td>
                    <td className="text-center p-6">{userType === 'coach' ? '5 max' : '1 (soi-même)'}</td>
                    <td className="text-center p-6">{userType === 'coach' ? 'Illimité' : '1 (soi-même)'}</td>
                    {userType === 'coach' && <td className="text-center p-6">Illimité</td>}
                  </tr>
                  <tr>
                    <td className="p-6 font-semibold">Programmes personnalisés</td>
                    <td className="text-center p-6">
                      <span className="text-orange-500">●</span> Basique
                    </td>
                    <td className="text-center p-6">
                      <span className="text-green-500">●</span> Complet
                    </td>
                    {userType === 'coach' && (
                      <td className="text-center p-6">
                        <span className="text-green-500">●</span> Avancé
                      </td>
                    )}
                  </tr>
                  <tr className="bg-white/40">
                    <td className="p-6 font-semibold">Analytics & Rapports</td>
                    <td className="text-center p-6">
                      <span className="text-red-500">○</span> Non
                    </td>
                    <td className="text-center p-6">
                      <span className="text-green-500">●</span> Oui
                    </td>
                    {userType === 'coach' && (
                      <td className="text-center p-6">
                        <span className="text-green-500">●</span> Avancé
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="p-6 font-semibold">Application mobile</td>
                    <td className="text-center p-6">
                      <span className="text-orange-500">●</span> Basique
                    </td>
                    <td className="text-center p-6">
                      <span className="text-green-500">●</span> Complète
                    </td>
                    {userType === 'coach' && (
                      <td className="text-center p-6">
                        <span className="text-green-500">●</span> Complète
                      </td>
                    )}
                  </tr>
                  <tr className="bg-white/40">
                    <td className="p-6 font-semibold">Support client</td>
                    <td className="text-center p-6">Email</td>
                    <td className="text-center p-6">Prioritaire</td>
                    {userType === 'coach' && <td className="text-center p-6">24/7 Dédié</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700/50 to-purple-700/50 backdrop-blur-sm"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold mb-6">Prêt à commencer votre transformation ?</h2>
              <p className="text-xl mb-8 text-blue-100">Rejoignez des milliers d'utilisateurs satisfaits</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/auth/${userType}/register`}
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Commencer mon essai gratuit
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Demander une démo
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
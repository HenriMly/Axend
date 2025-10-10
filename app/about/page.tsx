'use client';

import Link from "next/link";
import { useState } from 'react';

export default function AboutPage() {
  const [activeValue, setActiveValue] = useState(0);

  const values = [
    {
      icon: '🎯',
      title: 'Excellence',
      description: 'Nous visons l\'excellence dans chaque fonctionnalité, chaque interaction et chaque expérience utilisateur.'
    },
    {
      icon: '🤝',
      title: 'Transparence',
      description: 'Des prix clairs, des fonctionnalités transparentes et une communication honnête avec nos utilisateurs.'
    },
    {
      icon: '💡',
      title: 'Innovation',
      description: 'Nous repoussons constamment les limites pour offrir les solutions les plus avancées du marché.'
    },
    {
      icon: '❤️',
      title: 'Passion',
      description: 'Notre équipe est passionnée par le fitness et la technologie, et cela se ressent dans notre produit.'
    }
  ];

  const team = [
    {
      name: 'Henri Martin',
      role: 'CEO & Fondateur',
      description: 'Passionné de fitness et de technologie, Henri a créé Axend pour révolutionner l\'industrie du coaching sportif.',
      image: '👨‍💼',
      linkedin: '#'
    },
    {
      name: 'Sarah Dubois',
      role: 'CTO',
      description: 'Experte en développement logiciel avec 10 ans d\'expérience dans les solutions SaaS.',
      image: '👩‍💻',
      linkedin: '#'
    },
    {
      name: 'Marc Thompson',
      role: 'Head of Design',
      description: 'Designer UX/UI primé, spécialisé dans les interfaces intuitives et engageantes.',
      image: '👨‍🎨',
      linkedin: '#'
    },
    {
      name: 'Julie Lefevre',
      role: 'Head of Growth',
      description: 'Experte en croissance digitale et acquisition client dans le secteur du fitness.',
      image: '👩‍💼',
      linkedin: '#'
    }
  ];

  const milestones = [
    {
      year: '2023',
      title: 'Création d\'Axend',
      description: 'Lancement de l\'idée et développement du MVP'
    },
    {
      year: '2024',
      title: 'Premiers clients',
      description: 'Onboarding des 100 premiers coachs sur la plateforme'
    },
    {
      year: '2025',
      title: '1000+ utilisateurs',
      description: 'Franchissement du cap des 1000 utilisateurs actifs'
    },
    {
      year: '2025',
      title: 'Expansion internationale',
      description: 'Ouverture aux marchés européens'
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
            <Link href="/features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Fonctionnalités</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Tarifs</Link>
            <Link href="/about" className="text-blue-600 font-semibold border-b-2 border-blue-600">À propos</Link>
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
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-100/50 to-blue-100/50 rounded-full border border-purple-200/50 backdrop-blur-sm mb-8">
            <span className="text-2xl">🚀</span>
            <span className="text-sm font-medium text-purple-700">Notre Histoire</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight mb-6">
            Révolutionner le fitness
            <br />
            avec la <span className="relative text-purple-600">technologie
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Chez <span className="font-semibold text-blue-600">Axend</span>, nous croyons que chacun mérite un accompagnement fitness de qualité. C\'est pourquoi nous avons créé la plateforme qui connecte coachs et clients de manière innovante.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/50 rounded-full mb-6">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-medium text-blue-700">Notre Mission</span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Démocratiser l\'accès au coaching fitness
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Notre mission est de rendre le coaching fitness accessible à tous, partout et à tout moment. 
                Nous voulons éliminer les barrières géographiques et financières qui empêchent les gens 
                d\'atteindre leurs objectifs de santé et de bien-être.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">500+</div>
                  <div className="text-gray-600 font-medium">Coachs certifiés</div>
                </div>
                <div className="text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">5K+</div>
                  <div className="text-gray-600 font-medium">Clients satisfaits</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <div className="w-72 h-72 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-8xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Valeurs</h2>
            <p className="text-xl text-gray-600">Les principes qui guident chacune de nos décisions</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                onClick={() => setActiveValue(index)}
                className={`group cursor-pointer p-8 bg-white/60 backdrop-blur-xl rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                  activeValue === index ? 'border-blue-300 bg-white/80 shadow-2xl -translate-y-1' : 'border-white/20 hover:bg-white/80'
                }`}
              >
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300 ${
                    activeValue === index 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/25' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-600 shadow-gray-500/25'
                  }`}>
                    <span className="text-4xl">{value.icon}</span>
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-4 transition-all duration-300 ${
                    activeValue === index 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' 
                      : 'text-gray-900'
                  }`}>
                    {value.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Notre Parcours</h2>
            <p className="text-xl text-gray-600">Les étapes clés de notre croissance</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
              
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}>
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg z-10"></div>
                  
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Notre Équipe</h2>
            <p className="text-xl text-gray-600">Les talents passionnés qui construisent Axend chaque jour</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 text-center"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-4xl">{member.image}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-blue-600 font-semibold mb-4">{member.role}</div>
                <p className="text-gray-600 leading-relaxed mb-6">{member.description}</p>
                
                <a
                  href={member.linkedin}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 rounded-3xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Axend en Chiffres</h2>
              <p className="text-xl text-gray-600">Notre impact sur la communauté fitness</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">500+</div>
                <div className="text-gray-700 font-semibold">Coachs Certifiés</div>
                <div className="text-sm text-gray-500 mt-1">Dans 15+ pays</div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-3">5K+</div>
                <div className="text-gray-700 font-semibold">Clients Actifs</div>
                <div className="text-sm text-gray-500 mt-1">Et ça grandit chaque jour</div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3">50K+</div>
                <div className="text-gray-700 font-semibold">Séances Réalisées</div>
                <div className="text-sm text-gray-500 mt-1">Depuis le lancement</div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3">98%</div>
                <div className="text-gray-700 font-semibold">Satisfaction Client</div>
                <div className="text-sm text-gray-500 mt-1">Note moyenne 4.9/5</div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-20">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 p-12 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100/50 rounded-full mb-6">
                <span className="text-lg">🔮</span>
                <span className="text-sm font-medium text-purple-700">Notre Vision</span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                L\'avenir du fitness est connecté
              </h2>
              
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                Nous imaginons un monde où chaque personne a accès à un coaching personnalisé, 
                où la technologie amplifie l\'expertise humaine, et où atteindre ses objectifs 
                fitness devient un parcours guidé, motivant et accessible.
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Accessibilité Globale</h3>
                  <p className="text-gray-600 text-sm">Démocratiser l\'accès au coaching fitness partout dans le monde</p>
                </div>
                
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">IA Personnalisée</h3>
                  <p className="text-gray-600 text-sm">Utiliser l\'intelligence artificielle pour des recommandations ultra-personnalisées</p>
                </div>
                
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Innovation Continue</h3>
                  <p className="text-gray-600 text-sm">Repousser constamment les limites de ce qui est possible</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700/50 to-purple-700/50 backdrop-blur-sm"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold mb-6">Rejoignez l\'aventure Axend</h2>
              <p className="text-xl mb-8 text-blue-100">Ensemble, révolutionnons le monde du fitness</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/client/register"
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Commencer gratuitement
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 border-2 border-white text-white font-semibold rounded-2xl hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Nous contacter
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
            © 2025 Axend. Tous droits réservés. Fait avec ❤️ pour révolutionner le fitness.
          </div>
        </div>
      </footer>
    </div>
  );
}
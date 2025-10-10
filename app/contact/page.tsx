'use client';

import Link from "next/link";
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'client'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '', userType: 'client' });
    alert('Message envoyé avec succès !');
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email',
      description: 'Contactez-nous par email',
      value: 'hello@axend.fr',
      link: 'mailto:hello@axend.fr'
    },
    {
      icon: '📞',
      title: 'Téléphone',
      description: 'Appelez-nous directement',
      value: '+33 1 23 45 67 89',
      link: 'tel:+33123456789'
    },
    {
      icon: '💬',
      title: 'Chat Live',
      description: 'Support instantané',
      value: 'Disponible 9h-18h',
      link: '#'
    },
    {
      icon: '📍',
      title: 'Adresse',
      description: 'Nos bureaux',
      value: '123 Rue de la Tech, 75001 Paris',
      link: '#'
    }
  ];

  const faqs = [
    {
      question: 'Comment puis-je créer un compte ?',
      answer: 'Cliquez sur "Commencer" en haut de la page et choisissez si vous êtes un coach ou un client. L\'inscription est gratuite et ne prend que 2 minutes.'
    },
    {
      question: 'Quel est le prix d\'Axend ?',
      answer: 'Nous proposons plusieurs plans tarifaires. Le plan Débutant est gratuit, le plan Pro à 29€/mois et le plan Expert à 79€/mois. Consultez notre page Tarifs pour plus de détails.'
    },
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace client. Aucune pénalité, aucun engagement.'
    },
    {
      question: 'Comment fonctionne le matching coach-client ?',
      answer: 'Notre algorithme intelligent analyse vos objectifs, préférences et disponibilités pour vous proposer les coachs les plus adaptés à votre profil.'
    },
    {
      question: 'Y a-t-il une application mobile ?',
      answer: 'Oui, Axend est disponible sur iOS et Android. Téléchargez l\'application pour accéder à toutes vos fonctionnalités en mobilité.'
    },
    {
      question: 'Comment puis-je devenir coach sur Axend ?',
      answer: 'Créez un compte coach, complétez votre profil avec vos certifications et commencez à recevoir des clients. Notre équipe valide chaque profil coach.'
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
            <Link href="/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">À propos</Link>
            <Link href="/contact" className="text-blue-600 font-semibold border-b-2 border-blue-600">Contact</Link>
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
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full border border-blue-200/50 backdrop-blur-sm mb-8">
            <span className="text-2xl">💬</span>
            <span className="text-sm font-medium text-blue-700">Contactez-nous</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent leading-tight mb-6">
            Parlons de votre
            <br />
            <span className="relative text-purple-600">projet fitness
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Notre équipe est là pour vous accompagner. Que vous soyez coach ou client, 
            nous sommes ravis de répondre à vos questions et vous aider à atteindre vos objectifs.
          </p>
        </div>

        {/* Contact Methods */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="group bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">{method.icon}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-gray-600 mb-4">{method.description}</p>
                
                <a
                  href={method.link}
                  className="inline-block text-blue-600 font-semibold hover:text-purple-600 transition-colors"
                >
                  {method.value}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Je suis un</label>
                      <select
                        name="userType"
                        value={formData.userType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="client">Client</option>
                        <option value="coach">Coach</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Sujet de votre message"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Décrivez votre demande en détail..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 font-semibold rounded-xl transition-all duration-300 ${
                      isSubmitting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Envoi en cours...
                      </div>
                    ) : (
                      'Envoyer le message'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-8">
              {/* Office Hours */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Horaires d\'ouverture</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <span className="text-gray-600">Lundi - Vendredi</span>
                    <span className="font-semibold text-gray-900">9h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <span className="text-gray-600">Samedi</span>
                    <span className="font-semibold text-gray-900">10h00 - 16h00</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <span className="text-gray-600">Dimanche</span>
                    <span className="font-semibold text-red-600">Fermé</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl">
                  <p className="text-sm text-blue-700">
                    <strong>Support urgent :</strong> Disponible 24h/7j via le chat live pour les clients Premium et Expert
                  </p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Liens utiles</h3>
                
                <div className="space-y-3">
                  <Link
                    href="/features"
                    className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/80 transition-all duration-200 group"
                  >
                    <span className="font-medium text-gray-700">Découvrir les fonctionnalités</span>
                    <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  <Link
                    href="/pricing"
                    className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/80 transition-all duration-200 group"
                  >
                    <span className="font-medium text-gray-700">Voir les tarifs</span>
                    <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  <Link
                    href="/auth/client/register"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all duration-200 group"
                  >
                    <span className="font-medium text-blue-700">Créer un compte gratuit</span>
                    <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Questions Fréquentes</h2>
            <p className="text-xl text-gray-600">Les réponses aux questions les plus courantes</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/80 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">Vous ne trouvez pas la réponse à votre question ?</p>
              <a
                href="mailto:hello@axend.fr"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
              >
                <span>📧</span>
                Contactez notre support
              </a>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 rounded-3xl p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Support</h2>
              <p className="text-lg text-gray-600">Des chiffres qui parlent de notre engagement</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">&lt; 2h</div>
                <div className="text-gray-700 font-semibold">Temps de réponse</div>
                <div className="text-sm text-gray-500 mt-1">En moyenne</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">98%</div>
                <div className="text-gray-700 font-semibold">Satisfaction</div>
                <div className="text-sm text-gray-500 mt-1">Support client</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-gray-700 font-semibold">Disponibilité</div>
                <div className="text-sm text-gray-500 mt-1">Plans Premium+</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">🏆</div>
                <div className="text-gray-700 font-semibold">Support Award</div>
                <div className="text-sm text-gray-500 mt-1">2025</div>
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
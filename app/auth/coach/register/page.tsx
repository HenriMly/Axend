'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from '@/lib/auth';

export default function CoachRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.signUpCoach(email, password, name);
      
      if (result.user) {
        if (!result.user.email_confirmed_at) {
          setSuccess('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
        } else {
          setSuccess('Compte créé avec succès !');
          setTimeout(() => router.push('/dashboard/coach'), 2000);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Erreur lors de l\'inscription';
      setError(message);
      console.error('Coach register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">👨‍🏋️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inscription Coach</h1>
          <p className="text-gray-600">Créez votre espace coach</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Votre nom"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="votre@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password || !name}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Création...</span>
              </div>
            ) : (
              'Créer mon compte coach'
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600 text-sm">
            Déjà un compte coach ?{' '}
            <Link href="/auth/coach/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </p>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-500 text-sm">
              Vous êtes un client ?{' '}
              <Link href="/auth/client/register" className="text-purple-600 hover:text-purple-700 font-medium">
                Inscription client
              </Link>
            </p>
          </div>
          
          <Link 
            href="/" 
            className="inline-block text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
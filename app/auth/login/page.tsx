'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const LoginForm: React.FC = () => {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { user, userProfile, signIn, loading } = useAuth();

    // Rediriger si déjà connecté
    useEffect(() => {
        if (!loading && user && userProfile) {
            if (userProfile.role === 'coach') {
                router.push('/dashboard/coach');
            } else if (userProfile.role === 'client') {
                router.push('/dashboard/client');
            }
        }
    }, [user, userProfile, loading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Example validation
        if (!form.email || !form.password) {
            setError('Tous les champs sont requis.');
            setIsLoading(false);
            return;
        }

        try {
            const data = await signIn(form.email, form.password);
            // If signIn succeeded but the profile is missing, show a hint
            if (data?.user && !userProfile) {
                setError(null);
                // show a temporary message in the UI
                setTimeout(() => {
                    // let the useEffect handle redirects after profile loads
                }, 300);
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Se connecter à votre compte
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Ou{' '}
                        <Link
                            href="/auth/register"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            créer un nouveau compte
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Adresse email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 sm:text-sm"
                                placeholder="Votre email"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 sm:text-sm"
                                placeholder="Votre mot de passe"
                                value={form.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                            <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link
                            href="/"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
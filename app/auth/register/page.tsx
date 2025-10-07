'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

const RegisterForm: React.FC = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'client', // 'coach' ou 'client'
        coachCode: '', // Pour rattacher un client à un coach
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Normalize inputs
        const normalizedEmail = form.email.trim().toLowerCase();

        // Validation
        if (!form.name || !normalizedEmail || !form.password || !form.confirmPassword) {
            setError('Tous les champs sont requis.');
            setIsLoading(false);
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            setError('Adresse email invalide.');
            setIsLoading(false);
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            setIsLoading(false);
            return;
        }

        if (form.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            setIsLoading(false);
            return;
        }

        if (form.role === 'client' && !form.coachCode) {
            setError('Le code coach est requis pour les clients.');
            setIsLoading(false);
            return;
        }

        try {
            console.debug('[Register] submitting', {
                normalizedEmail,
                role: form.role,
                coachCode: form.coachCode
            });
            let signupResult: any = null
            if (form.role === 'coach') {
                signupResult = await authService.signUpCoach(normalizedEmail, form.password, form.name);
            } else {
                signupResult = await authService.signUpClient(normalizedEmail, form.password, form.name, form.coachCode);
            }

            // If Supabase didn't return a user object (email confirmation or magic-link flow),
            // show a 'check your email' message instead of redirecting immediately.
            if (!signupResult || !signupResult.user || !signupResult.user.email_confirmed_at) {
                setSuccess('Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail pour confirmer votre compte.');
                return;
            }

            // Otherwise continue to homepage
            router.push('/');
        } catch (err: any) {
            const message = err?.message || err?.error || 'Erreur lors de l\'inscription. Veuillez réessayer.';
            setError(message);
            try { console.error('Registration error:', JSON.stringify(err)); } catch(e) { console.error('Registration error (raw):', err); }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Créer votre compte
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Ou{' '}
                        <Link
                            href="/auth/login"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            se connecter à un compte existant
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Sélection du rôle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Je suis un...
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm({...form, role: 'coach', coachCode: ''})}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        form.role === 'coach' 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="font-medium">Coach Sportif</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({...form, role: 'client'})}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        form.role === 'client' 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="font-medium">Client</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nom complet
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 sm:text-sm"
                                placeholder="Votre nom complet"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>
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
                                placeholder="votre@email.com"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Code coach pour les clients */}
                        {form.role === 'client' && (
                            <div>
                                <label htmlFor="coachCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Code du coach
                                </label>
                                <input
                                    id="coachCode"
                                    name="coachCode"
                                    type="text"
                                    required
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 sm:text-sm"
                                    placeholder="Code fourni par votre coach"
                                    value={form.coachCode}
                                    onChange={handleChange}
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Demandez ce code à votre coach sportif
                                </p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 sm:text-sm"
                                placeholder="Au moins 6 caractères"
                                value={form.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 sm:text-sm"
                                placeholder="Confirmez votre mot de passe"
                                value={form.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                            <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                        </div>
                    )}
                    {success && (
                        <div className="rounded-md bg-green-50 dark:bg-green-900 p-4">
                            <div className="text-sm text-green-700 dark:text-green-300">{success}</div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {isLoading ? 'Création du compte...' : `Créer mon compte ${form.role === 'coach' ? 'Coach' : 'Client'}`}
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

export default RegisterForm;
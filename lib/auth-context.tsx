"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (userId: string) => {
    try {
      return await authService.getUserProfile(userId);
    } catch (e) {
      console.error('[auth-context.fetchUserProfile] error:', e);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  const clearSession = async () => {
    console.log('[auth-context] Clearing session');
    setUser(null);
    setUserProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    // Handle possible redirect from email confirmation / magic link
    ;(async () => {
      try {
  // Supabase has a helper to parse and complete session from URL.
  // Use a cast to any because types may not include this helper in the current supabase-js version.
  const maybe = await (supabase.auth as any).getSessionFromUrl?.({ storeSession: true })
        if (maybe?.data?.session) {
          const sessUser = maybe.data.session.user
          setUser(sessUser ?? null)
          let profile = await fetchUserProfile(sessUser.id)

          // If profile missing, try to ensure it exists (clients row)
          if (!profile && sessUser) {
            try {
              await authService.ensureClientProfile(sessUser)
              profile = await fetchUserProfile(sessUser.id)
            } catch (e) {
              console.warn('[auth-context] ensureClientProfile failed:', e)
            }
          }

          setUserProfile(profile)
          setLoading(false)
          return
        }
      } catch (e) {
        // ignore: URL may not contain auth params
      }

      // Récupérer la session initiale - utiliser une approche plus robuste
      try {
        console.log('[auth-context] Initializing session...');

        // Attendre un peu pour que les cookies soient disponibles
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('[auth-context] Session result:', {
          hasSession: !!session,
          hasError: !!error,
          errorMessage: error?.message
        });

        // Si erreur de refresh token, nettoyer la session
        if (error && (error.message?.includes('refresh') || error.message?.includes('token'))) {
          console.warn('[auth-context] Invalid refresh token, clearing session:', error.message);
          await clearSession();
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          const sessUser = session.user
          console.log('[auth-context] User found, fetching profile for:', sessUser.id);
          let profile = await fetchUserProfile(sessUser.id);

          if (!profile && sessUser) {
            console.log('[auth-context] Profile missing, ensuring client profile...');
            try {
              await authService.ensureClientProfile(sessUser)
              profile = await fetchUserProfile(sessUser.id)
              console.log('[auth-context] Client profile ensured:', !!profile);
            } catch (e) {
              console.warn('[auth-context] ensureClientProfile failed:', e)
            }
          }

          console.log('[auth-context] Setting user profile:', profile?.role);
          setUserProfile(profile);
        } else {
          console.log('[auth-context] No session user, clearing profile');
          setUserProfile(null);
        }
      } catch (err: any) {
        console.error('[auth-context] getSession failed:', err);

        // Si c'est une erreur de refresh token, nettoyer la session
        if (err?.message?.includes('refresh') || err?.message?.includes('token')) {
          console.warn('[auth-context] Refresh token error, signing out');
          await clearSession();
        }
      } finally {
        setLoading(false);
      }
    })();
    // Écouter les changements d'authentification
    // Listen for auth state changes. Wrap handler to guarantee setLoading(false).
    let subscription: any = null;
    try {
      const res = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log('[auth-context] Auth state change:', event);
          
          // Si l'événement indique une erreur de token, nettoyer la session
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('[auth-context] Token refresh failed, clearing session');
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }

          const sessUser = session?.user ?? null
          setUser(sessUser);

          if (sessUser) {
            let profile = await fetchUserProfile(sessUser.id);

            if (!profile) {
              try {
                console.log('[auth-context] Creating missing client profile...');
                await authService.ensureClientProfile(sessUser);
                profile = await fetchUserProfile(sessUser.id);
                console.log('[auth-context] Client profile created:', profile);
              } catch (e) {
                console.warn('[auth-context] ensureClientProfile failed:', e);
              }
            }

            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
        } catch (handlerErr: any) {
          console.error('[auth-context.onAuthStateChange] handler error:', handlerErr);
          
          // Si erreur liée au refresh token, nettoyer la session
          if (handlerErr?.message?.includes('refresh') || handlerErr?.message?.includes('token')) {
            console.warn('[auth-context] Token error in handler, clearing session');
            await clearSession();
            return;
          }
        } finally {
          setLoading(false);
        }
      });

      // Supabase client returns { data: { subscription } } in newer versions
      if (res && (res as any).data && (res as any).data.subscription) {
        subscription = (res as any).data.subscription;
      } else if ((res as any).subscription) {
        subscription = (res as any).subscription;
      } else {
        subscription = null;
      }
    } catch (subErr) {
      console.error('[auth-context] onAuthStateChange subscription failed:', subErr);
      // Ensure loading state is cleared even if subscription fails
      setLoading(false);
    }

    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          throw new Error(
            'Votre email n\'a pas été confirmé. ' +
            'Vérifiez votre boîte mail ou contactez l\'administrateur.'
          );
        }
        throw error;
      }

      // Immediately set user in context so UI can react without waiting for onAuthStateChange
      if (data?.user) {
        setUser(data.user);
        // Try to load profile; may be null if profile row not yet created
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }

      return data;
    } catch (err) {
      console.error('[auth-context.signIn] error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      // Nettoyer complètement le localStorage Supabase
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      // Nettoyer les cookies Supabase côté client
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name.startsWith('sb-') || name.startsWith('sb:')) {
            document.cookie = `${name}=; path=/; max-age=0;`;
          }
        });
        // Nettoyer aussi le cookie sentinelle
        document.cookie = 'axend_sess=; path=/; max-age=0;';
      }

      // Faire une requête au serveur pour déclencher le middleware et nettoyer côté serveur
      try {
        await fetch('/api/debug-cookies', { method: 'GET' });
      } catch (e) {
        // Ignore les erreurs de fetch, c'est juste pour déclencher le middleware
      }
    } catch (error) {
      console.warn('[auth-context.signOut] Error during signOut:', error);
    }

    setUser(null);
    setUserProfile(null);
    router.push('/');
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook pour protéger les routes
export function useRequireAuth(redirectTo: string = '/') {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, userProfile, loading };
}

// Hook spécifique pour les clients
export function useRequireClient() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[useRequireClient] State check:', { user: !!user, userProfile: !!userProfile, loading, role: userProfile?.role });
    
    // Attendre que le chargement soit complètement terminé
    if (loading) return;
    
    // Si pas d'utilisateur après le chargement, rediriger vers login
    if (!user) {
      console.log('[useRequireClient] No user, redirecting to login');
      router.push('/auth/client/login');
      return;
    }
    
    // Si on a un utilisateur mais pas encore de profil, attendre un peu plus
    if (user && !userProfile) {
      // Ne pas rediriger immédiatement, laisser le temps au profil de se charger
      return;
    }
    
    // Si on a un profil mais que c'est pas un client, rediriger
    if (userProfile && userProfile.role !== 'client') {
      console.log('[useRequireClient] User is not a client, redirecting to coach dashboard');
      router.push('/dashboard/coach');
      return;
    }
  }, [userProfile, loading, user, router]);

  return { 
    user, 
    userProfile, 
    loading: loading || (user && !userProfile), // Étendre le loading si on a un user mais pas de profil
    isClient: userProfile?.role === 'client', 
    signOut 
  };
}

// Hook spécifique pour les coaches
export function useRequireCoach() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[useRequireCoach] State check:', { user: !!user, userProfile: !!userProfile, loading, role: userProfile?.role });
    
    // Attendre que le chargement soit complètement terminé
    if (loading) return;
    
    // Si pas d'utilisateur après le chargement, rediriger vers login
    if (!user) {
      console.log('[useRequireCoach] No user, redirecting to coach login');
      router.push('/auth/coach/login');
      return;
    }
    
    // Si on a un utilisateur mais pas encore de profil, attendre un peu plus
    if (user && !userProfile) {
      // Ne pas rediriger immédiatement, laisser le temps au profil de se charger
      return;
    }
    
    // Si on a un profil mais que c'est pas un coach, rediriger
    if (userProfile && userProfile.role !== 'coach') {
      console.log('[useRequireCoach] User is not a coach, redirecting to client dashboard');
      router.push('/dashboard/client');
      return;
    }
  }, [user, userProfile, loading, router]);

  return { 
    user, 
    userProfile, 
    loading: loading || (user && !userProfile), // Étendre le loading si on a un user mais pas de profil
    isCoach: userProfile?.role === 'coach', 
    signOut 
  };
}
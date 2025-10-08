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

      // Récupérer la session initiale
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const sessUser = session.user
          let profile = await fetchUserProfile(sessUser.id);

          if (!profile && sessUser) {
            try {
              await authService.ensureClientProfile(sessUser)
              profile = await fetchUserProfile(sessUser.id)
            } catch (e) {
              console.warn('[auth-context] ensureClientProfile failed:', e)
            }
          }

          setUserProfile(profile);
        }
      } catch (err) {
        console.error('[auth-context] getSession failed:', err);
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
        } catch (handlerErr) {
          console.error('[auth-context.onAuthStateChange] handler error:', handlerErr);
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
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
    
    if (!loading && !user) {
      console.log('[useRequireClient] No user, redirecting to login');
      router.push('/auth/client/login');
      return;
    }
    
    // Si on a un profil mais que c'est pas un client, rediriger
    if (!loading && userProfile && userProfile.role !== 'client') {
      console.log('[useRequireClient] User is not a client, redirecting to coach dashboard');
      router.push('/dashboard/coach');
      return;
    }
  }, [userProfile, loading, user, router]);

  return { 
    user, 
    userProfile, 
    loading, // Just use the original loading state
    isClient: userProfile?.role === 'client', 
    signOut 
  };
}

// Hook spécifique pour les coaches
export function useRequireCoach() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/coach/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'coach') {
      router.push('/dashboard/client');
    }
  }, [userProfile, loading, router]);

  return { user, userProfile, loading, isCoach: userProfile?.role === 'coach', signOut };
}
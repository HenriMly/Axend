'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
      // Essayer de récupérer le profil coach
      const { data: coach } = await supabase
        .from('coaches')
        .select('*, clients(*)')
        .eq('id', userId)
        .single();

      if (coach) {
        return { ...coach, role: 'coach' };
      }

      // Sinon essayer client
      const { data: client } = await supabase
        .from('clients')
        .select('*, coaches(name, email, coach_code)')
        .eq('id', userId)
        .single();

      if (client) {
        return { ...client, role: 'client' };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
    // Récupérer la session initiale
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
      }
      
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
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

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUserProfile(profile);
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
export function useRequireAuth(redirectTo: string = '/auth/login') {
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
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'client') {
      router.push('/dashboard/coach');
    }
  }, [userProfile, loading, router]);

  return { user, userProfile, loading, isClient: userProfile?.role === 'client', signOut };
}

// Hook spécifique pour les coaches
export function useRequireCoach() {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'coach') {
      router.push('/dashboard/client');
    }
  }, [userProfile, loading, router]);

  return { user, userProfile, loading, isCoach: userProfile?.role === 'coach', signOut };
}
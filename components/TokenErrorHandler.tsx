'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TokenErrorHandlerProps {
  children: React.ReactNode;
}

export function TokenErrorHandler({ children }: TokenErrorHandlerProps) {
  const [hasTokenError, setHasTokenError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.error?.message || event.message || '';
      if (message.includes('refresh') || 
          message.includes('token') ||
          message.includes('Invalid Refresh Token') ||
          message.includes('Refresh Token Not Found')) {
        console.warn('[TokenErrorHandler] Detected token error:', message);
        setHasTokenError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason) || '';
      if (message.includes('refresh') || 
          message.includes('token') ||
          message.includes('Invalid Refresh Token') ||
          message.includes('Refresh Token Not Found')) {
        console.warn('[TokenErrorHandler] Detected token rejection:', message);
        setHasTokenError(true);
      }
    };

    // Vérifier immédiatement s'il y a un problème de token au chargement
    const checkInitialTokenState = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase.auth.getSession();
        if (error && (error.message?.includes('refresh') || error.message?.includes('token'))) {
          console.warn('[TokenErrorHandler] Initial token check failed:', error.message);
          setHasTokenError(true);
        }
      } catch (e: any) {
        if (e?.message?.includes('refresh') || e?.message?.includes('token')) {
          console.warn('[TokenErrorHandler] Initial token check error:', e.message);
          setHasTokenError(true);
        }
      }
    };

    checkInitialTokenState();

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasTokenError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Session expirée
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Votre session a expiré. Veuillez vous reconnecter pour continuer.
          </p>
          <div className="space-y-3">
            <button 
              onClick={async () => {
                // Nettoyage complet
                localStorage.clear();
                sessionStorage.clear();
                
                // Forcer la déconnexion Supabase
                try {
                  const { supabase } = await import('@/lib/supabase');
                  await supabase.auth.signOut();
                } catch (e) {
                  console.warn('Error during forced signOut:', e);
                }
                
                // Redirection
                window.location.href = '/auth/login';
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Se reconnecter
            </button>
            <button 
              onClick={() => {
                setHasTokenError(false);
                window.location.reload();
              }}
              className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
            >
              Actualiser la page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
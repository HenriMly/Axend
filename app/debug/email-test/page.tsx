'use client';

import React, { useState } from 'react';
import { authService } from '@/lib/auth';

export default function EmailTest() {
  const [email, setEmail] = useState('test@example.com');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setStatus(null);
    setLoading(true);
    try {
      await authService.signUpCoach(email, 'Test1234', 'Mailtrap Test');
      setStatus('OK - signup request sent. Check your Mailtrap inbox.');
    } catch (err: any) {
      setStatus('ERROR: ' + (err?.message || JSON.stringify(err)));
      console.error('Email test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Envoyer un email de test (signup)</h2>
      <p className="mb-4 text-sm text-gray-600">Utilise la même logique que l'inscription pour déclencher l'envoi d'email de confirmation.</p>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSend} disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
      {status && <div className="mt-4 p-3 rounded bg-gray-100 dark:bg-gray-800">{status}</div>}
    </div>
  );
}

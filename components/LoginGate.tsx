import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface Props {
  children: (session: Session) => React.ReactNode;
}

const LoginGate: React.FC<Props> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { data, error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    if (error) setMessage(error.message);
    else if (mode === 'signup' && !data.session) setMessage('Check je inbox om je account te bevestigen.');
    setBusy(false);
  };

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-stone-400">Laden…</div>;
  }

  if (session) return <>{children(session)}</>;

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center p-6 text-stone-800">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <div className="text-3xl">🌱</div>
          <h1 className="text-2xl font-semibold tracking-tight">CrescoFlow</h1>
          <p className="text-sm text-stone-500">
            {mode === 'login' ? 'Log in om verder te gaan.' : 'Maak een account aan.'}
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="email" required autoComplete="email" placeholder="E-mail" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
          <input
            type="password" required minLength={8} placeholder="Wachtwoord" value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
        </div>

        {message && <p className="text-sm text-stone-600 bg-stone-100 rounded-md px-3 py-2">{message}</p>}

        <button
          type="submit" disabled={busy}
          className="w-full rounded-md bg-stone-900 text-white py-2 text-sm font-medium hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? 'Even geduld…' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
        </button>

        <button
          type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }}
          className="w-full text-sm text-stone-500 hover:text-stone-800"
        >
          {mode === 'login' ? 'Nog geen account? Registreer' : 'Al een account? Log in'}
        </button>
      </form>
    </div>
  );
};

export default LoginGate;

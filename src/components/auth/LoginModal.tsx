import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User as UserIcon, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, sessionExpiredMessage, clearSessionExpiredMessage } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearSessionExpiredMessage();
    setIsSubmitting(true);
    
    try {
      const result = await login(username, password);
      if (typeof result === 'object') {
        if (!result.success) {
          setError(result.error || 'Invalid username or password.');
        }
      } else if (!result) {
        setError('Invalid username or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all">
        {/* Header with Company Branding */}
        <div className="bg-gradient-to-r from-blue-800 via-sky-800 to-indigo-900 p-8 text-white text-center relative">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div className="inline-block px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[11px] font-bold tracking-widest uppercase text-sky-200 mb-2 border border-white/20">
            CADEPLOY
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Learning & Development Operations System
          </h1>
          <p className="text-xs text-sky-100 font-medium tracking-wide mt-2">
            Internal Operations Portal
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {sessionExpiredMessage && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{sessionExpiredMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold text-sm rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800/80 text-center space-y-0.5">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            © CADEPLOY Engineering Services
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Learning & Development Operations System
          </p>
        </div>
      </div>
    </div>
  );
};

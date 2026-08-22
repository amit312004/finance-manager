import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [data, setData] = useState({
        email: '',
        password: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(data.email, data.password);
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Invalid email or password';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

            <div className="max-w-md w-full bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-300 relative z-10">
                <div className="px-8 py-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-6">
                            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Welcome Back
                        </h2>
                        <p className="mt-3 text-lg text-slate-400 dark:text-slate-400">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-bold text-sm uppercase tracking-wider mb-1">Authentication Failed</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                className="appearance-none block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                placeholder="Email address"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                                    Password
                                </label>
                                <a href="#" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={data.password}
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                className="appearance-none block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-base font-bold text-slate-900 dark:text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Authenticating...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-sm text-slate-400 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to register');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

            <div className="max-w-md w-full bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-300 relative z-10">
                <div className="px-8 py-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-3 bg-fuchsia-500/10 rounded-2xl mb-6">
                            <svg className="w-8 h-8 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Let's Get Started
                        </h2>
                        <p className="mt-3 text-lg text-slate-400 dark:text-slate-400">
                            Join us and take control of your financial journey today.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-bold text-sm uppercase tracking-wider mb-1">Registration Failed</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-xs font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                Your Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                className="appearance-none block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-200"
                                placeholder="Full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="appearance-none block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-200"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                Create Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="appearance-none block w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all duration-200"
                                placeholder="Min 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-fuchsia-500/30 text-base font-bold text-slate-900 dark:text-white bg-fuchsia-600 hover:bg-fuchsia-500 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-fuchsia-500 transition-all duration-200"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-sm text-slate-400 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
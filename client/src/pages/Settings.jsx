import React, { useState, useEffect } from 'react';
import { User, LogOut, HandCoins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    const [monthlyIncome, setMonthlyIncome] = useState('');
    const [savingIncome, setSavingIncome] = useState(false);
    const [incomeMessage, setIncomeMessage] = useState('');

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                const res = await axios.get('/api/monthly-income', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setMonthlyIncome(res.data?.monthlyIncome ?? 0);
            } catch (error) {
                console.error("Failed to fetch monthly income", error);
            }
        };
        fetchIncome();
    }, []);

    const handleSaveIncome = async () => {
        setSavingIncome(true);
        setIncomeMessage('');
        try {
            const res = await axios.post('/api/monthly-income', { amount: monthlyIncome }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMonthlyIncome(res.data?.monthlyIncome ?? monthlyIncome);
            setIncomeMessage('Successfully updated monthly income!');
            setTimeout(() => setIncomeMessage(''), 3000);
        } catch (error) {
            setIncomeMessage('Failed to update income.');
            console.error(error);
        } finally {
            setSavingIncome(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-slate-400 dark:text-slate-400 mt-1">Manage your account preferences and configurations.</p>
                </div>
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl font-bold transition-colors border border-rose-500/20 shadow-sm w-fit">
                    <LogOut size={18} /> Sign Out
                </button>
            </div>

            <div className="space-y-6">

                {/* Profile Information Block */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <User size={20} className="text-blue-400" />
                        </div>
                        Profile Information
                    </h3>
                    <div className="space-y-6 max-w-lg">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white text-3xl font-black shadow-lg shadow-indigo-500/30 border border-white/10 uppercase">
                                {profile.name ? profile.name.charAt(0) : 'U'}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{profile.name || 'User'}</h4>
                                <p className="text-sm font-medium text-slate-400 dark:text-slate-400">{profile.email}</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Configurations Block */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <HandCoins size={20} className="text-emerald-400" />
                        </div>
                        Financial Configurations
                    </h3>
                    <div className="space-y-4 max-w-lg">
                        <p className="text-sm text-slate-400 dark:text-slate-400 mb-4 leading-relaxed">Set your baseline monthly salary or income goal. This amount will be injected into your dashboard automatically on the 1st of every month for highly accurate tracking.</p>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">Base Monthly Income (₹)</label>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="number"
                                    value={monthlyIncome}
                                    onChange={e => setMonthlyIncome(e.target.value)}
                                    placeholder="0.00"
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                />
                                <button
                                    onClick={handleSaveIncome}
                                    disabled={savingIncome || !monthlyIncome}
                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-400 dark:text-slate-500 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-colors whitespace-nowrap"
                                >
                                    {savingIncome ? 'Saving...' : 'Set Income'}
                                </button>
                            </div>
                            {incomeMessage && (
                                <p className={`mt-3 text-sm font-bold px-3 py-2 rounded-lg border flex items-center gap-2 ${incomeMessage.includes('Failed') ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                                    {incomeMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

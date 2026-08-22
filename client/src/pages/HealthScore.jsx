import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { Activity, HeartPulse, TrendingUp, HandCoins, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const HealthScore = () => {
    const { user } = useAuth();
    const { transactions, healthScoreData } = useTransactions();
    const { healthScore, breakdown, suggestion, loadingState, alertImpact } = healthScoreData;

    // Color theme based on score
    let scoreStyles = {
        gradient: "from-red-500 to-rose-600",
        shadow: "shadow-red-500/30",
        text: "text-rose-500",
        bgLight: "bg-red-500/10",
        border: "border-red-500/30"
    };

    if (healthScore >= 80) {
        scoreStyles = {
            gradient: "from-emerald-400 to-teal-500",
            shadow: "shadow-emerald-500/30",
            text: "text-emerald-400",
            bgLight: "bg-emerald-500/10",
            border: "border-emerald-500/30"
        };
    } else if (healthScore >= 50) {
        scoreStyles = {
            gradient: "from-amber-400 to-orange-500",
            shadow: "shadow-amber-500/30",
            text: "text-amber-400",
            bgLight: "bg-amber-500/10",
            border: "border-amber-500/30"
        };
    }

    if (loadingState) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="relative bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="relative z-10 flex flex-col items-start gap-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Financial Health Score
                    </h1>
                    <p className="text-slate-400 dark:text-slate-400 text-base">
                        Your overall financial standing based on your current transactions.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Score Card */}
                <div className={`lg:col-span-1 relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border ${scoreStyles.border} p-8 flex flex-col items-center justify-center text-center group`}>
                    <div className={`absolute inset-0 bg-gradient-to-b ${scoreStyles.gradient} opacity-5`}></div>

                    <div className="relative z-10 w-48 h-48 rounded-full flex items-center justify-center mb-6">
                        {/* CSS Pulse Ring */}
                        <div className={`absolute inset-0 rounded-full border-4 ${scoreStyles.border} opacity-20 group-hover:scale-110 transition-transform duration-700`}></div>
                        <div className={`absolute inset-4 rounded-full border-4 ${scoreStyles.border} opacity-40 group-hover:scale-105 transition-transform duration-500 delay-75`}></div>

                        <div className={`relative w-36 h-36 rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center z-10`}>
                            <span className={`text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br ${scoreStyles.gradient}`}>
                                {healthScore}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest mt-1">/ 100</span>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h2 className={`text-2xl font-bold mb-2 ${scoreStyles.text}`}>{breakdown.stat}</h2>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${scoreStyles.bgLight} ${scoreStyles.text}`}>
                            <Sparkles size={16} />
                            <span className="text-sm font-semibold">{transactions.length > 0 ? "Score Updated" : "No Data Yet"}</span>
                        </div>
                    </div>
                </div>

                {/* Score Breakdown & Suggestions */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Suggestion Alert */}
                    <div className={`p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative`}>
                        <div className="flex gap-4">
                            <div className={`p-3 rounded-2xl ${scoreStyles.bgLight} h-fit`}>
                                <AlertCircle className={`w-6 h-6 ${scoreStyles.text}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Suggestion</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">
                                    {suggestion}
                                </p>
                                {!loadingState && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Active alerts: {alertImpact?.critical || 0} critical, {alertImpact?.warning || 0} warning
                                        {' '}| Score penalty: -{alertImpact?.penalty || 0}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Details */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Activity className="text-indigo-400" />
                            Score Breakdown
                        </h3>

                        <div className="space-y-6">
                            {/* Savings Metric */}
                            <div className="relative">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Savings Rate</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Target &gt; 20%</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-indigo-400">{breakdown.savings} / 40</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(breakdown.savings / 40) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Budget Metric */}
                            <div className="relative">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                            <HandCoins size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Budget Adherence</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Staying within limits</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-purple-400">{breakdown.budget} / 40</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(breakdown.budget / 40) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Tracking Activity */}
                            <div className="relative">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Tracking Consistency</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Recent logs in current month</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-cyan-400">{breakdown.activity} / 20</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(breakdown.activity / 20) * 100}%` }}></div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthScore;

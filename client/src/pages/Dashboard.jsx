import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReportTemplate from '../components/ReportTemplate';
import axios from 'axios';
import { 
    Wallet,
    TrendingUp,
    TrendingDown,
    Activity,
    Plus,
    RefreshCcw,
    Zap,
    AlertTriangle,
    Bell,
    Edit,
    Trash2
} from 'lucide-react';
import { AddTransactionModal } from '../components/ui/add-transaction-modal';

const Dashboard = () => {
    const { user } = useAuth();
    const { transactions, addTransaction, deleteTransaction, editTransaction, budgets, smartAlerts, healthScoreData } = useTransactions();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [monthlyIncomeSetting, setMonthlyIncomeSetting] = useState(0);
    const reportRef = useRef();

    const getMonthKey = (value) => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchMonthlyIncome = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get('/api/monthly-income', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMonthlyIncomeSetting(Number(res.data?.monthlyIncome || 0));
            } catch (error) {
                console.error('Failed to load monthly income setting', error);
            }
        };

        fetchMonthlyIncome();
    }, []);

    const currentMonthTransactions = useMemo(() => {
        const currentMonthKey = getMonthKey(new Date());
        return (transactions || []).filter(t => {
            const txMonthKey = getMonthKey(t.date);
            return Boolean(txMonthKey) && Boolean(currentMonthKey) && txMonthKey === currentMonthKey;
        });
    }, [transactions]);

    // Calculate Exceeded Budgets (Memoized)
    const exceededBudgets = useMemo(() => {
        if (!budgets || !transactions) return [];
        
        const currentMonthExpenses = currentMonthTransactions.filter(t =>
            (t.type || '').toLowerCase() === 'expense'
        );

        const spendMap = {};
        currentMonthExpenses.forEach(t => {
            const cat = (t.category || 'Uncategorized').trim(); 
            // Case insensitive matching for better accuracy
            const key = Object.keys(spendMap).find(k => k.toLowerCase() === cat.toLowerCase()) || cat;
            spendMap[key] = (spendMap[key] || 0) + Number(t.amount);
        });

        return budgets.filter(b => {
            // Find spending for this budget category (case-insensitive)
            const catKey = Object.keys(spendMap).find(k => k.toLowerCase() === b.category.toLowerCase());
            const spent = spendMap[catKey] || 0;
            return spent > b.limit;
        });
    }, [currentMonthTransactions, budgets, transactions]);

    // Summary Calculations
    const stats = useMemo(() => {
        const actualIncome = currentMonthTransactions.filter(t => (t.type || '').toLowerCase() === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const expense = currentMonthTransactions.filter(t => (t.type || '').toLowerCase() === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const income = monthlyIncomeSetting > 0 ? monthlyIncomeSetting : actualIncome;
        const cashFlow = income; 
        const retentionRate = income > 0 ? ((income - expense) / income) * 100 : 0;

        return {
            actualIncome,
            income,
            expense,
            cashFlow,
            retentionRate
        };
    }, [currentMonthTransactions, monthlyIncomeSetting]);

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    }

    const handleSaveTransaction = async (data) => {
        if (editingTransaction) {
            await editTransaction({ ...data, id: editingTransaction._id || editingTransaction.id });
        } else {
            await addTransaction(data);
        }
        setIsAddModalOpen(false);
        setEditingTransaction(null);
    };

    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setIsAddModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            await deleteTransaction(id);
        }
    };


    
    return (
        <div className='p-6 space-y-6 bg-slate-900 min-h-screen text-slate-50'>
            {/* Budget Alert Banner */}
            {exceededBudgets.length > 0 && (
                <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 flex items-center justify-between animate-in slide-in-from-top-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <AlertTriangle className="text-red-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-500 text-lg">Budget Exceeded</h3>
                            <p className="text-sm text-red-400">
                                You have exceeded limits for: <span className="font-bold underline">{exceededBudgets.map(b => b.category).join(', ')}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Banner */}
            <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 p-8 shadow-2xl border border-indigo-500/20'>
                <div className='relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
                    <div>
                        <div className='flex items-center gap-2 mb-2'>
                            <Zap size={16} className='text-yellow-400 fill-yellow-400' />
                            <span className='text-xs font-bold tracking-wider text-indigo-200 uppercase'>
                                Welcome {user?.name || 'User'} to Finora
                            </span>
                        </div>
                        <h1 className='text-4xl font-bold text-white mb-2'>Dashboard</h1>
                        <p className='text-indigo-200 text-sm max-w-xl'>
                            Here is your latest financial breakdown and AI analysis, {user?.name || 'User'}.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className='bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all transform hover:scale-105'
                    >
                        <Plus size={20} />
                        New Entry
                    </button>
                </div>
                
                {/* Background Pattern */}
                <div className='absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl'></div>
                <div className='absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl'></div>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {/* Monthly Income */}
                <div className='bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-all'>
                    <div className='w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4'>
                        <Wallet className='text-blue-400' size={24} />
                    </div>
                    <p className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1'>Monthly Income</p>
                    <h3 className='text-2xl font-bold text-white'>{formatCurrency(stats.income)}</h3>
                </div>

                {/* Total Cash Flow */}
                <div className='bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-all'>
                    <div className='w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4'>
                        <TrendingUp className='text-green-400' size={24} />
                    </div>
                    <p className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1'>Total Cash Flow</p>
                    <h3 className='text-2xl font-bold text-white'>{formatCurrency(stats.cashFlow)}</h3>
                </div>

                {/* Total Outflow */}
                <div className='bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-all'>
                    <div className='w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4'>
                        <TrendingDown className='text-orange-400' size={24} />
                    </div>
                    <p className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1'>Total Outflow</p>
                    <h3 className='text-2xl font-bold text-white'>{formatCurrency(stats.expense)}</h3>
                </div>

                {/* Retention Rate */}
                <div className='bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-all'>
                    <div className='w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4'>
                        <Activity className='text-purple-400' size={24} />
                    </div>
                    <p className='text-slate-400 text-xs font-bold uppercase tracking-wider mb-1'>Retention Rate</p>
                    <h3 className='text-2xl font-bold text-white'>{stats.retentionRate.toFixed(1)}%</h3>
                </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                
                {/* Left Column: Smart Alerts */}
                <div className='lg:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm'>
                    <div className='mb-6'>
                        <div className='flex items-center gap-2 mb-2'>
                            <div className='p-2 bg-amber-500/10 rounded-lg'>
                                <Bell size={16} className='text-amber-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-white'>Smart Alerts</h3>
                        </div>
                        <p className='text-sm text-slate-400'>Budget risk, spending spikes, recurring dues, and health-score impact</p>
                        {!healthScoreData?.loadingState && (
                            <p className='text-xs text-slate-500 mt-2'>
                                Health score impact: -{healthScoreData?.alertImpact?.penalty || 0} points
                                {' '}({healthScoreData?.alertImpact?.critical || 0} critical, {healthScoreData?.alertImpact?.warning || 0} warning)
                            </p>
                        )}
                    </div>
                    <div className='w-full bg-gradient-to-br from-slate-900/20 to-slate-800/10 rounded-xl p-4 min-h-[320px]'>
                        {smartAlerts.length === 0 ? (
                            <div className='rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300'>
                                Everything looks healthy right now. No urgent alerts.
                            </div>
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                {smartAlerts.map((alert, idx) => {
                                    const tone = alert.level === 'critical'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                        : alert.level === 'warning'
                                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                            : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                    return (
                                        <div key={`${alert.title}-${idx}`} className={`rounded-xl border p-3 ${tone}`}>
                                            <p className='text-sm font-bold'>{alert.title}</p>
                                            <p className='text-xs mt-1 opacity-90'>{alert.message}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Recurring Transactions */}
                <div className='bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex flex-col'>
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <div className='p-2 bg-indigo-500/10 rounded-lg w-fit mb-2'>
                                <RefreshCcw size={16} className='text-indigo-400' />
                            </div>
                            <h3 className='text-lg font-semibold text-white'>Recurring Transactions</h3>
                        </div>
                    </div>

                    <p className='text-sm text-slate-400 mb-4'>Your active automated schedules.</p>

                    <div className='space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar'>
                         {/* Dynamic Data Only */}
                        {(transactions.filter(t => t.isRecurring).length === 0) ? (
                            <div className='flex items-center justify-center h-full text-slate-500 text-sm'>
                                No recurring transactions found.
                            </div>
                        ) : (
                            transactions.filter(t => t.isRecurring).slice(0, 5).map((t, i) => (
                                <div key={t._id || t.id || i} className='group flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800 transition-colors'>
                                    <div>
                                        <p className='text-sm font-bold text-white'>{t.description}</p>
                                        <div className='flex items-center gap-2 mt-1'>
                                            <span className='text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300'>
                                                {t.recurrenceInterval || 'Monthly'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className='flex items-center gap-3'>
                                        <div className='text-right'>
                                            <span className={'block font-bold ' + (t.type?.toLowerCase() === 'income' ? 'text-emerald-400' : 'text-slate-200')}>
                                                {t.type?.toLowerCase() === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                        </div>

                                         {/* Actions - visible on hover */}
                                         <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto'>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(t);
                                                }}
                                                className='p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400 cursor-pointer pointer-events-auto'
                                                title="Edit"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(t._id || t.id);
                                                }}
                                                className='p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 cursor-pointer pointer-events-auto'
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <AddTransactionModal 
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingTransaction(null);
                }}
                onSave={handleSaveTransaction}
                initialData={editingTransaction}
            />
        </div>
    );
};

export default Dashboard;

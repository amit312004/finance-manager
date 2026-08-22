import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Target, Trash2, Edit2, AlertCircle, Check, X } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';

export default function BudgetsPage() {
    const { transactions } = useTransactions();

    const getMonthKey = (value) => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    };

    const normalizeCategory = (value) => {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const isCategoryMatch = (transactionCategory, budgetCategory) => {
        const tx = normalizeCategory(transactionCategory);
        const bd = normalizeCategory(budgetCategory);

        if (!tx || !bd) return false;
        if (tx === bd) return true;

        const txRoot = tx.endsWith('ies') ? `${tx.slice(0, -3)}y` : tx.endsWith('s') ? tx.slice(0, -1) : tx;
        const bdRoot = bd.endsWith('ies') ? `${bd.slice(0, -3)}y` : bd.endsWith('s') ? bd.slice(0, -1) : bd;
        return txRoot === bdRoot;
    };

    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('/api/budgets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBudgets(res.data);
        } catch (err) {
            console.error('Failed to fetch budgets', err);
        } finally {
            setLoading(false);
        }
    };

    const [newBudget, setNewBudget] = useState({ category: '', limit: '' });
    const [inlineEditing, setInlineEditing] = useState(null);
    const [inlineData, setInlineData] = useState({ category: '', limit: '' });
    const [saveState, setSaveState] = useState('idle');
    const [toasts, setToasts] = useState([]);
    const [notifiedBudgets, setNotifiedBudgets] = useState(new Set());
    const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));

    const monthOptions = useMemo(() => {
        const keys = new Set();
        const currentMonthKey = getMonthKey(new Date());
        if (currentMonthKey) keys.add(currentMonthKey);

        (transactions || []).forEach((tx) => {
            const monthKey = getMonthKey(tx?.date);
            if (monthKey) keys.add(monthKey);
        });

        return Array.from(keys)
            .sort((a, b) => b.localeCompare(a))
            .map((key) => {
                const [yearText, monthText] = key.split('-');
                const labelDate = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
                return {
                    key,
                    label: labelDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
                };
            });
    }, [transactions]);

    const selectedMonthLabel = useMemo(() => {
        const option = monthOptions.find((m) => m.key === selectedMonth);
        if (option) return option.label;

        const [yearText, monthText] = String(selectedMonth || '').split('-');
        if (!yearText || !monthText) return 'Selected Month';

        const fallbackDate = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
        if (Number.isNaN(fallbackDate.getTime())) return 'Selected Month';
        return fallbackDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    }, [monthOptions, selectedMonth]);

    const addToast = (message, type = 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000); // 5 sec auto dismiss
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addBudget = async (e) => {
        e.preventDefault();
        if (!newBudget.category || newBudget.limit === '') {
            addToast('Please fill in all fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = { category: newBudget.category.trim(), limit: parseFloat(newBudget.limit) };

            const res = await axios.post('/api/budgets', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBudgets(prev => [res.data, ...prev]);
            setNewBudget({ category: '', limit: '' });
            addToast('Budget added successfully', 'success');
        } catch (err) {
            console.error(err);
            addToast(err.response?.data?.error || 'Failed to save budget');
        }
    };

    const cancelInlineEdit = () => {
        setInlineEditing(null);
        setInlineData({ category: '', limit: '' });
        setSaveState('idle');
    };

    const openInlineEdit = (budget) => {
        const bId = String(budget._id || budget.id || '').trim();
        if (!bId) {
            addToast('Budget ID is missing. Unable to edit.');
            return;
        }

        setInlineEditing(bId);
        setInlineData({
            category: budget.category || '',
            limit: budget.limit ?? ''
        });
        setSaveState('idle');
    };

    const triggerOpenInlineEdit = (budget) => {
        if (!budget) return;
        if (saveState === 'saving') return;
        openInlineEdit(budget);
    };

    const triggerSaveInlineEdit = (id) => {
        if (!id) return;
        if (saveState === 'saving') return;
        void saveInlineEdit(id);
    };

    const saveInlineEdit = async (id) => {
        try {
            setSaveState('saving');

            if (!inlineData || inlineData.limit === '') {
                addToast('Please provide valid category and limit');
                setSaveState('idle');
                return;
            }

            const token = localStorage.getItem('token');
            const categoryValue = (inlineData.category || '').trim();
            const limitValue = parseFloat(inlineData.limit);

            if (!categoryValue) {
                addToast('Category name is required');
                setSaveState('idle');
                return;
            }

            if (Number.isNaN(limitValue) || limitValue <= 0) {
                addToast('Budget limit must be greater than 0');
                setSaveState('idle');
                return;
            }

            const payload = { category: categoryValue, limit: limitValue };

            const res = await axios.put(`/api/budgets/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data) {
                // Refresh full list to ensure consistency
                await fetchBudgets();

                cancelInlineEdit();
                addToast('Budget updated successfully', 'success');
            }
        } catch (err) {
            setSaveState('idle');
            addToast(err.response?.data?.error || 'Failed to update budget limit');
        }
    };

    const deleteBudget = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/budgets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBudgets(prev => prev.filter(b => (b.id || b._id) !== id));
        } catch (err) {
            console.error(err);
            addToast('Failed to delete budget');
        }
    };

    // 2. Accurate Calculation Engine
    const { enrichedBudgets, totalLimit, totalSpent } = useMemo(() => {
        // Calculate expenses for selected month
        const selectedMonthExpenses = (transactions || []).filter(t => {
            if (!t || !t.date) return false;
            const isExpense = t.type?.toLowerCase() === 'expense';
            const txMonthKey = getMonthKey(t.date);
            if (!txMonthKey || !selectedMonth) return false;
            const isSelectedMonth = txMonthKey === selectedMonth;
            return isExpense && isSelectedMonth;
        });

        let tLimit = 0;
        let tSpent = 0;

        const enriched = budgets.map(b => {
            const spent = selectedMonthExpenses
                .filter(tx => isCategoryMatch(tx.category, b.category))
                .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

            const budgetLimit = Number(b.limit || 0);
            tLimit += budgetLimit;
            tSpent += spent;

            return {
                ...b,
                spent
            };
        });

        return { enrichedBudgets: enriched, totalLimit: tLimit, totalSpent: tSpent };
    }, [transactions, budgets, selectedMonth]);

    useEffect(() => {
        setNotifiedBudgets(new Set());
    }, [selectedMonth]);

    const budgetAlerts = useMemo(() => {
        return enrichedBudgets
            .filter(b => Number(b.limit || 0) > 0 && Number(b.spent || 0) > 0)
            .map(b => ({
                ...b,
                utilization: (Number(b.spent || 0) / Number(b.limit || 0)) * 100,
            }))
            .filter(b => b.utilization >= 80)
            .sort((a, b) => b.utilization - a.utilization);
    }, [enrichedBudgets]);

    // 3. Automated over-budget checking
    useEffect(() => {
        const newNotified = new Set(notifiedBudgets);
        let triggered = false;

        enrichedBudgets.forEach(b => {
            const bId = b.id || b._id;
            if (b.spent > b.limit && !newNotified.has(bId)) {
                addToast(`You have exceeded your ${b.category} budget by ₹${(b.spent - b.limit).toLocaleString('en-IN')}!`, 'error');
                newNotified.add(bId);
                triggered = true;
            }
        });

        if (triggered) {
            setNotifiedBudgets(newNotified);
        }
    }, [enrichedBudgets]); // Notice this runs anytime transactions or budgets updates!

    const totalPercent = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
    const isTotalOver = totalSpent > totalLimit;

    return (
        <div className="space-y-6 relative animate-in fade-in duration-500">
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <div key={toast.id} className="animate-in slide-in-from-right-8 fade-in duration-300 flex items-center gap-3 bg-rose-500/90 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-2xl shadow-rose-500/20 backdrop-blur-md border border-rose-500">
                        <AlertCircle size={20} />
                        <span className="font-medium text-sm">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-2 hover:bg-black/20 p-1 rounded-full transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Budgets</h1>
                    <p className="text-slate-400 dark:text-slate-400 mt-1">Track and manage your spending limits with pinpoint accuracy for {selectedMonthLabel}.</p>
                </div>
                <div className="w-full md:w-auto md:min-w-[240px]">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Viewing Month</label>
                    <select
                        value={selectedMonth || ''}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {monthOptions.map((month) => (
                            <option key={month.key} value={month.key}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 4. Enhanced UI: Overall Summary Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 justify-between">
                    <div className="flex-1 w-full">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Target className="text-indigo-400" />
                            Overall Budget Health ({selectedMonthLabel})
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                            <div>
                                <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Total Limit</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white">₹{totalLimit.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Total Spent</p>
                                <p className={`text-3xl font-black ${isTotalOver ? 'text-rose-400' : 'text-emerald-400'}`}>₹{totalSpent.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Remaining</p>
                                <p className={`text-3xl font-black ${isTotalOver ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                    {isTotalOver ? '-₹' : '₹'}{Math.abs(totalLimit - totalSpent).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-400 dark:text-slate-400">Consumption Rate</span>
                                <span className={isTotalOver ? 'text-rose-400' : 'text-indigo-300'}>{totalPercent.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 w-full bg-slate-50 dark:bg-slate-950/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${isTotalOver ? 'bg-rose-500' : totalPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${totalPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {budgetAlerts.length > 0 && (
                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 md:p-5 shadow-lg shadow-amber-500/10">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-amber-500/20 p-2 text-amber-300">
                            <AlertCircle size={18} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold text-amber-100">Budget Warning</h3>
                            <p className="mt-1 text-sm text-amber-100/80">
                                {budgetAlerts.length === 1
                                    ? `1 budget category is at or above 80% utilization in ${selectedMonthLabel}. Review it now to avoid exceeding the limit.`
                                    : `${budgetAlerts.length} budget categories are at or above 80% utilization in ${selectedMonthLabel}. Review them now to avoid exceeding the limits.`}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {budgetAlerts.slice(0, 4).map(alert => (
                                    <span
                                        key={alert._id || alert.id || alert.category}
                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${alert.spent > alert.limit ? 'bg-rose-500/20 text-rose-200' : 'bg-amber-500/20 text-amber-100'}`}
                                    >
                                        <span>{alert.category}</span>
                                        <span>
                                            {Math.min(alert.utilization, 999).toFixed(0)}%
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Budget Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 h-fit">
                    <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                            <Plus size={24} className="text-emerald-400" />
                        </div>
                        Create Budget
                    </h3>
                    <form onSubmit={addBudget} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">Category (Exact Name)</label>
                            <input
                                type="text"
                                placeholder="e.g. Food, Housing"
                                value={newBudget.category}
                                onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">Monthly Limit (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newBudget.limit}
                                onChange={e => setNewBudget({ ...newBudget, limit: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button type="submit" className="flex-1 px-4 py-3 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg transition-colors bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30">
                                Add Budget
                            </button>
                        </div>
                    </form>
                </div>

                {/* Active Budgets List */}
                <div className="lg:col-span-2 space-y-4">
                    {inlineEditing && (
                        <div className="px-4 py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 text-sm font-semibold flex items-center justify-between gap-3">
                            <span>Editing budget is active. Update category/limit and save changes.</span>
                            <button
                                type="button"
                                onClick={cancelInlineEdit}
                                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {enrichedBudgets.map(budget => {
                        const bId = String(budget._id || budget.id || `fallback-${budget.category}`);
                        const percent = Math.min((budget.spent / budget.limit) * 100, 100);
                        const isOver = budget.spent > budget.limit;
                        const remaining = budget.limit - budget.spent;

                        return (
                            <div
                                key={bId}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700 group"
                                onDoubleClick={() => triggerOpenInlineEdit(budget)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className={`p-3 rounded-2xl shadow-lg flex-shrink-0 ${isOver ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'}`}>
                                            <Target size={24} />
                                        </div>
                                        {inlineEditing === bId ? (
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="flex flex-col md:flex-row gap-2">
                                                    <input
                                                        type="text"
                                                        value={inlineData.category}
                                                        onChange={(e) => setInlineData({ ...inlineData, category: e.target.value })}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveInlineEdit(bId);
                                                            if (e.key === 'Escape') cancelInlineEdit();
                                                        }}
                                                        autoFocus
                                                        className="px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm font-bold w-full"
                                                        placeholder="Category"
                                                    />
                                                    <div className="flex items-center gap-2 w-full md:max-w-[180px]">
                                                        <span className="text-sm font-bold text-slate-400">₹</span>
                                                        <input
                                                            type="number"
                                                            value={inlineData.limit}
                                                            onChange={(e) => setInlineData({ ...inlineData, limit: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveInlineEdit(bId);
                                                                if (e.key === 'Escape') cancelInlineEdit();
                                                            }}
                                                            className="px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm font-bold w-full"
                                                            placeholder="Limit"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400">Editing mode active. Press Enter to save or Esc to cancel.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-900 dark:text-white break-all">{budget.category}</h4>
                                                <p className="text-sm text-slate-400 dark:text-slate-400">{budget.period} Budget</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 ml-2 flex-shrink-0">
                                        {inlineEditing === bId ? (
                                            <>
                                                <button
                                                    onClick={() => triggerSaveInlineEdit(bId)}
                                                    onMouseDown={() => triggerSaveInlineEdit(bId)}
                                                    onPointerDown={() => triggerSaveInlineEdit(bId)}
                                                    disabled={saveState === 'saving'}
                                                    className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                    title="Save Budget"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button onClick={cancelInlineEdit} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors" title="Cancel">
                                                    <X size={20} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerOpenInlineEdit(budget);
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        triggerOpenInlineEdit(budget);
                                                    }}
                                                    onPointerDown={(e) => {
                                                        e.stopPropagation();
                                                        triggerOpenInlineEdit(budget);
                                                    }}
                                                    className="relative z-10 p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-400 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                                    title="Edit Budget"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button onClick={() => deleteBudget(bId)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-400 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Delete Budget">
                                                    <Trash2 size={20} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 dark:text-slate-400">Spent: <b className="text-slate-700 dark:text-slate-200">₹{budget.spent.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</b></span>
                                        <span className="text-slate-400 dark:text-slate-400">Limit: <b className="text-slate-700 dark:text-slate-200">₹{budget.limit.toLocaleString('en-IN')}</b></span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${percent}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 w-full h-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>

                                    {isOver ? (
                                        <div className="flex justify-between items-center text-sm font-medium text-rose-400 mt-2 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                                            <span className="flex items-center gap-1.5"><AlertCircle size={16} /> Over budget!</span>
                                            <span>Exceeded by ₹{Math.abs(remaining).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center text-sm font-medium text-slate-400 dark:text-slate-400 mt-2 px-1">
                                            <span className="text-emerald-400">{percent > 0 ? `${percent.toFixed(0)}% Utilized` : '0% Utilized'}</span>
                                            <span>₹{Math.abs(remaining).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Remaining</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {enrichedBudgets.length === 0 && (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-300 dark:border-slate-700">
                                <Target size={32} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">No active budgets</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create one to get started tracking.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

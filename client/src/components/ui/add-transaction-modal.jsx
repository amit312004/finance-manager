import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, Input } from './base';
import { X, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';

export function AddTransactionModal({ isOpen, onClose, onSave, initialData }) {
  const { transactions, budgets } = useTransactions(); // Access context directly
  const [warning, setWarning] = useState(null);

  const toInputDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? new Date().toISOString().split('T')[0]
      : parsed.toISOString().split('T')[0];
  };

  const defaultData = {
    description: '',
    amount: '',
    type: 'Expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurrenceInterval: 'monthly'
  };

  const [formData, setFormData] = useState(defaultData);

  useEffect(() => {
    if (isOpen) {
      setWarning(null); // Reset warning on open
      if (initialData) {
        setFormData({
          ...defaultData,
          ...initialData,
          date: initialData.date ? toInputDate(initialData.date) : defaultData.date
        });
      } else {
        setFormData(defaultData);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    
    // Budget Check Logic
    if (formData.type === 'Expense' && !warning) {
         const budget = budgets.find(b => (b.category || '').toLowerCase() === (formData.category || '').toLowerCase());
         
         if (budget) {
             const now = new Date();
             
             // Calculate current month's total for this category
             const currentSpent = transactions
                .filter(t => {
                    // Exclude current transaction if editing
                    if (initialData && (t._id === initialData._id || t.id === initialData.id)) return false;

                    const d = new Date(t.date);
                    return !isNaN(d.getTime()) && 
                           d.getMonth() === now.getMonth() && 
                           d.getFullYear() === now.getFullYear() && 
                           (t.type || '').toLowerCase() === 'expense' &&
                           (t.category || '').toLowerCase() === (formData.category || '').toLowerCase();
                })
                .reduce((acc, t) => acc + Number(t.amount), 0);

             if ((currentSpent + amount) > budget.limit) {
                 setWarning(`Wait! This will exceed your ${budget.category} budget (Limit: ₹${budget.limit}, Current: ₹${currentSpent}).`);
                 return; 
             }
         }
    }

    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : null
    });
    setWarning(null);
    onClose();
    setFormData(defaultData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-extrabold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          {initialData ? 'Edit Transaction' : 'Add Transaction'}
        </h2>
        
        {warning && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-semibold text-orange-700">{warning}</p>
                </div>
                <div className="flex justify-end gap-3 w-full">
                    <button 
                        type="button" 
                        onClick={() => setWarning(null)}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Edit
                    </button>
                    <button 
                        type="button" 
                        onClick={() => {
                            onSave({
                              ...formData,
                              amount: parseFloat(formData.amount),
                              recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : null
                            });
                            setWarning(null);
                            onClose();
                            setFormData(defaultData);
                        }} 
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
                    >
                        Yes, Add Anyway
                    </button>
                </div>
            </div>
        )}

        {!warning && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="block text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-2">Description</label>
            <input
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="e.g. Grocery Shopping"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-2">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-2">Type</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
          </div>

            <div>
              <label className="block text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-2">Category</label>
            <input
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              required
              placeholder="e.g. Food, Rent, Salary"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

            <div>
              <label className="block text-sm font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors [color-scheme:dark]"
            />
          </div>

            {/* Recurring Transaction Controls */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-300 dark:border-slate-700/50 mt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <RefreshCcw size={16} className={formData.isRecurring ? "text-indigo-400" : "text-slate-400 dark:text-slate-500"} />
                Make this a recurring transaction
              </span>
            </label>

            {formData.isRecurring && (
              <div className="mt-4 pl-8 transition-all animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold tracking-wider text-slate-400 dark:text-slate-400 left uppercase mb-2">Repeat Interval</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                  value={formData.recurrenceInterval}
                  onChange={e => setFormData({ ...formData, recurrenceInterval: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

            <button type="submit" className="w-full mt-4 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-colors">
              {initialData ? 'Save Changes' : 'Add Transaction'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

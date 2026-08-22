import React, { useMemo, useState } from 'react';
import { Card, Button, Badge } from '@/components/ui/base';
import { Search, Download, Trash2, Edit, Plus, Filter, ArrowUpDown, RefreshCcw, Check, X, Calendar } from 'lucide-react';
import { AddTransactionModal } from '@/components/ui/add-transaction-modal';
import { useTransactions } from '@/context/TransactionContext';

export default function TransactionsPage() {
  const [selected, setSelected] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});
  const [saveState, setSaveState] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const { transactions, deleteTransaction, addTransaction, editTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [monthFilter, setMonthFilter] = useState('All Time');

  const getMonthBoundary = (year, monthIndex) => {
    return new Date(year, monthIndex, 1);
  };

  const monthOptions = useMemo(() => {
    const now = new Date();
    const currentLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousLabel = prev.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    return [
      { value: 'All Time', label: 'All Time' },
      { value: 'Current Month', label: `Current Month (${currentLabel})` },
      { value: 'Previous Month', label: `Previous Month (${previousLabel})` }
    ];
  }, []);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (confirm(`Are you sure you want to delete ${selected.length} transaction(s)?`)) {
      selected.forEach(id => deleteTransaction(id));
      setSelected([]);
    }
  };

  const openAddModal = () => {
    setIsModalOpen(true);
  };

  const openInlineEdit = (tx) => {
    const txId = String(tx._id || tx.id || '').trim();
    if (!txId) {
      alert('This transaction cannot be edited because its ID is missing.');
      return;
    }
    const parsedDate = new Date(tx.date);
    const safeDate = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString().split('T')[0]
      : parsedDate.toISOString().split('T')[0];

    setInlineEditingId(txId);
    setSaveState('idle');
    setSaveMessage('');
    setInlineEditData({
      description: tx.description || '',
      amount: tx.amount ?? '',
      category: tx.category || '',
      type: tx.type || 'Expense',
      date: safeDate,
      isRecurring: Boolean(tx.isRecurring),
      recurrenceInterval: tx.recurrenceInterval || 'monthly'
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditData({});
    setSaveState('idle');
    setSaveMessage('');
  };

  const saveInlineEdit = async (tx) => {
    setSaveState('saving');
    setSaveMessage('Saving changes...');

    const txId = String(tx._id || tx.id || '').trim();
    if (!txId) {
      setSaveState('error');
      setSaveMessage('Unable to save: transaction ID is missing.');
      alert('Unable to save: transaction ID is missing.');
      return;
    }
    const amount = Number(inlineEditData.amount);

    console.log('saveInlineEdit debug:', {
      inlineEditDataAmount: inlineEditData.amount,
      convertedAmount: amount,
      amountType: typeof amount,
      isNaN: Number.isNaN(amount)
    });

    if (!inlineEditData.description?.trim() || !inlineEditData.category?.trim() || Number.isNaN(amount) || amount <= 0 || !inlineEditData.date) {
      setSaveState('error');
      setSaveMessage('Please fill all required fields with valid values.');
      alert('Please enter valid description, category, amount and date.');
      return;
    }

    const updatedTx = {
      ...tx,
      ...inlineEditData,
      amount,
      _id: txId,
      id: txId
    };

    console.log('saveInlineEdit - Prepared updatedTx:', updatedTx);

    const result = await editTransaction(updatedTx);
    if (result?.ok === false) {
      const serverMessage = result?.error?.response?.data?.error;
      setSaveState('error');
      setSaveMessage(serverMessage || 'Failed to save changes. Please try again.');
      alert(serverMessage || 'Failed to save changes. Please try again.');
      return;
    }

    setSaveState('success');
    setSaveMessage('Changes saved successfully.');
    cancelInlineEdit();
  };

  const handleInlineKeyDown = (e, tx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveInlineEdit(tx);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelInlineEdit();
    }
  };

  const triggerSave = (tx) => {
    if (saveState === 'saving') {
      return;
    }
    setSaveState('saving');
    setSaveMessage('Save button pressed. Processing...');
    void saveInlineEdit(tx);
  };

  const handleSaveTransaction = (tx) => {
    addTransaction(tx);
    setIsModalOpen(false);
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const currentEditingTx = inlineEditingId
    ? safeTransactions.find((tx) => String(tx._id || tx.id || '') === inlineEditingId)
    : null;

  const filteredTransactions = safeTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    const hasValidDate = !Number.isNaN(txDate.getTime());
    const now = new Date();
    const currentMonthStart = getMonthBoundary(now.getFullYear(), now.getMonth());
    const nextMonthStart = getMonthBoundary(now.getFullYear(), now.getMonth() + 1);
    const previousMonthStart = getMonthBoundary(now.getFullYear(), now.getMonth() - 1);

    let matchesMonth = true;
    if (monthFilter === 'Current Month') {
      matchesMonth = hasValidDate && txDate >= currentMonthStart && txDate < nextMonthStart;
    } else if (monthFilter === 'Previous Month') {
      matchesMonth = hasValidDate && txDate >= previousMonthStart && txDate < currentMonthStart;
    }

    const matchesSearch = tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || tx.type === typeFilter;
    return matchesMonth && matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-900 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200 dark:border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Transactions Ledger</h1>
          <p className="text-indigo-200">View, track, and manage all your inflows and outflows</p>
        </div>
        <div className="relative z-10 flex gap-4">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-medium backdrop-blur-md transition-colors border border-slate-300 dark:border-slate-700">
            <Download size={18} /> Export CSV
          </button>
          <button
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-slate-900 dark:text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
            onClick={openAddModal}
          >
            <Plus size={20} /> New Entry
          </button>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto flex-1">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by description or category..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 dark:text-slate-200 focus:bg-white dark:bg-slate-900 transition-all text-sm font-medium placeholder-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Filter size={18} />
            </div>
            <select
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 dark:text-slate-200 focus:bg-white dark:bg-slate-900 transition-all text-sm font-medium appearance-none cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">All Types</option>
              <option value="Income" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">Income</option>
              <option value="Expense" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">Expense</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <ArrowUpDown size={14} />
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Calendar size={18} />
            </div>
            <select
              className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 dark:text-slate-200 focus:bg-white dark:bg-slate-900 transition-all text-sm font-medium appearance-none cursor-pointer"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <ArrowUpDown size={14} />
            </div>
          </div>
        </div>

        {selected.length > 0 && (
          <button
            className="flex items-center gap-2 px-5 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 font-semibold rounded-2xl transition-colors w-full md:w-auto justify-center border border-rose-500/20"
            onClick={handleDeleteSelected}
          >
            <Trash2 size={18} /> Delete Selected ({selected.length})
          </button>
        )}
      </div>

      {inlineEditingId && (
        <div className="px-4 py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 text-sm font-semibold flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span>
            Editing mode is active. Use Save Changes to update this transaction.
            {saveMessage ? ` ${saveMessage}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentEditingTx) {
                  triggerSave(currentEditingTx);
                } else {
                  setSaveState('error');
                  setSaveMessage('Unable to save because this row is no longer available.');
                }
              }}
              onMouseDown={() => {
                if (currentEditingTx) {
                  triggerSave(currentEditingTx);
                }
              }}
              onPointerDown={() => {
                if (currentEditingTx) {
                  triggerSave(currentEditingTx);
                }
              }}
              disabled={saveState === 'saving'}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-white text-xs font-bold"
            >
              {saveState === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={cancelInlineEdit}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-5 px-6 text-left w-12">
                  <div className="flex items-center justify-center">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500" disabled />
                  </div>
                </th>
                <th className="py-5 px-6 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Date</th>
                <th className="py-5 px-6 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Description</th>
                <th className="py-5 px-6 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Category</th>
                <th className="py-5 px-6 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Type</th>
                <th className="py-5 px-6 text-right text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="py-5 px-6 text-right text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const txId = String(tx._id || tx.id || '');
                  const isEditingRow = inlineEditingId === txId;
                  return (
                  <tr
                    key={txId}
                    className={`group transition-colors duration-200 ${selected.includes(txId) ? 'bg-indigo-500/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                    onDoubleClick={() => openInlineEdit(tx)}
                  >
                    <td className="py-4 px-6 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 transition-colors"
                        checked={selected.includes(txId)}
                        onChange={() => toggleSelect(txId)}
                      />
                    </td>
                    <td className="py-4 px-6">
                      {isEditingRow ? (
                        <input
                          type="date"
                          value={inlineEditData.date || ''}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, date: e.target.value })}
                          onKeyDown={(e) => handleInlineKeyDown(e, tx)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-400">
                          {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {isEditingRow ? (
                          <input
                            type="text"
                            value={inlineEditData.description || ''}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, description: e.target.value })}
                            onKeyDown={(e) => handleInlineKeyDown(e, tx)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {tx.description}
                          </span>
                        )}
                        {tx.isRecurring && !isEditingRow && (
                          <RefreshCcw size={14} className="text-indigo-400" title={`Recurring: ${tx.recurrenceInterval}`} />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={inlineEditData.category || ''}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, category: e.target.value })}
                          onKeyDown={(e) => handleInlineKeyDown(e, tx)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                        />
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60">
                          {tx.category}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {isEditingRow ? (
                        <select
                          value={inlineEditData.type || 'Expense'}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, type: e.target.value })}
                          onKeyDown={(e) => handleInlineKeyDown(e, tx)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                        >
                          <option value="Income">Income</option>
                          <option value="Expense">Expense</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${tx.type === 'Income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {tx.type === 'Income' ? 'INCOME' : 'EXPENSE'}
                        </span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-right text-sm font-black tracking-tight ${tx.type === 'Income' ? 'text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {isEditingRow ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={inlineEditData.amount ?? ''}
                          onChange={(e) => setInlineEditData({ ...inlineEditData, amount: e.target.value })}
                          onKeyDown={(e) => handleInlineKeyDown(e, tx)}
                          className="w-28 ml-auto px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200"
                        />
                      ) : (
                        <>{tx.type === 'Income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-3">
                        {isEditingRow ? (
                          <>
                            <button
                              type="button"
                              className="relative z-10 cursor-pointer px-3 py-1.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerSave(tx);
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                triggerSave(tx);
                              }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                triggerSave(tx);
                              }}
                              title="Save"
                              aria-label={`Save ${tx.description || 'transaction'}`}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Check size={14} />
                                Save
                              </span>
                            </button>
                            <button
                              type="button"
                              className="relative z-10 cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelInlineEdit();
                              }}
                              title="Cancel"
                              aria-label={`Cancel editing ${tx.description || 'transaction'}`}
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="relative z-10 cursor-pointer p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInlineEdit(tx);
                            }}
                            title="Edit"
                            aria-label={`Edit ${tx.description || 'transaction'}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Edit size={16} />
                              <span className="text-xs font-semibold">Edit</span>
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <Filter size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium text-slate-400 dark:text-slate-400 mb-1">No transactions found</p>
                      <p className="text-sm">Try adjusting your search criteria or add a new entry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={null}
      />
    </div>
  );
}

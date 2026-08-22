'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export function TransactionProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [budgetLimit, setBudgetLimit] = useState(0); // Added missing state
  const [userProfile, setUserProfile] = useState({ name: '', email: '' });
  const [isLoaded, setIsLoaded] = useState(false);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTransactions = async () => {
    const response = await axios.get('/api/transactions', { headers: getAuthHeaders() });
    setTransactions(Array.isArray(response.data) ? response.data : []);
  };

  // Load Real Data from MongoDB
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const [txRes, budgetRes] = await Promise.all([
            axios.get('/api/transactions', { headers: getAuthHeaders() }),
            axios.get('/api/budgets', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
          ]);
          setTransactions(txRes.data);
          setBudgets(budgetRes.data);
        } catch (e) {
          console.error("Failed to fetch data:", e);
          setTransactions([]); 
          setBudgets([]);
        }
      } else {
        setTransactions([]);
        setBudgets([]);
      }
      setIsLoaded(true);
    };

    loadData();
  }, [user]);

  // Update Stats Effect
  useEffect(() => {
    // Normalizing type comparison to catch both 'Income' and 'income'
    const totalIncome = transactions.filter(t => t.type?.toLowerCase() === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type?.toLowerCase() === 'expense').reduce((acc, t) => acc + t.amount, 0);
    setStats({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense
    });
  }, [transactions]);

  const smartAlerts = useMemo(() => {
    if (!isLoaded) return [];

    const alerts = [];
    const now = new Date();
    const currentMonthKey = getMonthKey(now);

    const currentMonthExpenses = transactions.filter((t) => {
      const txMonthKey = getMonthKey(t.date);
      return Boolean(txMonthKey)
        && Boolean(currentMonthKey)
        && txMonthKey === currentMonthKey
        && (t.type || '').toLowerCase() === 'expense';
    });

    budgets.forEach((b) => {
      const spent = currentMonthExpenses
        .filter((t) => isCategoryMatch(t.category, b.category))
        .reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const limit = Number(b.limit || 0);
      if (limit <= 0) return;

      const usage = (spent / limit) * 100;
      if (usage >= 100) {
        alerts.push({
          level: 'critical',
          title: `${b.category} budget exceeded`,
          message: `Spent ${formatCurrency(spent)} of ${formatCurrency(limit)} this month.`,
        });
      } else if (usage >= 80) {
        alerts.push({
          level: 'warning',
          title: `${b.category} nearing limit`,
          message: `You used ${usage.toFixed(0)}% of your monthly budget.`,
        });
      }
    });

    const previousMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const prevMonthKey = getMonthKey(previousMonthDate);

    const monthlyCategorySpend = (monthKey) => {
      const map = {};
      transactions.forEach((t) => {
        const txMonthKey = getMonthKey(t.date);
        if (!txMonthKey || txMonthKey !== monthKey) return;
        if ((t.type || '').toLowerCase() !== 'expense') return;

        const cat = (t.category || 'General').trim();
        map[cat] = (map[cat] || 0) + Number(t.amount || 0);
      });
      return map;
    };

    const currentSpendMap = monthlyCategorySpend(currentMonthKey);
    const previousSpendMap = monthlyCategorySpend(prevMonthKey);

    Object.keys(currentSpendMap).forEach((cat) => {
      const current = currentSpendMap[cat] || 0;
      const previous = previousSpendMap[cat] || 0;
      if (previous <= 0) return;

      const growth = ((current - previous) / previous) * 100;
      if (growth >= 30) {
        alerts.push({
          level: 'warning',
          title: `${cat} spending increased`,
          message: `Up ${growth.toFixed(0)}% vs last month.`,
        });
      }
    });

    transactions
      .filter((t) => Boolean(t.isRecurring))
      .forEach((t) => {
        const txDate = new Date(t.date);
        if (Number.isNaN(txDate.getTime())) return;

        const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), txDate.getUTCDate()));
        if (dueDate < now) {
          dueDate.setUTCMonth(dueDate.getUTCMonth() + 1);
        }

        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          alerts.push({
            level: 'info',
            title: 'Recurring payment due soon',
            message: `${t.description} is due in ${diffDays} day${diffDays === 1 ? '' : 's'}.`,
          });
        }
      });

    const levelPriority = { critical: 0, warning: 1, info: 2 };
    return alerts
      .sort((a, b) => levelPriority[a.level] - levelPriority[b.level])
      .slice(0, 4);
  }, [transactions, budgets, isLoaded]);

  const healthScoreData = useMemo(() => {
    if (!isLoaded) {
      return {
        healthScore: 0,
        breakdown: {},
        suggestion: '',
        loadingState: true,
        alertImpact: { critical: 0, warning: 0, penalty: 0 },
      };
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    const currentMonthTx = transactions.filter((t) => {
      const txMonthKey = getMonthKey(t.date);
      return Boolean(txMonthKey) && Boolean(currentMonthKey) && txMonthKey === currentMonthKey;
    });

    currentMonthTx.forEach((t) => {
      const amount = Number(t.amount);
      const txType = (t.type || '').toLowerCase();
      if (txType === 'income') totalIncome += amount;
      if (txType === 'expense') totalExpenses += amount;
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : (totalExpenses > 0 ? -100 : 0);

    let pSavings = 0;
    if (savingsRate >= 20) pSavings = 40;
    else if (savingsRate >= 10) pSavings = 30;
    else if (savingsRate >= 0) pSavings = 20;
    else if (savingsRate >= -10) pSavings = 10;

    let pBudget = 20;
    let budgetStatus = 'No Budgets Set';

    if (budgets && budgets.length > 0) {
      pBudget = 40;
      let exceededCount = 0;
      let totalLimit = 0;
      let totalBudgetSpent = 0;

      budgets.forEach((b) => {
        const limit = Number(b.limit || 0);
        const spent = currentMonthTx
          .filter((t) => (t.type || '').toLowerCase() === 'expense' && isCategoryMatch(t.category, b.category))
          .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        totalLimit += limit;
        totalBudgetSpent += spent;
        if (spent > limit) exceededCount += 1;
      });

      if (exceededCount > 0) {
        pBudget -= exceededCount * 15;
        budgetStatus = `${exceededCount} Limits Exceeded`;
      } else {
        budgetStatus = 'Within Limits';
      }

      if (totalBudgetSpent > totalLimit && totalLimit > 0) {
        pBudget -= 10;
        budgetStatus = 'Total Limit Exceeded';
      }

      if (pBudget < 0) pBudget = 0;
    } else if (totalExpenses > totalIncome && totalIncome > 0) {
      pBudget = 0;
      budgetStatus = 'Overspending Income';
    }

    let pActivity = 0;
    if (currentMonthTx.length >= 5) pActivity = 20;
    else if (currentMonthTx.length >= 1) pActivity = 10;

    const criticalAlerts = smartAlerts.filter((a) => a.level === 'critical').length;
    const warningAlerts = smartAlerts.filter((a) => a.level === 'warning').length;
    const alertPenalty = Math.min(criticalAlerts * 8 + warningAlerts * 3, 20);

    const baseScore = pSavings + pBudget + pActivity;
    const totalScore = Math.min(Math.max(baseScore - alertPenalty, 0), 100);

    let sug = '';
    let stat = 'Needs Attention';
    if (totalScore >= 80) {
      sug = 'Excellent financial health! You are saving well and sticking to your budgets.';
      stat = 'Excellent';
    } else if (totalScore >= 60) {
      sug = 'Good job. Watch out for budget overruns in specific categories.';
      stat = 'Good';
    } else if (totalScore >= 40) {
      sug = 'Fair. You might be overspending. Review your budgets closely.';
      stat = 'Fair';
    } else {
      sug = 'Critical. You are consistently exceeding limits or spending more than you earn.';
      stat = 'Critical';
    }

    if (pBudget === 0 && budgets.length > 0) {
      sug = 'You have exceeded multiple budget limits. Immediate review required.';
    }

    if (criticalAlerts > 0 || warningAlerts > 0) {
      sug = `${sug} Active alerts are reducing your health score by ${alertPenalty} point${alertPenalty === 1 ? '' : 's'}.`;
    }

    return {
      healthScore: totalScore,
      breakdown: { savings: pSavings, budget: pBudget, activity: pActivity, stat, budgetStatus },
      suggestion: sug,
      loadingState: false,
      alertImpact: { critical: criticalAlerts, warning: warningAlerts, penalty: alertPenalty },
    };
  }, [transactions, budgets, isLoaded, smartAlerts]);

  const addTransaction = async (transaction) => {
    // Note: ID generation is handled by MongoDB, we'll optimistically use a temp ID 
    // but the DB will return the real one.
    const tempId = Math.random().toString(36).substr(2, 9);
    const newTransaction = { ...transaction, _id: tempId, id: tempId, status: 'Completed' };

    // Optimistic Update
    setTransactions(prev => [newTransaction, ...prev]);

    // Persist to MongoDB Server
    if (user) {
      try {
        const response = await axios.post('/api/transactions', transaction, { headers: getAuthHeaders() }); // Send raw payload without temp ID
        // After successful save, replace the temp ID with the real MongoDB ObjectId
        setTransactions(prev => prev.map(t => t._id === tempId ? response.data : t));
        await fetchTransactions();
      } catch (e) {
        console.error("Failed to save transaction to DB", e);
        // Revert optimistic update on failure
        setTransactions(prev => prev.filter(t => t._id !== tempId));
      }
    }
  };

  const deleteTransaction = async (id) => {
    const backup = [...transactions];
    setTransactions(prev => prev.filter(t => (t._id !== id && t.id !== id)));

    if (user) {
      try {
        await axios.delete(`/api/transactions/${id}`, { headers: getAuthHeaders() });
      } catch (e) {
        console.error("Failed to delete transaction", e);
        setTransactions(backup); // Revert on failure
      }
    }
  };

  const editTransaction = async (updatedTransaction) => {
    const backup = [...transactions];
    const targetId = String(updatedTransaction._id || updatedTransaction.id || '').trim();
    if (!targetId) {
      return { ok: false, error: new Error('Missing transaction id') };
    }

    const normalizedUpdate = { ...updatedTransaction, _id: targetId, id: targetId };

    setTransactions(prev => prev.map(t => (t._id === targetId || t.id === targetId) ? normalizedUpdate : t));

    if (user) {
      try {
        console.log('editTransaction - Sending update:', {
          targetId,
          amount: updatedTransaction.amount,
          description: updatedTransaction.description,
          date: updatedTransaction.date,
          type: updatedTransaction.type,
          category: updatedTransaction.category
        });
        
        let response;
        try {
          response = await axios.put(`/api/transactions/${targetId}`, updatedTransaction, { headers: getAuthHeaders() });
        } catch (primaryError) {
          response = await axios.put(`/api/transactions/${targetId}`, updatedTransaction, { headers: getAuthHeaders() });
        }

        console.log('editTransaction - Received response:', response.data);
        
        setTransactions(prev => prev.map(t => (String(t._id) === targetId || String(t.id) === targetId) ? response.data : t));
        await fetchTransactions();
        return { ok: true, data: response.data };
      } catch (e) {
        console.error("Failed to update transaction", e);
        setTransactions(backup); // Revert on failure
        return { ok: false, error: e };
      }
    }

    return { ok: false, error: new Error('User not authenticated') };
  };

  const updateBudgetLimit = (amount) => {
    setBudgetLimit(amount);
  };

  const updateUserProfile = (profile) => {
    setUserProfile(profile);
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      budgets,
      addTransaction,
      deleteTransaction,
      editTransaction,
      stats,
      smartAlerts,
      healthScoreData,
      budgetLimit,
      updateBudgetLimit,
      userProfile,
      updateUserProfile,
      isLoaded
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

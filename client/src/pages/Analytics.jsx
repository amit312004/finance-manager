import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Card, Button } from '@/components/ui/base';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Brain, Mail, Activity, Sparkles, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTransactions } from '@/context/TransactionContext';

export default function AnalyticsPage() {
  const { transactions } = useTransactions();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const chartsRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyIncomeSetting, setMonthlyIncomeSetting] = useState(0);
  const [reportSummary, setReportSummary] = useState(null);

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

  useEffect(() => {
    const fetchReportSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get('/api/monthly-report-summary', {
          params: { month: selectedMonth },
          headers: { Authorization: `Bearer ${token}` }
        });

        setReportSummary(res.data);
      } catch (error) {
        console.error('Failed to load monthly report summary', error);
        setReportSummary(null);
      }
    };

    fetchReportSummary();
  }, [selectedMonth]);

  const selectedMonthTransactions = useMemo(() => {
    if (reportSummary?.transactions) {
      return reportSummary.transactions;
    }

    return safeTransactions.filter((t) => {
      const txDate = new Date(t.date);
      if (Number.isNaN(txDate.getTime())) return false;
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  }, [safeTransactions, selectedMonth]);

  const monthStats = useMemo(() => {
    if (reportSummary) {
      return {
        transactionIncome: reportSummary.transactionIncome || 0,
        totalIncome: reportSummary.currentIncome || 0,
        totalExpense: reportSummary.currentExpense || 0,
        netProfit: reportSummary.netBalance || 0,
      };
    }

    const transactionIncome = selectedMonthTransactions
      .filter(t => String(t.type || '').toLowerCase() === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalIncome = monthlyIncomeSetting > 0 ? monthlyIncomeSetting : transactionIncome;
    const totalExpense = selectedMonthTransactions
      .filter(t => String(t.type || '').toLowerCase() === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      transactionIncome,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    };
  }, [selectedMonthTransactions, monthlyIncomeSetting, reportSummary]);

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return 'Selected Month';
    return new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const forecastData = useMemo(() => {
    if (reportSummary?.forecastData) {
      return reportSummary.forecastData;
    }

    const [yearText, monthText] = selectedMonth.split('-');
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return [];

    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const weekCount = Math.ceil(daysInMonth / 7);

    const weeklyActual = Array.from({ length: weekCount }, () => 0);
    const dailySpendMap = new Map();

    const expenses = selectedMonthTransactions.filter(t => String(t.type || '').toLowerCase() === 'expense');

    expenses.forEach((t) => {
      const txDate = new Date(t.date);
      if (Number.isNaN(txDate.getTime())) return;
      const dayOfMonth = txDate.getDate();
      const weekIndex = Math.floor((dayOfMonth - 1) / 7);
      const amount = Number(t.amount || 0);
      if (weekIndex >= 0 && weekIndex < weekCount) {
        weeklyActual[weekIndex] += amount;
      }

      const dayKey = txDate.toISOString().split('T')[0];
      dailySpendMap.set(dayKey, (dailySpendMap.get(dayKey) || 0) + amount);
    });

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthIndex;
    const elapsedDays = isCurrentMonth ? Math.max(now.getDate(), 1) : daysInMonth;

    const totalSoFar = weeklyActual.reduce((acc, v) => acc + v, 0);
    const avgDailySpend = elapsedDays > 0 ? totalSoFar / elapsedDays : 0;

    const recentDayKeys = Array.from(dailySpendMap.keys()).sort().slice(-14);
    const recentAvg = recentDayKeys.length > 0
      ? recentDayKeys.reduce((sum, key) => sum + Number(dailySpendMap.get(key) || 0), 0) / recentDayKeys.length
      : avgDailySpend;

    const trendDailySpend = avgDailySpend > 0 && recentAvg > 0
      ? (avgDailySpend * 0.6) + (recentAvg * 0.4)
      : Math.max(avgDailySpend, recentAvg, 0);

    return Array.from({ length: weekCount }, (_, idx) => {
      const weekStartDay = (idx * 7) + 1;
      const weekEndDay = Math.min((idx + 1) * 7, daysInMonth);
      const weekDays = weekEndDay - weekStartDay + 1;

      const weekStartDate = new Date(year, monthIndex, weekStartDay);
      const weekEndDate = new Date(year, monthIndex, weekEndDay, 23, 59, 59, 999);
      const isFutureWeek = isCurrentMonth && weekStartDate > now;
      const isCurrentWeek = isCurrentMonth && weekStartDate <= now && weekEndDate >= now;

      let predicted = weeklyActual[idx];
      if (isFutureWeek) {
        predicted = trendDailySpend * weekDays;
      } else if (isCurrentWeek) {
        const remainingDaysInWeek = Math.max(weekEndDay - now.getDate(), 0);
        predicted = weeklyActual[idx] + (trendDailySpend * remainingDaysInWeek);
      }

      return {
        name: `W${idx + 1}`,
        actual: isFutureWeek ? null : weeklyActual[idx],
        predicted,
      };
    });
  }, [selectedMonthTransactions, selectedMonth, reportSummary]);

  const categoryData = useMemo(() => {
    if (reportSummary?.categoryData) {
      return reportSummary.categoryData;
    }

    const cats = {};
    const expenses = selectedMonthTransactions.filter(t => String(t.type || '').toLowerCase() === 'expense');
    expenses.forEach(t => {
      if (!cats[t.category]) cats[t.category] = 0;
      cats[t.category] += Number(t.amount || 0);
    });
    return Object.keys(cats).map(key => ({ name: key, value: cats[key] }));
  }, [selectedMonthTransactions, reportSummary]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899'];

  const handleEmailReport = async () => {
    try {
      if (!confirm('Send monthly report to your email?')) return;

      setIsSending(true);
      await axios.post('/api/send-report', {
        reportMonth: selectedMonth
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Report sent successfully!');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to send report. Please check server logs.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-900 to-fuchsia-900 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-fuchsia-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/30 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-950/20 border border-white/20 backdrop-blur-md mb-3">
            <Activity className="w-4 h-4 text-fuchsia-300" />
            <span className="text-xs font-medium text-fuchsia-100 tracking-wider uppercase">Strategic Outlook</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Deep Analytics</h1>
          <p className="text-fuchsia-200 text-lg">Comprehensive financial analysis and predictive intelligence for {monthLabel}</p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/10 rounded-xl backdrop-blur-md">
            <Calendar size={16} className="text-fuchsia-200" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm text-white outline-none"
              aria-label="Select report month"
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white rounded-xl font-semibold backdrop-blur-md transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            onClick={handleEmailReport}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
            {isSending ? 'Sending...' : 'Email Report'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Income"
          value={`₹${monthStats.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} `}
          icon={<TrendingUp className="text-slate-900 dark:text-white" size={28} />}
          gradient="from-emerald-400 to-teal-500"
          shadowColor="shadow-emerald-500/30"
        />
        <MetricCard
          title="Total Expense"
          value={`₹${monthStats.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} `}
          icon={<TrendingDown className="text-slate-900 dark:text-white" size={28} />}
          gradient="from-rose-400 to-red-500"
          shadowColor="shadow-rose-500/30"
        />
        <MetricCard
          title="Net Profit"
          value={`₹${monthStats.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} `}
          icon={<DollarSign className="text-slate-900 dark:text-white" size={28} />}
          gradient="from-sky-400 to-indigo-500"
          shadowColor="shadow-blue-500/30"
        />
      </div>

      {/* Charts Section */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-3xl">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
              Spending Forecast
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-300 rounded-full font-bold text-sm shadow-inner border border-purple-500/30">
              <Sparkles size={16} className="text-purple-400" /> AI Powered
            </div>
          </div>

          <div className="h-[350px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} dx={-10} />
                <RechartsTooltip
                  cursor={{ stroke: 'rgba(51, 65, 85, 0.4)', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', color: '#cbd5e1' }} />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Actual Spending" />
                <Area type="monotone" dataKey="predicted" stroke="#c084fc" strokeWidth={3} strokeDasharray="6 6" fillOpacity={1} fill="url(#colorPredicted)" name="AI Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400 mb-8">
            Expense By Category
          </h3>
          <div className="h-[350px] w-full flex-grow flex items-center justify-center relative">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#cbd5e1' }} />
                  <RechartsTooltip
                    formatter={(value) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })} `}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 h-full w-full">
                <Activity size={48} className="text-slate-600 mb-4 opacity-50" />
                <p className="font-medium text-lg text-slate-400 dark:text-slate-400">No expense data</p>
                <p className="text-sm mt-1">Add transactions to visualize categories</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Metric Component (similar to Dashboard)
const MetricCard = ({ title, value, icon, gradient, shadowColor }) => (
  <div className="relative group rounded-3xl bg-white dark:bg-slate-900 p-1 hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-800">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10`}></div>
    <div className={`h-full bg-white dark:bg-slate-900 rounded-[22px] p-8 shadow-xl shadow-slate-950/50 group-hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors duration-300 overflow-hidden relative`}>
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl`}></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${shadowColor}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-4xl font-black text-slate-100 tracking-tight">{value}</h3>
      </div>
    </div>
  </div>
);

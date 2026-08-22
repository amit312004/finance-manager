const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('Connected to MongoDB via Mongoose'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let existingUser = await User.findOne({ email });
    
    if (existingUser) return res.status(400).json({ error: 'User exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Return user without password
    res.json({ user: { id: user._id, name: user.name, email: user.email, monthlyIncome: user.monthlyIncome || 0 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, monthlyIncome: user.monthlyIncome || 0 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Protected Route Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Data Routes
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { amount, description, date, type, category, isRecurring, recurrenceInterval } = req.body;
    const transaction = new Transaction({
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        userId: req.userId,
        type: type || 'Expense',
        category: category || 'General',
        isRecurring: Boolean(isRecurring),
        recurrenceInterval: isRecurring ? (recurrenceInterval || 'monthly') : null
    });
    
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/transactions/:id', authenticate, async (req, res) => {
    try {
        const { amount, description, date, type, category } = req.body;
        const transactionId = req.params.id;
        
        console.log('PUT /api/transactions/:id called');
        console.log('Transaction ID:', transactionId);
        console.log('Request body:', req.body);
        console.log('Amount received:', amount, 'Type:', typeof amount);
        
        let query = { userId: req.userId };
        
        // Try to match either as ObjectId or as string
        if (mongoose.Types.ObjectId.isValid(transactionId)) {
          query._id = new mongoose.Types.ObjectId(transactionId);
        } else {
          query._id = transactionId;
        }

        console.log('Query:', query);
        
        const parsedAmount = parseFloat(amount);
        console.log('Parsed amount:', parsedAmount);

        const transaction = await Transaction.findOneAndUpdate(
            query,
            { 
                amount: parsedAmount,
                description,
                date: new Date(date),
                type,
                category 
            },
            { new: true }
        );

        console.log('Updated transaction:', transaction);
        
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        res.json(transaction);
    } catch (error) {
        console.error('Error in PUT /api/transactions/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ message: 'Transaction deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Budget Routes
app.get('/api/budgets', authenticate, async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.userId });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/budgets', authenticate, async (req, res) => {
    try {
        const { category, limit } = req.body;
        const budget = new Budget({
            userId: req.userId,
            category,
            limit
        });
        await budget.save();
        res.json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/budgets/:id', authenticate, async (req, res) => {
    try {
        const { category, limit } = req.body;
    const budgetId = req.params.id;

    if (category === undefined && limit === undefined) {
      return res.status(400).json({ error: 'No fields to update' });
        }

    const query = { userId: req.userId };
    if (mongoose.Types.ObjectId.isValid(budgetId)) {
      query._id = new mongoose.Types.ObjectId(budgetId);
    } else {
      query._id = budgetId;
    }

    const updatePayload = {};
    if (category !== undefined) updatePayload.category = String(category).trim();
    if (limit !== undefined) {
      const parsedLimit = Number(limit);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ error: 'Limit must be a positive number' });
      }
      updatePayload.limit = parsedLimit;
    }

        const budget = await Budget.findOneAndUpdate(
      query,
      updatePayload,
            { new: true }
        );
        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        res.json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/budgets/:id', authenticate, async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!budget) return res.status(404).json({ error: 'Budget not found' });
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/monthly-income', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('monthlyIncome');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ monthlyIncome: Number(user.monthlyIncome || 0) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/monthly-income', authenticate, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'Monthly income must be a valid non-negative number' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { monthlyIncome: amount },
      { new: true, runValidators: true }
    ).select('monthlyIncome name email');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      message: 'Monthly income updated successfully',
      monthlyIncome: Number(user.monthlyIncome || 0),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: Number(user.monthlyIncome || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const monthPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

async function buildMonthlyReportData(userId, requestedMonth) {
  const now = new Date();
  let reportYear = now.getFullYear();
  let reportMonthIndex = now.getMonth();

  if (monthPattern.test(String(requestedMonth || '').trim())) {
    const [yearText, monthText] = String(requestedMonth).trim().split('-');
    reportYear = Number(yearText);
    reportMonthIndex = Number(monthText) - 1;
  }

  const reportAnchorDate = new Date(reportYear, reportMonthIndex, 1);
  const reportMonthLabel = reportAnchorDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const reportMonthKey = `${reportYear}-${String(reportMonthIndex + 1).padStart(2, '0')}`;
  const startOfMonth = new Date(reportYear, reportMonthIndex, 1);
  const endOfMonth = new Date(reportYear, reportMonthIndex + 1, 1);
  const startOfLastMonth = new Date(reportYear, reportMonthIndex - 1, 1);

  const [user, transactions, lastMonthTransactions, budgets] = await Promise.all([
    User.findById(userId).select('name email monthlyIncome'),
    Transaction.find({
      userId,
      date: { $gte: startOfMonth, $lt: endOfMonth }
    }).sort({ date: -1 }),
    Transaction.find({
      userId,
      date: { $gte: startOfLastMonth, $lt: startOfMonth }
    }),
    Budget.find({ userId })
  ]);

  if (!user) {
    return { error: 'User not found' };
  }

  const formatINRValue = (value) => Number(value || 0);
  const safeType = (t) => String(t?.type || '').toLowerCase();
  const safeCategory = (t) => String(t?.category || 'Other').trim() || 'Other';
  const safeAmount = (t) => Number(t?.amount) || 0;

  const transactionIncome = transactions
    .filter(t => safeType(t) === 'income')
    .reduce((sum, t) => sum + safeAmount(t), 0);
  const currentIncome = Number(user.monthlyIncome || 0) > 0 ? Number(user.monthlyIncome || 0) : transactionIncome;
  const currentExpense = transactions
    .filter(t => safeType(t) === 'expense')
    .reduce((sum, t) => sum + safeAmount(t), 0);
  const netBalance = currentIncome - currentExpense;

  const previousIncomeFromTransactions = lastMonthTransactions
    .filter(t => safeType(t) === 'income')
    .reduce((sum, t) => sum + safeAmount(t), 0);
  const previousIncome = Number(user.monthlyIncome || 0) > 0 ? Number(user.monthlyIncome || 0) : previousIncomeFromTransactions;
  const previousExpense = lastMonthTransactions
    .filter(t => safeType(t) === 'expense')
    .reduce((sum, t) => sum + safeAmount(t), 0);

  const expenseChangePct = previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;
  const incomeChangePct = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;

  const isCurrentMonthSelection = reportYear === now.getFullYear() && reportMonthIndex === now.getMonth();
  const daysInMonth = new Date(reportYear, reportMonthIndex + 1, 0).getDate();
  const daysElapsed = isCurrentMonthSelection ? Math.max(now.getDate(), 1) : daysInMonth;
  const daysRemaining = isCurrentMonthSelection ? Math.max(daysInMonth - daysElapsed, 0) : 0;
  const avgDailySpend = daysElapsed > 0 ? currentExpense / daysElapsed : 0;
  const forecastedExpense = currentExpense + (avgDailySpend * daysRemaining);
  const projectedEndOfMonthBalance = currentIncome - forecastedExpense;
  const savingsRate = currentIncome > 0 ? (netBalance / currentIncome) * 100 : 0;

  const categoryTotals = {};
  transactions.filter(t => safeType(t) === 'expense').forEach(t => {
    const category = safeCategory(t);
    categoryTotals[category] = (categoryTotals[category] || 0) + safeAmount(t);
  });

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      value,
      sharePct: currentExpense > 0 ? (value / currentExpense) * 100 : 0
    }));

  const budgetInsights = budgets.map((b) => {
    const category = String(b.category || 'Other');
    const limit = Number(b.limit) || 0;
    const spent = categoryTotals[category] || 0;
    const utilizationPct = limit > 0 ? (spent / limit) * 100 : 0;
    return { category, limit, spent, utilizationPct };
  }).sort((a, b) => b.utilizationPct - a.utilizationPct);

  const breachedBudgets = budgetInsights.filter(b => b.limit > 0 && b.spent > b.limit);
  const nearLimitBudgets = budgetInsights.filter(b => b.limit > 0 && b.spent <= b.limit && b.utilizationPct >= 85);

  const aiInsights = [];
  if (currentIncome === 0 && currentExpense > 0) {
    aiInsights.push('No income recorded for this month while expenses are active. Add income entries first to make projections accurate.');
  }
  if (currentExpense > currentIncome && currentIncome > 0) {
    aiInsights.push(`You are currently overspending by ₹${Math.abs(netBalance).toLocaleString('en-IN')}. Freeze non-essential purchases for the next 7 days.`);
  } else if (forecastedExpense > currentIncome && currentIncome > 0) {
    aiInsights.push(`At the current run rate, expenses may exceed income by ₹${Math.abs(projectedEndOfMonthBalance).toLocaleString('en-IN')} this month.`);
  }
  if (topCategories.length > 0 && topCategories[0].sharePct >= 35) {
    aiInsights.push(`${topCategories[0].name} contributes ${topCategories[0].sharePct.toFixed(1)}% of monthly spending. Set a hard weekly cap for this category.`);
  }
  if (breachedBudgets.length > 0) {
    aiInsights.push(`You exceeded ${breachedBudgets.length} budget ${breachedBudgets.length > 1 ? 'categories' : 'category'}. Prioritize reductions in ${breachedBudgets.slice(0, 2).map(b => b.category).join(', ')}.`);
  } else if (nearLimitBudgets.length > 0) {
    aiInsights.push(`${nearLimitBudgets[0].category} is near the budget limit (${nearLimitBudgets[0].utilizationPct.toFixed(1)}% used). Avoid discretionary spends in this category.`);
  }
  if (savingsRate >= 20) {
    aiInsights.push(`Strong progress: savings rate is ${savingsRate.toFixed(1)}% this month. Maintain this by automating a post-salary transfer.`);
  } else if (currentIncome > 0) {
    aiInsights.push(`Savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% by reducing one high-variance category this week.`);
  }
  if (aiInsights.length === 0) {
    aiInsights.push('Your cash flow is stable this month. Keep monitoring category-level trends weekly for early risk detection.');
  }

  const actionPlan = [
    'Track expenses daily for 2 minutes to catch drift early.',
    'Cap top spending category with a weekly amount and pause when reached.',
    'Route at least 20% of income to savings on payday.',
    'Review subscriptions and remove at least one low-value recurring expense.'
  ];

  const weekCount = Math.ceil(daysInMonth / 7);
  const weeklyActual = Array.from({ length: weekCount }, () => 0);
  const dailySpendMap = new Map();
  const nowForForecast = new Date();

  transactions.forEach((t) => {
    if (safeType(t) !== 'expense') return;
    const txDate = new Date(t.date);
    if (Number.isNaN(txDate.getTime())) return;
    const dayOfMonth = txDate.getDate();
    const weekIndex = Math.floor((dayOfMonth - 1) / 7);
    const amount = safeAmount(t);
    if (weekIndex >= 0 && weekIndex < weekCount) {
      weeklyActual[weekIndex] += amount;
    }

    const dayKey = txDate.toISOString().split('T')[0];
    dailySpendMap.set(dayKey, (dailySpendMap.get(dayKey) || 0) + amount);
  });

  const isCurrentMonthForForecast = reportYear === nowForForecast.getFullYear() && reportMonthIndex === nowForForecast.getMonth();
  const elapsedDaysForForecast = isCurrentMonthForForecast ? Math.max(nowForForecast.getDate(), 1) : daysInMonth;
  const totalExpenseSoFar = weeklyActual.reduce((sum, value) => sum + value, 0);
  const avgDailyForecastSpend = elapsedDaysForForecast > 0 ? totalExpenseSoFar / elapsedDaysForForecast : 0;
  const recentDayKeys = Array.from(dailySpendMap.keys()).sort().slice(-14);
  const recentAvg = recentDayKeys.length > 0
    ? recentDayKeys.reduce((sum, key) => sum + Number(dailySpendMap.get(key) || 0), 0) / recentDayKeys.length
    : avgDailyForecastSpend;
  const trendDailySpend = avgDailyForecastSpend > 0 && recentAvg > 0
    ? (avgDailyForecastSpend * 0.6) + (recentAvg * 0.4)
    : Math.max(avgDailyForecastSpend, recentAvg, 0);

  const forecastData = Array.from({ length: weekCount }, (_, idx) => {
    const weekStartDay = (idx * 7) + 1;
    const weekEndDay = Math.min((idx + 1) * 7, daysInMonth);
    const weekDays = weekEndDay - weekStartDay + 1;
    const weekStartDate = new Date(reportYear, reportMonthIndex, weekStartDay);
    const weekEndDate = new Date(reportYear, reportMonthIndex, weekEndDay, 23, 59, 59, 999);
    const isFutureWeek = isCurrentMonthForForecast && weekStartDate > nowForForecast;
    const isCurrentWeek = isCurrentMonthForForecast && weekStartDate <= nowForForecast && weekEndDate >= nowForForecast;

    let predicted = weeklyActual[idx];
    if (isFutureWeek) {
      predicted = trendDailySpend * weekDays;
    } else if (isCurrentWeek) {
      const remainingDaysInWeek = Math.max(weekEndDay - nowForForecast.getDate(), 0);
      predicted = weeklyActual[idx] + (trendDailySpend * remainingDaysInWeek);
    }

    return {
      name: `W${idx + 1}`,
      actual: isFutureWeek ? null : weeklyActual[idx],
      predicted,
    };
  });

  const categoryData = topCategories.map(cat => ({ name: cat.name, value: cat.value }));

  return {
    user,
    reportYear,
    reportMonthIndex,
    reportMonthLabel,
    reportMonthKey,
    currentIncome: formatINRValue(currentIncome),
    transactionIncome: formatINRValue(transactionIncome),
    currentExpense: formatINRValue(currentExpense),
    netBalance: formatINRValue(netBalance),
    previousIncome: formatINRValue(previousIncome),
    previousExpense: formatINRValue(previousExpense),
    expenseChangePct,
    incomeChangePct,
    avgDailySpend,
    forecastedExpense: formatINRValue(forecastedExpense),
    projectedEndOfMonthBalance: formatINRValue(projectedEndOfMonthBalance),
    savingsRate,
    topCategories,
    budgetInsights,
    aiInsights,
    actionPlan,
    recentTransactions: transactions.slice(0, 10).map(t => ({
      date: t.date,
      description: t.description,
      category: safeCategory(t),
      type: safeType(t) === 'income' ? 'Income' : 'Expense',
      amount: safeAmount(t)
    })),
    forecastData,
    categoryData,
    transactions,
    budgets,
  };
}

app.get('/api/monthly-report-summary', authenticate, async (req, res) => {
  try {
    const data = await buildMonthlyReportData(req.userId, req.query.month);
    if (data.error) return res.status(404).json({ error: data.error });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configure Email Transport
const emailUser = (process.env.EMAIL_USER || '').trim();
const rawEmailPass = (process.env.EMAIL_PASS || '').trim();
// Gmail app passwords are often copied with spaces; normalize to avoid auth failures.
const emailPass = rawEmailPass.replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  }
});


app.post('/api/send-report', authenticate, async (req, res) => {
  try {
    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email is not configured. Please set EMAIL_USER and EMAIL_PASS in server/.env.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const formatINR = (value) => new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(value) || 0);

    const formatPct = (value) => `${Number(value || 0).toFixed(1)}%`;

    const safeType = (t) => String(t?.type || '').toLowerCase();
    const safeCategory = (t) => String(t?.category || 'Other').trim() || 'Other';
    const safeAmount = (t) => Number(t?.amount) || 0;
    const escapeHtml = (str) => String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const now = new Date();
    const requestedMonth = String(req.body?.reportMonth || '').trim();
    const monthPattern = /^(\d{4})-(0[1-9]|1[0-2])$/;

    let reportYear = now.getFullYear();
    let reportMonthIndex = now.getMonth();
    if (monthPattern.test(requestedMonth)) {
      const [yearText, monthText] = requestedMonth.split('-');
      reportYear = Number(yearText);
      reportMonthIndex = Number(monthText) - 1;
    }

    const reportAnchorDate = new Date(reportYear, reportMonthIndex, 1);
    const reportMonthLabel = reportAnchorDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const reportMonthKey = `${reportYear}-${String(reportMonthIndex + 1).padStart(2, '0')}`;

    const startOfMonth = new Date(reportYear, reportMonthIndex, 1);
    const endOfMonth = new Date(reportYear, reportMonthIndex + 1, 1);
    const startOfLastMonth = new Date(reportYear, reportMonthIndex - 1, 1);

    const [transactions, lastMonthTransactions, budgets] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        date: { $gte: startOfMonth, $lt: endOfMonth }
      }).sort({ date: -1 }),
      Transaction.find({
        userId: req.userId,
        date: { $gte: startOfLastMonth, $lt: startOfMonth }
      }),
      Budget.find({ userId: req.userId })
    ]);

    const transactionIncome = transactions
      .filter(t => safeType(t) === 'income')
      .reduce((sum, t) => sum + safeAmount(t), 0);
    const currentIncome = Number(user.monthlyIncome || 0) > 0 ? Number(user.monthlyIncome || 0) : transactionIncome;
    const currentExpense = transactions
      .filter(t => safeType(t) === 'expense')
      .reduce((sum, t) => sum + safeAmount(t), 0);
    const netBalance = currentIncome - currentExpense;

    const previousIncomeFromTransactions = lastMonthTransactions
      .filter(t => safeType(t) === 'income')
      .reduce((sum, t) => sum + safeAmount(t), 0);
    const previousIncome = Number(user.monthlyIncome || 0) > 0 ? Number(user.monthlyIncome || 0) : previousIncomeFromTransactions;
    const previousExpense = lastMonthTransactions
      .filter(t => safeType(t) === 'expense')
      .reduce((sum, t) => sum + safeAmount(t), 0);

    const expenseChangePct = previousExpense > 0
      ? ((currentExpense - previousExpense) / previousExpense) * 100
      : 0;
    const incomeChangePct = previousIncome > 0
      ? ((currentIncome - previousIncome) / previousIncome) * 100
      : 0;

    const isCurrentMonthSelection = reportYear === now.getFullYear() && reportMonthIndex === now.getMonth();
    const daysInMonth = new Date(reportYear, reportMonthIndex + 1, 0).getDate();
    const daysElapsed = isCurrentMonthSelection ? Math.max(now.getDate(), 1) : daysInMonth;
    const daysRemaining = isCurrentMonthSelection ? Math.max(daysInMonth - daysElapsed, 0) : 0;
    const avgDailySpend = currentExpense / daysElapsed;
    const forecastedExpense = currentExpense + (avgDailySpend * daysRemaining);
    const projectedEndOfMonthBalance = currentIncome - forecastedExpense;
    const savingsRate = currentIncome > 0 ? (netBalance / currentIncome) * 100 : 0;

    const categoryTotals = {};
    transactions
      .filter(t => safeType(t) === 'expense')
      .forEach(t => {
        const category = safeCategory(t);
        categoryTotals[category] = (categoryTotals[category] || 0) + safeAmount(t);
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({
        name,
        value,
        sharePct: currentExpense > 0 ? (value / currentExpense) * 100 : 0
      }));

    const budgetInsights = budgets.map((b) => {
      const category = String(b.category || 'Other');
      const limit = Number(b.limit) || 0;
      const spent = categoryTotals[category] || 0;
      const utilizationPct = limit > 0 ? (spent / limit) * 100 : 0;
      return { category, limit, spent, utilizationPct };
    }).sort((a, b) => b.utilizationPct - a.utilizationPct);

    const breachedBudgets = budgetInsights.filter(b => b.limit > 0 && b.spent > b.limit);
    const nearLimitBudgets = budgetInsights.filter(b => b.limit > 0 && b.spent <= b.limit && b.utilizationPct >= 85);

    const aiInsights = [];

    if (currentIncome === 0 && currentExpense > 0) {
      aiInsights.push('No income recorded this month while expenses are active. Add all income entries first to make projections accurate.');
    }

    if (currentExpense > currentIncome && currentIncome > 0) {
      aiInsights.push(`You are currently overspending by ${formatINR(Math.abs(netBalance))}. Freeze non-essential purchases for the next 7 days.`);
    } else if (forecastedExpense > currentIncome && currentIncome > 0) {
      aiInsights.push(`At the current run rate, expenses may exceed income by ${formatINR(Math.abs(projectedEndOfMonthBalance))} this month.`);
    }

    if (topCategories.length > 0 && topCategories[0].sharePct >= 35) {
      aiInsights.push(`${topCategories[0].name} contributes ${formatPct(topCategories[0].sharePct)} of monthly spending. Set a hard weekly cap for this category.`);
    }

    if (breachedBudgets.length > 0) {
      aiInsights.push(`You exceeded ${breachedBudgets.length} budget ${breachedBudgets.length > 1 ? 'categories' : 'category'}. Prioritize reductions in ${breachedBudgets.slice(0, 2).map(b => b.category).join(', ')}.`);
    } else if (nearLimitBudgets.length > 0) {
      aiInsights.push(`${nearLimitBudgets[0].category} is near the budget limit (${formatPct(nearLimitBudgets[0].utilizationPct)} used). Avoid discretionary spends in this category.`);
    }

    if (savingsRate >= 20) {
      aiInsights.push(`Strong progress: savings rate is ${formatPct(savingsRate)} this month. Maintain this by automating a post-salary transfer.`);
    } else if (currentIncome > 0) {
      aiInsights.push(`Savings rate is ${formatPct(savingsRate)}. Aim for at least 20% by reducing one high-variance category this week.`);
    }

    if (aiInsights.length === 0) {
      aiInsights.push('Your cash flow is stable this month. Keep monitoring category-level trends weekly for early risk detection.');
    }

    const actionPlan = [
      'Track expenses daily for 2 minutes to catch drift early.',
      'Cap top spending category with a weekly amount and pause when reached.',
      'Route at least 20% of income to savings on payday.',
      'Review subscriptions and remove at least one low-value recurring expense.'
    ];

    const recentTransactions = transactions.slice(0, 10);

    const categoryRowsHtml = topCategories.length > 0
      ? topCategories.map(cat => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(cat.name)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatINR(cat.value)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatPct(cat.sharePct)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="3" style="padding:10px;color:#64748b;">No expense categories found for this month.</td></tr>`;

    const budgetRowsHtml = budgetInsights.length > 0
      ? budgetInsights.slice(0, 8).map(item => {
        const status = item.limit > 0 && item.spent > item.limit
          ? 'Exceeded'
          : item.limit > 0 && item.utilizationPct >= 85
            ? 'Near Limit'
            : 'On Track';
        const statusColor = status === 'Exceeded' ? '#dc2626' : status === 'Near Limit' ? '#d97706' : '#166534';
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.category)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatINR(item.spent)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatINR(item.limit)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatPct(item.utilizationPct)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:${statusColor};font-weight:700;">${status}</td>
          </tr>
        `;
      }).join('')
      : `<tr><td colspan="5" style="padding:10px;color:#64748b;">No budgets configured.</td></tr>`;

    const recentTxnRowsHtml = recentTransactions.length > 0
      ? recentTransactions.map(t => {
        const txnType = safeType(t) === 'income' ? 'Income' : 'Expense';
        const color = txnType === 'Income' ? '#166534' : '#b91c1c';
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${new Date(t.date).toLocaleDateString('en-IN')}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(t.description || 'No description')}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${escapeHtml(safeCategory(t))}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:${color};font-weight:700;">${txnType === 'Income' ? '+' : '-'} ${formatINR(safeAmount(t))}</td>
          </tr>
        `;
      }).join('')
      : `<tr><td colspan="4" style="padding:10px;color:#64748b;">No transactions recorded this month.</td></tr>`;

    const emailHtml = `
      <div style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
        <div style="max-width:860px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(2,6,23,0.08);">
          <div style="padding:28px 30px;background:linear-gradient(120deg,#0f172a,#1d4ed8);color:#ffffff;">
            <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">AI Finance Monthly Report</div>
            <h1 style="margin:10px 0 8px 0;font-size:30px;line-height:1.2;">${escapeHtml(reportMonthLabel)} Performance Snapshot</h1>
            <p style="margin:0;font-size:15px;opacity:0.92;">Hello ${escapeHtml(user.name)}, here is a clear breakdown of your finances with guided actions.</p>
          </div>

          <div style="padding:24px 30px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px;">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;">
                <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.06em;">Total Income</div>
                <div style="font-size:24px;font-weight:700;margin-top:4px;color:#0f172a;">${formatINR(currentIncome)}</div>
              </div>
              <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:14px;">
                <div style="font-size:12px;color:#be123c;text-transform:uppercase;letter-spacing:0.06em;">Total Expense</div>
                <div style="font-size:24px;font-weight:700;margin-top:4px;color:#0f172a;">${formatINR(currentExpense)}</div>
              </div>
              <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:14px;">
                <div style="font-size:12px;color:#166534;text-transform:uppercase;letter-spacing:0.06em;">Net Balance</div>
                <div style="font-size:24px;font-weight:700;margin-top:4px;color:#0f172a;">${formatINR(netBalance)}</div>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                <div style="font-size:12px;color:#334155;text-transform:uppercase;letter-spacing:0.06em;">Savings Rate</div>
                <div style="font-size:24px;font-weight:700;margin-top:4px;color:#0f172a;">${formatPct(savingsRate)}</div>
              </div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">
              <h2 style="margin:0 0 10px 0;font-size:18px;color:#0f172a;">Trend and Projection</h2>
              <p style="margin:6px 0;font-size:14px;color:#334155;">Income vs last month: <strong>${formatPct(incomeChangePct)}</strong></p>
              <p style="margin:6px 0;font-size:14px;color:#334155;">Expense vs last month: <strong>${formatPct(expenseChangePct)}</strong></p>
              <p style="margin:6px 0;font-size:14px;color:#334155;">Average daily expense: <strong>${formatINR(avgDailySpend)}</strong></p>
              <p style="margin:6px 0;font-size:14px;color:#334155;">Projected month-end balance (if current pace continues): <strong>${formatINR(projectedEndOfMonthBalance)}</strong></p>
            </div>

            <div style="display:grid;grid-template-columns:1fr;gap:16px;">
              <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="padding:12px 14px;background:#f8fafc;font-weight:700;color:#0f172a;">Top Spending Categories</div>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#f8fafc;color:#334155;text-align:left;">
                      <th style="padding:10px;">Category</th>
                      <th style="padding:10px;text-align:right;">Amount</th>
                      <th style="padding:10px;text-align:right;">Share</th>
                    </tr>
                  </thead>
                  <tbody>${categoryRowsHtml}</tbody>
                </table>
              </div>

              <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="padding:12px 14px;background:#f8fafc;font-weight:700;color:#0f172a;">Budget Health</div>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#f8fafc;color:#334155;text-align:left;">
                      <th style="padding:10px;">Category</th>
                      <th style="padding:10px;text-align:right;">Spent</th>
                      <th style="padding:10px;text-align:right;">Limit</th>
                      <th style="padding:10px;text-align:right;">Utilization</th>
                      <th style="padding:10px;text-align:right;">Status</th>
                    </tr>
                  </thead>
                  <tbody>${budgetRowsHtml}</tbody>
                </table>
              </div>

              <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="padding:12px 14px;background:#f8fafc;font-weight:700;color:#0f172a;">Recent Transactions</div>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#f8fafc;color:#334155;text-align:left;">
                      <th style="padding:10px;">Date</th>
                      <th style="padding:10px;">Description</th>
                      <th style="padding:10px;">Category</th>
                      <th style="padding:10px;text-align:right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${recentTxnRowsHtml}</tbody>
                </table>
              </div>
            </div>

            <div style="margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;">
              <h2 style="margin:0 0 10px 0;font-size:18px;color:#1e3a8a;">AI Insights and Guidance</h2>
              <ol style="margin:0;padding-left:20px;color:#1e293b;line-height:1.65;font-size:14px;">
                ${aiInsights.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
              </ol>
            </div>

            <div style="margin-top:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
              <h2 style="margin:0 0 10px 0;font-size:18px;color:#166534;">Recommended Action Plan</h2>
              <ul style="margin:0;padding-left:20px;color:#14532d;line-height:1.65;font-size:14px;">
                ${actionPlan.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div style="padding:14px 30px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:12px;">
            Generated by AI Finance Assistant on ${new Date().toLocaleString('en-IN')}.
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: emailUser,
      to: user.email,
      subject: `Monthly Financial Report - ${reportMonthLabel}`,
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Report sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    if (error.code === 'EAUTH') {
      return res.status(500).json({ error: 'Gmail authentication failed. Verify EMAIL_USER, use a valid 16-character Gmail App Password in EMAIL_PASS, and ensure 2-Step Verification is enabled.' });
    }
    res.status(500).json({ error: 'Failed to send email' });
  }
});


const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Add /api/send-pdf-report route to handle client-generated PDF uploads
app.post('/api/send-pdf-report', upload.single('report'), async (req, res) => {
  try {
    const { email } = req.body;
    const reportPath = req.file.path;

    if (!email) {
      if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Configure transporter (Update with real SMTP details or use Ethereal for testing)
    // For now, using a placeholder. In production, use process.env vars.
    const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
           user: process.env.EMAIL_USER, // e.g. 'project.ai.finance@gmail.com'
           pass: process.env.EMAIL_PASS  // e.g. app password
       }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email, // Send to the provided email
      subject: 'Your Monthly AI Finance Report',
      html: `
        <h1>Monthly Financial Report Attached</h1>
        <p>Please find your comprehensive monthly financial report below.</p>
        <p>Best regards,<br>Your AI Finance Assistant</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    // Clean up temp file
    fs.unlinkSync(reportPath);
    
    res.json({ message: 'Report sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    // Cleanup if error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

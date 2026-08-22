import React, { forwardRef } from 'react';

const ReportTemplate = forwardRef(({ data, date, user }, ref) => {
    // Default values for financial data
    const {
        totalIncome = 0,
        totalExpenses = 0,
        netSavings = 0,
        savingsRate = 0,
        transactionCount = 0,
        portfolioValue = 0
    } = data || {};

    return (
        <div ref={ref} className="bg-white p-8 w-[1000px] text-gray-800 absolute -left-[9999px] top-0 font-sans">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 border-b-4 border-indigo-600 pb-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">MONTHLY FINANCIAL INSIGHTS</h1>
                    <p className="text-gray-500 mt-2 font-medium">Prepared for: <span className="text-gray-800 font-bold">{user?.name || 'Valued Member'}</span></p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-black text-indigo-600 tracking-wider">AI FINANCE</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Intelligent Wealth Management</p>
                    <p className="text-sm text-gray-500 mt-1">{date}</p>
                </div>
            </div>

            {/* Overview Section Header */}
            <div className="bg-gray-900 text-slate-900 dark:text-white p-4 rounded-t-lg mb-6 shadow-lg flex items-center">
                <div className="w-1 h-6 bg-teal-400 mr-3"></div>
                <h2 className="text-lg font-bold tracking-widest uppercase">Financial Overview</h2>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-3 gap-6 mb-8">

                {/* Spending Trends (Bar Chart) */}
                <div className="col-span-2 bg-white p-5 rounded-xl shadow-md border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spending vs Budget</h3>
                    </div>

                    {/* Simulated Bar Chart */}
                    <div className="flex items-end space-x-3 h-48 mt-2 px-2">
                        {[65, 50, 80, 45, 60, 90, 70, 55, 40, 75, 60, 85].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                <div
                                    className={`w-full rounded-t-md transition-all ${h > 75 ? 'bg-indigo-300' : 'bg-indigo-500'}`}
                                    style={{ height: `${h}%` }}
                                ></div>
                                {/* Hover Tooltip simulated for PDF visual */}
                                {i === 11 && (
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-slate-900 dark:text-white text-[10px] py-1 px-2 rounded font-bold">
                                        ₹{((h / 100) * 5000).toFixed(0)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between text-[10px] text-gray-400 font-bold border-t border-gray-100 pt-3 uppercase">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                        <span>Aug</span>
                        <span>Sep</span>
                        <span>Oct</span>
                        <span>Nov</span>
                        <span>Dec</span>
                    </div>
                </div>

                {/* Income vs Expense Performance (Line Chart) */}
                <div className="col-span-1 bg-white p-5 rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Net Cash Flow</h3>
                    <div className="h-48 relative border-l border-b border-gray-200">
                        {/* Simulated Line Chart using SVG */}
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                            {/* Income Line (Teal) */}
                            <polyline
                                fill="none"
                                stroke="#2dd4bf"
                                strokeWidth="3"
                                strokeLinecap="round"
                                points="0,60 20,55 40,40 60,35 80,30 100,20"
                            />
                            {/* Expense Line (Pink/Red) */}
                            <polyline
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray="4,2"
                                points="0,80 20,70 40,75 60,50 80,60 100,45"
                            />
                        </svg>
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold uppercase">
                        <div className="flex items-center text-gray-600"><span className="w-3 h-3 rounded-full bg-teal-400 mr-2"></span> Income</div>
                        <div className="flex items-center text-gray-600"><span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span> Expense</div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row - Financial Metrics */}
            <div className="grid grid-cols-4 gap-5 mb-8">

                {/* KPI 1: Savings Rate */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center">
                    <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Savings Rate</h3>
                    <div className="relative w-24 h-24 mb-1">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-yellow-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${savingsRate}, 100`} strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-black text-gray-800">{savingsRate}%</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-semibold text-green-500">+1.2% vs last month</p>
                </div>

                {/* KPI 2: Total Transactions */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 relative overflow-hidden">
                    <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Total Transactions</h3>
                    <div className="text-3xl font-black text-gray-800 my-2">{transactionCount}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30">
                        <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0,20 L15,10 L30,15 L50,5 L70,12 L90,8 L100,20 Z" fill="#6366f1" />
                        </svg>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-medium">Activity Level: High</div>
                </div>

                {/* KPI 3: Portfolio Growth */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Portfolio Value</h3>
                    <div className="text-2xl font-black text-gray-800 mb-2">₹{(portfolioValue / 1000).toFixed(1)}k</div>
                    <div className="flex items-end space-x-1 h-10 mt-3">
                        {[40, 45, 42, 50, 55, 52, 60, 65, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-teal-300 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <p className="text-[10px] text-green-600 font-bold mt-2 text-right">▲ 5.4% YTD</p>
                </div>

                {/* KPI 4: Net Savings */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 relative overflow-hidden">
                    <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Net Savings</h3>
                    <div className="text-3xl font-black text-gray-800 my-2">₹{netSavings.toLocaleString()}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
                        <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                            <path d="M0,30 Q50,0 100,30 Z" fill="#2dd4bf" />
                        </svg>
                    </div>
                    <div className="mt-2 text-xs text-green-600 font-bold">On track for goals</div>
                </div>
            </div>

            {/* AI Summary Section - Rewritten for Finance */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                <h3 className="text-sm font-black text-indigo-900 uppercase mb-3 border-b-2 border-indigo-100 pb-2 inline-block">
                    AI Executive Summary
                </h3>
                <p className="text-sm text-gray-600 leading-7 text-justify font-medium">
                    <span className="font-bold text-indigo-600">Analysis:</span> Based on your transaction history for {new Date(date).toLocaleString('default', { month: 'long' })}, your financial health score has improved. You have successfully maintained a
                    savings rate of <span className="font-bold text-gray-800">{savingsRate}%</span>, which exceeds your target of 20%. While discretionary spending in the 'Dining' category saw a 12% uptick mid-month, it was offset by reduced utility costs.
                </p>
                <p className="text-sm text-gray-600 leading-7 text-justify font-medium mt-2">
                    <span className="font-bold text-teal-600">Recommendation:</span> Consistent automated transfers to your high-yield savings account are driving your net worth growth. Consider reallocating the surplus from your 'Entertainment' budget into your investment portfolio to capitalize on the current market uptrend visible in your portfolio analytics.
                </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center border-t pt-4">
                <p className="text-[10px] text-gray-400">This report was automatically generated by AI Finance. Not financial advice.</p>
            </div>

        </div>
    );
});

export default ReportTemplate;
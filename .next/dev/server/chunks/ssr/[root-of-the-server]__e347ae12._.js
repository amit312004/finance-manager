module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/transaction-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TransactionProvider",
    ()=>TransactionProvider,
    "useTransactions",
    ()=>useTransactions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
const TransactionContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const initialTransactions = [
    {
        id: '1',
        date: '2025-05-24',
        description: 'Payment from Client',
        category: 'Income',
        amount: 5000.00,
        type: 'Income',
        status: 'Completed',
        paymentMethod: 'Bank Transfer'
    },
    {
        id: '2',
        date: '2025-05-23',
        description: 'Office Supplies',
        category: 'Supplies',
        amount: 120.50,
        type: 'Expense',
        status: 'Completed',
        paymentMethod: 'Credit Card'
    },
    {
        id: '3',
        date: '2025-05-22',
        description: 'Monthly Rent',
        category: 'Housing',
        amount: 2000.00,
        type: 'Expense',
        status: 'Completed',
        paymentMethod: 'Bank Transfer'
    },
    {
        id: '4',
        date: '2025-05-21',
        description: 'Freelance Project',
        category: 'Income',
        amount: 1500.00,
        type: 'Income',
        status: 'Pending',
        paymentMethod: 'PayPal'
    },
    {
        id: '5',
        date: '2025-05-20',
        description: 'Grocery Shopping',
        category: 'Food',
        amount: 350.00,
        type: 'Expense',
        status: 'Completed',
        paymentMethod: 'Cash'
    },
    {
        id: '6',
        date: '2025-05-19',
        description: 'Internet Bill',
        category: 'Utilities',
        amount: 80.00,
        type: 'Expense',
        status: 'Completed',
        paymentMethod: 'Credit Card'
    },
    {
        id: '7',
        date: '2025-05-18',
        description: 'Consulting Fee',
        category: 'Income',
        amount: 2500.00,
        type: 'Income',
        status: 'Completed',
        paymentMethod: 'Bank Transfer'
    }
];
function TransactionProvider({ children }) {
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initialTransactions);
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const totalIncome = transactions.filter((t)=>t.type === 'Income').reduce((acc, curr)=>acc + curr.amount, 0);
        const totalExpense = transactions.filter((t)=>t.type === 'Expense').reduce((acc, curr)=>acc + curr.amount, 0);
        setStats({
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense
        });
    }, [
        transactions
    ]);
    const addTransaction = (transaction)=>{
        const newTransaction = {
            ...transaction,
            id: Math.random().toString(36).substr(2, 9)
        };
        setTransactions((prev)=>[
                newTransaction,
                ...prev
            ]);
    };
    const deleteTransaction = (id)=>{
        setTransactions((prev)=>prev.filter((t)=>t.id !== id));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TransactionContext.Provider, {
        value: {
            transactions,
            addTransaction,
            deleteTransaction,
            stats
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/transaction-context.tsx",
        lineNumber: 74,
        columnNumber: 5
    }, this);
}
function useTransactions() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e347ae12._.js.map
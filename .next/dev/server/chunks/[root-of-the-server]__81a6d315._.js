module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/analysis/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(request) {
    try {
        const { transactions, totalIncome, totalExpense } = await request.json();
        // --- Simulated "AI" Logic (Logic-based Generation) ---
        // In a real scenario, you would send this prompt to OpenAI/Anthropic API
        // 1. Analyze Category Spending
        const categories = {};
        transactions.forEach((t)=>{
            if (t.type === 'Expense') {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            }
        });
        // Sort categories
        const sortedCats = Object.entries(categories).sort(([, a], [, b])=>b - a);
        const topCategory = sortedCats[0];
        // 2. Generate Insight Text
        let insightTitle = "Spending Analysis";
        let insightText = "";
        let sentiment = "neutral";
        if (totalExpense > totalIncome) {
            insightTitle = "Critical Budget Alert";
            insightText = `Your expenses (₹${totalExpense.toFixed(2)}) currently exceed your income (₹${totalIncome.toFixed(2)}). This is a sustainable risk. The primary driver is ${topCategory ? topCategory[0] : 'general spending'}. Consider reducing discretionary spending immediately.`;
            sentiment = "negative";
        } else if (totalExpense > totalIncome * 0.8) {
            insightTitle = "High Spending Warning";
            insightText = `You are spending ${(totalExpense / totalIncome * 100).toFixed(0)}% of your income. While you are within your means, your savings rate is lower than recommended. Your highest cost center is ${topCategory ? topCategory[0] : 'unknown'}.`;
            sentiment = "warning";
        } else {
            insightTitle = "Healthy Financial State";
            insightText = `Great job! You are maintaining a healthy savings rate of ${((totalIncome - totalExpense) / totalIncome * 100).toFixed(0)}%. Your spending in ${topCategory ? topCategory[0] : 'all categories'} is well managed. Continue this trend to reach your financial goals.`;
            sentiment = "positive";
        }
        // 3. Generate Specific Tip
        const tips = [
            "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
            "Review your subscription services. Cancel any you haven't used in 3 months.",
            "Consider moving your savings to a high-yield account.",
            "Set a specific budget for dining out next month."
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            title: insightTitle,
            analysis: insightText,
            tip: randomTip,
            sentiment
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to generate analysis'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__81a6d315._.js.map
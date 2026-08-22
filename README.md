# Finora - AI Finance Platform

Finora is an advanced AI-powered financial management platform designed to help you track expenses, manage budgets, and gain insights into your financial health.

## Features

- **Smart Dashboard**: Real-time overview of your financial status with interactive charts.
- **Transactions Management**: Detailed transaction history with filtering, sorting, and bulk actions.
- **AI Receipt Scanner**: "Add Transaction" modal with simulated OCR scanning for easy data entry.
- **Advanced Analytics**: Visual reports including Income vs Expense trends and Category breakdowns.
- **Settings**: Manage your profile, report preferences, and security settings.
- **Responsive Design**: Fully responsive UI built with Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: Custom component library (Cards, Buttons, Badges, Inputs)

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app`: Application routes (Dashboard, Transactions, Analytics, Settings).
- `/components/ui`: Reusable UI components (`base.tsx`, `add-transaction-modal.tsx`).
- `/lib`: Utility functions.
- `/public`: Static assets.

## Design

The UI is designed to match the "Finora" dark-themed header with green accents (`#10b981`) and a clean, card-based layout.

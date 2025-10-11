'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PeriodSummary } from '@/types';
import styles from './IncomeSummaryCard.module.css';

interface IncomeSummaryCardProps {
  weeklyData: PeriodSummary[];
  monthlyData: PeriodSummary[];
  currentIncome: number;
  currentExpense: number;
  currentNet: number;
  isLoading?: boolean;
}

export default function IncomeSummaryCard({
  weeklyData,
  monthlyData,
  currentIncome,
  currentExpense,
  currentNet,
  isLoading = false
}: IncomeSummaryCardProps) {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('month');

  const chartData = activeTab === 'week' ? weeklyData : monthlyData;

  // Transform data for bidirectional bar chart
  const transformedData = chartData.map(item => ({
    period: item.period,
    income: item.income,
    expense: -item.expense, // Negative for downward bars
  }));

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(Math.abs(value));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = Math.abs(payload.find((p: any) => p.dataKey === 'expense')?.value || 0);
      const net = income - expense;

      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{payload[0].payload.period}</p>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipIncome}>Income:</span>
            <span>{formatCurrency(income)}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipExpense}>Expense:</span>
            <span>{formatCurrency(expense)}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipNet}>Net:</span>
            <span className={net >= 0 ? styles.positive : styles.negative}>
              {formatCurrency(net)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Income & Expenses</h2>
        <div className={styles.skeleton}>
          <div className={styles.skeletonStats}></div>
          <div className={styles.skeletonTabs}></div>
          <div className={styles.skeletonChart}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Income & Expenses</h2>

      {/* Current Period Stats */}
      <div className={styles.summaryStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Income</span>
          <span className={`${styles.statValue} ${styles.income}`}>
            {formatCurrency(currentIncome)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Expenses</span>
          <span className={`${styles.statValue} ${styles.expense}`}>
            {formatCurrency(currentExpense)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Net</span>
          <span className={`${styles.statValue} ${currentNet >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(currentNet)}
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'week' ? styles.active : ''}`}
          onClick={() => setActiveTab('week')}
        >
          Weekly
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'month' ? styles.active : ''}`}
          onClick={() => setActiveTab('month')}
        >
          Monthly
        </button>
      </div>

      {/* Bidirectional Bar Chart */}
      {chartData.length > 0 ? (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="period"
                stroke="#666"
                fontSize={11}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#4caf50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f44336" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className={styles.noData}>
          No data available for this period
        </div>
      )}
    </div>
  );
}

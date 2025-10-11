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

  // Get current period label from latest monthly data
  const getCurrentPeriodLabel = (): string => {
    if (monthlyData.length === 0) return 'This Month';

    const latestPeriod = monthlyData[monthlyData.length - 1]?.period;
    if (!latestPeriod) return 'This Month';

    // Parse month format (e.g., "2025-10")
    const monthMatch = latestPeriod.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const year = monthMatch[1];
      const month = parseInt(monthMatch[2]) - 1;
      const date = new Date(parseInt(year), month);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    return 'This Month';
  };

  // Format period label based on type
  const formatPeriodLabel = (period: string): string => {
    // Check if it's a week format (e.g., "2025-W01")
    const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
    if (weekMatch) {
      const year = parseInt(weekMatch[1]);
      const week = parseInt(weekMatch[2]);

      // Calculate the start date of the ISO week
      // ISO week 1 is the week with the first Thursday of the year
      const jan4 = new Date(year, 0, 4);
      const jan4Day = jan4.getDay() || 7; // Convert Sunday (0) to 7
      const weekStart = new Date(jan4);
      weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Format the date range
      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
      const endDay = weekEnd.getDate();

      // If same month, show "Jan 1-7"
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      }
      // If different months, show "Dec 30-Jan 5"
      return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
    }

    // For month format (e.g., "2025-01"), show "Jan 2025"
    const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const year = monthMatch[1];
      const month = parseInt(monthMatch[2]) - 1;
      const date = new Date(parseInt(year), month);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Return original if no match
    return period;
  };

  // Transform data for bidirectional bar chart
  const transformedData = chartData.map(item => ({
    period: formatPeriodLabel(item.period),
    originalPeriod: item.period,
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
      const periodLabel = payload[0].payload.period;

      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{periodLabel}</p>
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

      {/* Current Period Section Header */}
      <div className={styles.sectionHeader}>{getCurrentPeriodLabel()} |</div>

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

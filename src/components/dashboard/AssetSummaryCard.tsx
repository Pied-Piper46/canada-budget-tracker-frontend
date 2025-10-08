'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './AssetSummaryCard.module.css';

interface AssetData {
  period: string;
  balance: number;
  change?: number;
  change_pct?: number;
}

interface AssetSummaryCardProps {
  currentBalance: number;
  balanceHistory: AssetData[];
  isLoading?: boolean;
}

export default function AssetSummaryCard({
  currentBalance,
  balanceHistory,
  isLoading = false
}: AssetSummaryCardProps) {
  // Calculate change from previous period
  const previousBalance = balanceHistory.length >= 2
    ? balanceHistory[balanceHistory.length - 2].balance
    : currentBalance;

  const change = currentBalance - previousBalance;
  const changePct = previousBalance !== 0
    ? (change / previousBalance) * 100
    : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{payload[0].payload.period}</p>
          <p className={styles.tooltipValue}>{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Total Assets</h2>
        <div className={styles.skeleton}>
          <div className={styles.skeletonAmount}></div>
          <div className={styles.skeletonChange}></div>
          <div className={styles.skeletonChart}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Total Assets</h2>

      <div className={styles.assetAmount}>
        {formatCurrency(currentBalance)}
      </div>

      <div className={`${styles.assetChange} ${change < 0 ? styles.negative : styles.positive}`}>
        {formatCurrency(change)} ({formatPercent(changePct)})
      </div>

      {balanceHistory.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={balanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="period"
                stroke="#666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#000"
                strokeWidth={2}
                dot={{ fill: '#000', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {balanceHistory.length === 0 && (
        <div className={styles.noData}>
          No asset history available yet
        </div>
      )}
    </div>
  );
}

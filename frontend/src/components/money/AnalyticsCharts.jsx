import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnalyticsCharts({
  trendData = [],
  categoryData = [],
  accountBalances = [],
  selectedMonth,
  onMonthChange,
}) {
  const [trendRange, setTrendRange] = useState('6m');

  // Format month YYYY-MM to human readable (e.g. July 2026)
  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const handleMonthShift = (direction) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let newYear = y;
    let newMonth = m + direction;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    onMonthChange(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
  };

  // Convert paise to rupees for Recharts displaying
  const processedTrend = trendData.map((d) => ({
    ...d,
    income: d.income / 100,
    expense: d.expense / 100,
  }));

  const processedCategory = categoryData.map((c) => ({
    ...c,
    amount: c.amount / 100,
  }));

  const processedAccounts = accountBalances.map((a) => ({
    name: a.name,
    balance: a.current_balance / 100,
    color: a.color,
  }));

  const CustomTooltipRupees = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '13px' }}>{label || ''}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ margin: '4px 0 0 0', fontSize: '13px', color: p.color || p.fill }}>
              {p.name}: {p.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Controls: Month switcher & Trend range */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => handleMonthShift(-1)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: '700', minWidth: '140px', textAlign: 'center' }}>
            {formatMonthLabel(selectedMonth)}
          </span>
          <button onClick={() => handleMonthShift(1)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Trend Range Selector */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
          {['6m', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTrendRange(range)}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: trendRange === range ? 'var(--surface)' : 'transparent',
                color: trendRange === range ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {range === '6m' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of charts */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Trend Line Chart */}
        <div className="card" style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Income vs Expense Trend</h4>
          <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip content={<CustomTooltipRupees />} />
                <Legend verticalAlign="top" height={36} fontSize={12} />
                <Line type="monotone" dataKey="income" name="Income" stroke="var(--success)" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="var(--danger)" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown pie chart */}
        <div className="card" style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Expense Breakdown by Category</h4>
          <div style={{ flex: 1, width: '100%', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {processedCategory.length === 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No expense data for this month.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedCategory}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {processedCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                    }
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconSize={10} fontSize={11} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Account balance comparison bar chart */}
        <div className="card" style={{ padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column', gridColumn: 'span 1' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Wallet / Account Balances</h4>
          <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedAccounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  formatter={(value) =>
                    value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                  }
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                />
                <Bar dataKey="balance" name="Balance">
                  {processedAccounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell, ReferenceLine } from 'recharts';

const CashFlow = () => {
  const { globalData, globalLoading, globalError } = useData();

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading Cash Flow Data...</div>;
  if (globalError || !globalData) return <div className="empty text-danger">Failed to load cash flow data.</div>;

  const rawForecasts = globalData.cashflow?.forecasts || [];
  const comment = globalData.cashflow?.comment || '';
  const loading = false; // Mock local loading since we check globalLoading above

  // Group by Date for Chart
  const grouped = rawForecasts.reduce((acc, curr) => {
      const date = new Date(curr.BucketStartDate).toLocaleDateString(undefined, { month: 'short' });
      if (!acc[date]) acc[date] = { name: date, Inflows: 0, Outflows: 0 };
      if (curr.DirectionCode === 'IN') acc[date].Inflows += curr.Amount;
      if (curr.DirectionCode === 'OUT') acc[date].Outflows += Math.abs(curr.Amount);
      return acc;
  }, {});
  
  const forecasts = Object.values(grouped).map(f => ({
      ...f,
      Surplus: f.Inflows - f.Outflows
  }));
  
  let totalIn = 0;
  let totalOut = 0;
  forecasts.forEach(f => {
      totalIn += f.Inflows;
      totalOut += f.Outflows;
  });

  const chartData = [...forecasts, { name: 'Total', Inflows: totalIn, Outflows: totalOut }];

  return (
    <div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 20, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Left Column Top: Inflows vs Outflows Chart */}
          <div className="card animate-fade-in">
            <div className="card-header">
              <div className="card-title">Inflows vs Outflows (QAR mn)</div>
            </div>
            {loading ? (
                <div className="empty animate-pulse-dot" style={{ height: 200 }}>Loading chart...</div>
            ) : forecasts.length === 0 ? (
                <div className="empty" style={{ height: 200 }}>No forecast data available.</div>
            ) : (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                      <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
                      <Bar dataKey="Inflows" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20}>
                        <LabelList dataKey="Inflows" position="top" fill="var(--text-primary)" fontSize={11} formatter={(val) => val ? parseFloat(val).toFixed(1) : ''} />
                      </Bar>
                      <Bar dataKey="Outflows" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20}>
                        <LabelList dataKey="Outflows" position="top" fill="var(--text-primary)" fontSize={11} formatter={(val) => val ? parseFloat(val).toFixed(1) : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            )}
          </div>

          {/* Left Column Bottom: Surplus / (Deficit) Chart */}
          <div className="card animate-fade-in">
            <div className="card-header">
              <div className="card-title">Surplus / (Deficit) funds</div>
            </div>
            {loading ? (
                <div className="empty animate-pulse-dot" style={{ height: 200 }}>Loading chart...</div>
            ) : forecasts.length === 0 ? (
                <div className="empty" style={{ height: 200 }}>No forecast data available.</div>
            ) : (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData.filter(d => d.name !== 'Total')} margin={{ top: 20, right: 30, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                      <Bar dataKey="Surplus" radius={[4, 4, 0, 0]} barSize={20}>
                        <LabelList dataKey="Surplus" position="top" fill="var(--text-primary)" fontSize={11} formatter={(val) => (val !== undefined && val !== null) ? parseFloat(val).toFixed(1) : ''} />
                        {chartData.filter(d => d.name !== 'Total').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Surplus >= 0 ? '#10B981' : '#F43F5E'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Comments */}
        <div className="card animate-fade-in" style={{ height: '100%' }}>
          <div className="card-header">
            <div className="card-title">Comments</div>
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            {comment ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{comment}</div>
            ) : (
              <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No comments added yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;

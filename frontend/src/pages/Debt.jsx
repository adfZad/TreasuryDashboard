import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Debt = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/debt')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="empty animate-pulse-dot">Loading debt & equity data...</div>;

  const totalDebt = data?.totalDebt || 0;
  const totalEquity = data?.totalEquity || 0;
  const debtToEquity = totalEquity > 0 ? (totalDebt / totalEquity).toFixed(2) : 'N/A';

  const chartData = [
    { name: 'Total Debt', value: totalDebt, color: '#F43F5E' },
    { name: 'Total Equity', value: totalEquity, color: '#10B981' }
  ];

  return (
    <div>
      <div className="section-heading">
        <h2>Debt & Liquidity Position</h2>
        <p>Gearing and liquidity reserves</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-label">Total Outstanding Debt</div>
            <div className="kpi-icon" style={{ color: 'var(--danger)', background: 'var(--danger-soft)' }}>▣</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap' }}>
            {totalDebt.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-label">Total Book Equity</div>
            <div className="kpi-icon" style={{ color: 'var(--blue)', background: 'var(--blue-soft)' }}>▣</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap' }}>
            {totalEquity.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-top">
            <div className="kpi-label">Debt-to-Equity Ratio</div>
            <div className="kpi-icon" style={{ color: 'var(--text)', background: 'var(--surface-2)' }}>◫</div>
          </div>
          <div className="kpi-value">{debtToEquity}x</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px', display: 'flex', gap: '30px' }}>
        <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Capital Structure</h3>
            <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Liquid Assets</h3>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Asset Class</th>
                            <th className="num">Market Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Treasury Bonds</td><td className="num text-muted">0.00</td></tr>
                        <tr><td>Money Market Funds</td><td className="num text-muted">0.00</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Debt;

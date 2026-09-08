import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Funds = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/funds')
      .then(res => {
        setBalances(res.data.balances || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const total = balances.reduce((sum, b) => sum + (b.ClosingBalance || 0), 0);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6'];
  const chartData = balances.map(b => ({ name: b.BankName, value: b.ClosingBalance }));

  return (
    <div>
      <div className="section-heading">
        <h2>Funds Position</h2>
        <p>Total bank balances across all entities</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-label">Total Cash</div>
            <div className="kpi-icon">▣</div>
          </div>
          <div className="kpi-value">{total.toFixed(2)} QAR</div>
          <div className="kpi-sub">Total across {balances.length} accounts</div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Balances by Bank</h3>
            <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div style={{ flex: 2 }} className="table-wrap">
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Account Details</h3>
          <table>
            <thead>
              <tr>
                <th>Bank</th>
                <th>Account Name</th>
                <th>Account Number</th>
                <th>Currency</th>
                <th className="num">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="empty animate-pulse-dot">Loading data...</td></tr>
              ) : balances.length === 0 ? (
                <tr><td colSpan="5" className="empty">No balances found.</td></tr>
              ) : (
                balances.map((b, idx) => (
                  <tr key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td><span className="badge badge-accent">{b.BankName}</span></td>
                    <td>{b.AccountName}</td>
                    <td className="font-mono text-muted">{b.AccountNumber}</td>
                    <td>{b.CurrencyCode}</td>
                    <td className="num"><strong>{b.ClosingBalance?.toFixed(2)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funds;

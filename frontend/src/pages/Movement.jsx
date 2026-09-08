import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Movement = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/movement')
      .then(res => {
        setMovements(res.data.movements || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const chartData = movements.reduce((acc, curr) => {
    const dateStr = new Date(curr.BucketStartDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    let existing = acc.find(x => x.name === dateStr);
    if (!existing) {
        existing = { name: dateStr, OpeningBalance: 0, ClosingBalance: 0 };
        acc.push(existing);
    }
    existing.OpeningBalance += curr.OpeningOutstanding;
    existing.ClosingBalance += curr.ClosingOutstanding;
    return acc;
  }, []);

  return (
    <div>
      <div className="section-heading">
        <h2>Projected Loan Movement</h2>
        <p>Monthly bucket breakdown for repayments and drawdowns</p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ stroke: 'var(--border)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Line type="monotone" dataKey="OpeningBalance" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="ClosingBalance" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bucket Month</th>
                <th>Loan Reference</th>
                <th className="num">Opening Balance</th>
                <th className="num">Repayments</th>
                <th className="num">Drawdowns</th>
                <th className="num">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="empty animate-pulse-dot">Loading data...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan="6" className="empty">No movement forecast available.</td></tr>
              ) : (
                movements.map((m, idx) => {
                  const dateLabel = new Date(m.BucketStartDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  return (
                    <tr key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td><strong>{dateLabel}</strong></td>
                      <td className="font-mono text-muted">{m.LoanReference}</td>
                      <td className="num">{m.OpeningOutstanding?.toFixed(2)}</td>
                      <td className="num text-success">{m.PaymentAmount?.toFixed(2)}</td>
                      <td className="num text-danger">{m.NewDrawdownAmount?.toFixed(2)}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{m.ClosingOutstanding?.toFixed(2)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Movement;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CashFlow = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/cashflow')
      .then(res => {
        // Group by Date for Chart
        const grouped = (res.data.forecasts || []).reduce((acc, curr) => {
            const date = new Date(curr.BucketStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (!acc[date]) acc[date] = { name: date, Inflows: 0, Outflows: 0 };
            if (curr.DirectionCode === 'IN') acc[date].Inflows += curr.Amount;
            if (curr.DirectionCode === 'OUT') acc[date].Outflows += Math.abs(curr.Amount);
            return acc;
        }, {});
        
        setForecasts(Object.values(grouped));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="section-heading">
        <h2>Cash Flow Projection</h2>
        <p>Short term liquidity forecast via SQL Server</p>
      </div>

      <div className="card animate-fade-in" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Inflows vs Outflows (QAR m)</div>
        </div>
        {loading ? (
            <div className="empty animate-pulse-dot" style={{ height: 300 }}>Loading chart...</div>
        ) : forecasts.length === 0 ? (
            <div className="empty" style={{ height: 300 }}>No forecast data available.</div>
        ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={forecasts} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Bar dataKey="Inflows" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Outflows" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Forecast Breakdown</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th className="num">Inflows</th>
                <th className="num">Outflows</th>
                <th className="num">Net Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((d, i) => (
                <tr key={i}>
                  <td><strong>{d.name}</strong></td>
                  <td className="num text-success">{d.Inflows?.toFixed(2)}</td>
                  <td className="num text-danger">{d.Outflows?.toFixed(2)}</td>
                  <td className="num" style={{ fontWeight: 'bold' }}>{(d.Inflows - d.Outflows).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;

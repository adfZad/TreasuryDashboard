import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Aggregate by BucketStartDate
  const aggregatedData = movements.reduce((acc, curr) => {
    const dateStr = new Date(curr.BucketStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' ');
    const rawDate = new Date(curr.BucketStartDate).getTime();
    
    let existing = acc.find(x => x.rawDate === rawDate);
    if (!existing) {
        existing = { name: dateStr, rawDate, GrossLoans: 0, TotalClosing: 0 };
        acc.push(existing);
    }
    // Match the offline dashboard: Plot Opening Balances for the month
    existing.GrossLoans += curr.OpeningOutstanding;
    existing.TotalClosing += curr.ClosingOutstanding;
    return acc;
  }, []);

  // Sort chronologically
  aggregatedData.sort((a, b) => a.rawDate - b.rawDate);

  // Add the final "Projected" point which is the closing balance of the last month
  if (aggregatedData.length > 0) {
      const lastBucket = aggregatedData[aggregatedData.length - 1];
      aggregatedData.push({
          name: 'Projected',
          rawDate: lastBucket.rawDate + 1,
          GrossLoans: lastBucket.TotalClosing
      });
  }

  // Calculate Net Loans (Gross - Liquidity Reserve)
  const LIQUIDITY_RESERVE = 10.00;
  aggregatedData.forEach(item => {
    item.NetLoans = item.GrossLoans - LIQUIDITY_RESERVE;
  });

  return (
    <div>
      <div className="section-heading">
        <h2>Projected Loan Movement</h2>
        <p>Loan balance after scheduled repayments, new loans and liquidity reserve</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Total Loan Movement Chart */}
        <div className="card">
          <div style={{ padding: '0 0 20px 0' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Total Loan Movement</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>Projected gross loan balance</p>
          </div>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip cursor={{ stroke: 'var(--border)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                    <Line type="monotone" dataKey="GrossLoans" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} label={{ position: 'top', fill: '#64748b', fontSize: 10, formatter: (val) => val.toFixed(2) }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Loan Movement Chart */}
        <div className="card">
          <div style={{ padding: '0 0 20px 0' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Net Loan Movement</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>After QAR 10m liquidity reserve</p>
          </div>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip cursor={{ stroke: 'var(--border)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                    <Line type="monotone" dataKey="NetLoans" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} label={{ position: 'top', fill: '#64748b', fontSize: 10, formatter: (val) => val.toFixed(2) }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="card">
        <div style={{ padding: '0 0 20px 0' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>Movement Schedule</h3>
          <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>High level projection from source workbook</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE / PERIOD</th>
                <th className="num">GROSS LOANS</th>
                <th className="num">LIQUIDITY RESERVE</th>
                <th className="num">NET LOANS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="empty animate-pulse-dot">Loading data...</td></tr>
              ) : aggregatedData.length === 0 ? (
                <tr><td colSpan="4" className="empty">No movement forecast available.</td></tr>
              ) : (
                aggregatedData.map((m, idx) => {
                  return (
                    <tr key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td><strong>{m.name}</strong></td>
                      <td className="num">{m.GrossLoans?.toFixed(2)}</td>
                      <td className="num">{LIQUIDITY_RESERVE.toFixed(2)}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{m.NetLoans?.toFixed(2)}</td>
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

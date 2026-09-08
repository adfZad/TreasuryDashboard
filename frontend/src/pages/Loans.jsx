import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/loans')
      .then(res => {
        setLoans(res.data.loans || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalDebt = loans.reduce((sum, l) => sum + (l.CurrentOutstanding || 0), 0);

  // Group by Lender for Chart
  const lenderMap = loans.reduce((acc, l) => {
    acc[l.LenderName] = (acc[l.LenderName] || 0) + (l.CurrentOutstanding || 0);
    return acc;
  }, {});
  const chartData = Object.keys(lenderMap).map(key => ({ name: key, value: lenderMap[key] }));
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E'];

  return (
    <div>
      <div className="section-heading">
        <h2>Loan Position</h2>
        <p>Corporate borrowings and term loans</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-label">Total Outstanding Debt</div>
            <div className="kpi-icon">▣</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap' }}>
            {totalDebt.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
          <div className="kpi-sub">Across {loans.length} active facilities</div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Debt by Lender</h3>
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
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Loan Schedule</h3>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Lender</th>
                <th>Type</th>
                <th>Maturity Date</th>
                <th className="num">Original Amount</th>
                <th className="num">Current Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="empty animate-pulse-dot">Loading loans...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="6" className="empty">No active loans found.</td></tr>
              ) : (
                loans.map((l, idx) => (
                  <tr key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td className="font-mono text-muted">{l.LoanReference}</td>
                    <td><strong>{l.LenderName}</strong></td>
                    <td><span className="badge" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--text)' }}>{l.LoanTypeCode}</span></td>
                    <td>{new Date(l.MaturityDate).toLocaleDateString()}</td>
                    <td className="num">{l.OriginalLoanAmount?.toFixed(2)}</td>
                    <td className="num" style={{ color: 'var(--danger)', fontWeight: 600 }}>{l.CurrentOutstanding?.toFixed(2)}</td>
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

export default Loans;

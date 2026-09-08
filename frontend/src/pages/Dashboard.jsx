import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
        axios.get('/api/dashboard'),
        axios.get('/api/funds'),
        axios.get('/api/cashflow'),
        axios.get('/api/workingcapital'),
        axios.get('/api/loans'),
        axios.get('/api/debt')
    ]).then(responses => {
        setData({
            kpi: responses[0].data,
            funds: responses[1].data.balances || [],
            cashflow: responses[2].data.forecasts || [],
            wc: responses[3].data.facilities || [],
            loans: responses[4].data.loans || [],
            debt: responses[5].data.kpi || {}
        });
        setLoading(false);
    }).catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, []);

  if (loading || !data) return <div className="empty animate-pulse-dot">Loading Dashboard...</div>;

  const { kpi, funds, cashflow, wc, loans, debt } = data;

  // KPIs
  const totalBank = kpi?.bankBalance || 0;
  const availableFunds = totalBank + (kpi?.wcSanctioned || 0) - (kpi?.wcUtilized || 0);
  const wcUtilPct = kpi?.wcSanctioned > 0 ? (kpi.wcUtilized / kpi.wcSanctioned) * 100 : 0;
  const totalLoans = kpi?.totalLoans || 0;
  const debtEquity = kpi?.totalEquity > 0 ? (totalLoans / kpi.totalEquity).toFixed(2) : '0.00';
  
  // Net Cash Flow (Sum)
  const netCash = cashflow.reduce((sum, curr) => sum + (curr.DirectionCode === 'IN' ? curr.Amount : -Math.abs(curr.Amount)), 0);

  // Funds Chart Data
  const fundsChartData = funds.map(b => ({ name: b.BankName, value: b.ClosingBalance }));
  
  // Cashflow Chart Data
  const cfGrouped = cashflow.reduce((acc, curr) => {
    const date = new Date(curr.BucketStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = { name: date, Inflows: 0, Outflows: 0 };
    if (curr.DirectionCode === 'IN') acc[date].Inflows += curr.Amount;
    if (curr.DirectionCode === 'OUT') acc[date].Outflows += Math.abs(curr.Amount);
    return acc;
  }, {});
  const cashflowChartData = Object.values(cfGrouped);

  // WC Chart Data
  const wcGrouped = wc.reduce((acc, curr) => {
      const bank = curr.BankName;
      if (!acc[bank]) acc[bank] = { name: bank, Sanctioned: 0, Utilized: 0 };
      acc[bank].Sanctioned += curr.SanctionedLimit;
      acc[bank].Utilized += curr.UtilizedAmount;
      return acc;
  }, {});
  const wcChartData = Object.values(wcGrouped);
  const highUtilCount = wcChartData.filter(x => x.Sanctioned > 0 && (x.Utilized / x.Sanctioned) >= 0.8).length;

  // Debt Mix
  const stl = loans.filter(l => l.LoanTypeCode === 'STL').reduce((sum, l) => sum + l.CurrentOutstanding, 0);
  const ltl = loans.filter(l => l.LoanTypeCode === 'LTL').reduce((sum, l) => sum + l.CurrentOutstanding, 0);
  const debtMixData = [
      { name: 'Short Term', value: stl, color: '#4F46E5' },
      { name: 'Long Term', value: ltl, color: '#10B981' }
  ];

  // Liquidity
  const liquidCost = (debt?.liquidAssetsCost || 0) + totalBank;
  const liquidMarket = (debt?.liquidAssetsMarket || 0) + totalBank;

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Bank Balance</div><div className="kpi-icon" style={{color:'var(--blue)'}}>▣</div></div><div className="kpi-value">{totalBank.toFixed(2)}</div><div className="kpi-foot">Current total bank balance</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Available Funds</div><div className="kpi-icon" style={{color:'var(--green)'}}>◉</div></div><div className="kpi-value good">{availableFunds.toFixed(2)}</div><div className="kpi-foot">After liquidity and WC reserves</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">WC Utilisation</div><div className="kpi-icon" style={{color:'var(--danger)'}}>◫</div></div><div className="kpi-value">{wcUtilPct.toFixed(1)}%</div><div className="kpi-foot">{kpi?.wcUtilized?.toFixed(1)} used of {kpi?.wcSanctioned?.toFixed(1)}</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Total Loans</div><div className="kpi-icon">▤</div></div><div className="kpi-value">{totalLoans.toFixed(2)}</div><div className="kpi-foot">STL {stl.toFixed(0)} · LTL {ltl.toFixed(0)}</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Debt / Equity</div><div className="kpi-icon">◎</div></div><div className="kpi-value">{debtEquity}x</div><div className="kpi-foot">Equity book value {kpi?.totalEquity?.toFixed(1) || 0}</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">3 Month Net Cash</div><div className="kpi-icon" style={{color:'var(--text)'}}>↕</div></div><div className={`kpi-value ${netCash >= 0 ? 'good' : 'bad'}`}>{netCash > 0 ? '+' : ''}{netCash.toFixed(2)}</div><div className="kpi-foot">Aug to Oct excluding Murabaha</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Bank Wise Funds Position</div>
              <div className="card-subtitle">QAR accounts by bank</div>
            </div>
            <span className="badge blue">QAR accounts</span>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={fundsChartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#397bbd" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Cash Flow Projection</div>
              <div className="card-subtitle">August to October 2026</div>
            </div>
            <span className={`badge ${netCash >= 0 ? 'green' : 'red'}`}>Net {netCash > 0 ? '+' : ''}{netCash.toFixed(0)}</span>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={cashflowChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Inflows" fill="#6caa52" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar dataKey="Outflows" fill="#dc6b61" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Working Capital Facility Utilisation</div>
              <div className="card-subtitle">Bank wise sanctioned vs utilised</div>
            </div>
            <span className={`badge ${highUtilCount > 0 ? 'amber' : 'green'}`}>{highUtilCount} banks ≥ 80%</span>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={wcChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sanctioned" fill="#3479bd" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar dataKey="Utilized" fill="#8d6fba" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Debt Mix</div>
              <div className="card-subtitle">Short term vs long term</div>
            </div>
            <span className="badge blue">QAR mn</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: 260 }}>
            <div style={{ flex: 1, height: '100%' }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={debtMixData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                            {debtMixData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
                <div className="metric-row"><span className="metric-name">Short term loans</span><span className="metric-value">{stl.toFixed(0)}</span></div>
                <div className="metric-row"><span className="metric-name">Long term loans</span><span className="metric-value">{ltl.toFixed(0)}</span></div>
                <div className="metric-row"><span className="metric-name">Current total</span><span className="metric-value font-bold">{totalLoans.toFixed(0)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Liquidity at Historical Cost</div>
              <div className="card-subtitle">Current recalculated ratio</div>
            </div>
          </div>
          <div className="ratio-card">
              <div className="ratio-big" style={{ '--pct': `${Math.min((liquidCost / totalLoans) * 100, 100)}%` }}><span>{(liquidCost / totalLoans).toFixed(2)}x</span></div>
              <div>
                  <div className="metric-row"><span className="metric-name">Liquid assets</span><span className="metric-value">{liquidCost.toFixed(1)}</span></div>
                  <div className="metric-row"><span className="metric-name">Debt</span><span className="metric-value">{totalLoans.toFixed(1)}</span></div>
              </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Liquidity at Market Value</div>
              <div className="card-subtitle">Current recalculated ratio</div>
            </div>
          </div>
          <div className="ratio-card">
              <div className="ratio-big" style={{ '--pct': `${Math.min((liquidMarket / totalLoans) * 100, 100)}%` }}><span>{(liquidMarket / totalLoans).toFixed(2)}x</span></div>
              <div>
                  <div className="metric-row"><span className="metric-name">Liquid assets</span><span className="metric-value">{liquidMarket.toFixed(1)}</span></div>
                  <div className="metric-row"><span className="metric-name">Debt</span><span className="metric-value">{totalLoans.toFixed(1)}</span></div>
              </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Management Attention</div>
              <div className="card-subtitle">Key items from current data</div>
            </div>
          </div>
          <div>
              <div className="metric-row"><span className="metric-name">Available funds after reserves</span><span className={`metric-value ${availableFunds < 10 ? 'warn' : 'good'}`}>{availableFunds.toFixed(2)}</span></div>
              {wcChartData.filter(x => x.Sanctioned > 0).sort((a,b) => (b.Utilized/b.Sanctioned) - (a.Utilized/a.Sanctioned)).slice(0, 2).map((b, i) => (
                  <div className="metric-row" key={i}><span className="metric-name">{b.name} WC utilisation</span><span className={`metric-value ${(b.Utilized/b.Sanctioned) >= 0.8 ? 'bad' : 'good'}`}>{((b.Utilized/b.Sanctioned)*100).toFixed(1)}%</span></div>
              ))}
              <div className="metric-row"><span className="metric-name">3 Month Net Cash</span><span className={`metric-value ${netCash < 0 ? 'bad' : 'good'}`}>{netCash.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
      
      <div className="note-box alert-box" style={{ marginTop: '16px' }}><strong>Source quality note:</strong> the Debt & Equity sheet contains several <strong>#REF!</strong> formulas. This prototype recalculates the current Debt / Equity and liquid asset ratios from the valid current balances in the workbook instead of displaying the broken references.</div>
    </div>
  );
};

export default Dashboard;

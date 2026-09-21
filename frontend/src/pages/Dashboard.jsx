import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Funds from './Funds';
import CashFlow from './CashFlow';
import WorkingCapital from './WorkingCapital';
import Loans from './Loans';
import Debt from './Debt';
import Movement from './Movement';

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom: '8px', overflow: 'hidden' }}>
      <div 
        className="card-header" 
        style={{ cursor: 'pointer', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, borderBottom: isOpen ? '1px solid var(--line)' : 'none' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="card-title" style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{title}</div>
        <div style={{ fontSize: '20px', color: 'var(--blue)', fontWeight: '600', lineHeight: '20px' }}>{isOpen ? '−' : '+'}</div>
      </div>
      {isOpen && (
        <div style={{ padding: '16px 0', backgroundColor: '#f9fbfd' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { globalData, globalLoading, globalError } = useData();

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading Dashboard...</div>;
  if (globalError || !globalData) return <div className="empty text-danger" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>Failed to load data. The database might be busy. Click here to refresh.</div>;

  const formatNum = (num, digits = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: digits }).format(num);
  };

  const { kpi, funds, cashflow, wc, loans, debt } = globalData;
  const fundsBalances = funds.balances || [];
  const cashflowForecasts = cashflow.forecasts || [];
  const wcFacilities = wc.facilities || [];
  const loansData = loans.loans || [];

  // KPIs
  const totalBank = kpi?.bankBalance || 0;
  const availableFunds = totalBank + (kpi?.wcSanctioned || 0) - (kpi?.wcUtilized || 0);
  const wcUtilPct = kpi?.wcSanctioned > 0 ? (kpi.wcUtilized / kpi.wcSanctioned) * 100 : 0;
  const totalLoans = kpi?.totalLoans || 0;
  const debtEquity = kpi?.totalEquity > 0 ? (totalLoans / kpi.totalEquity).toFixed(2) : '0.00';
  
  // Net Cash Flow (Sum)
  const netCash = cashflowForecasts.reduce((sum, curr) => sum + (curr.DirectionCode === 'IN' ? curr.Amount : -Math.abs(curr.Amount)), 0);

  // Funds Chart Data
  const fundsChartData = fundsBalances.map(b => ({ name: b.BankName, value: b.ClosingBalance }));
  
  // Cashflow Chart Data
  const cfGrouped = cashflowForecasts.reduce((acc, curr) => {
    const date = new Date(curr.BucketStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = { name: date, Inflows: 0, Outflows: 0 };
    if (curr.DirectionCode === 'IN') acc[date].Inflows += curr.Amount;
    if (curr.DirectionCode === 'OUT') acc[date].Outflows += Math.abs(curr.Amount);
    return acc;
  }, {});
  const cashflowChartData = Object.values(cfGrouped);

  // WC Chart Data
  const wcGrouped = wcFacilities.reduce((acc, curr) => {
      const bank = curr.BankName;
      if (!acc[bank]) acc[bank] = { name: bank, Sanctioned: 0, Utilized: 0 };
      acc[bank].Sanctioned += curr.SanctionedLimit;
      acc[bank].Utilized += curr.UtilizedAmount;
      return acc;
  }, {});
  const wcChartData = Object.values(wcGrouped);
  const highUtilCount = wcChartData.filter(x => x.Sanctioned > 0 && (x.Utilized / x.Sanctioned) >= 0.8).length;

  // Debt Mix
  const stl = loansData.filter(l => l.LoanTypeCode === 'STL').reduce((sum, l) => sum + l.CurrentOutstanding, 0);
  const ltl = loansData.filter(l => l.LoanTypeCode === 'LTL').reduce((sum, l) => sum + l.CurrentOutstanding, 0);
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
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Bank Balance</div><div className="kpi-icon" style={{color:'var(--blue)'}}>▣</div></div><div className="kpi-value">{formatNum(totalBank)}</div><div className="kpi-foot">Current total bank balance</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Available Funds</div><div className="kpi-icon" style={{color:'var(--green)'}}>◉</div></div><div className="kpi-value good">{formatNum(availableFunds)}</div><div className="kpi-foot">After liquidity and WC reserves</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">WC Utilisation</div><div className="kpi-icon" style={{color:'var(--danger)'}}>◫</div></div><div className="kpi-value">{formatNum(wcUtilPct, 1)}%</div><div className="kpi-foot">{formatNum(kpi?.wcUtilized, 1)} used of {formatNum(kpi?.wcSanctioned, 1)}</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Total Loans</div><div className="kpi-icon">▤</div></div><div className="kpi-value">{formatNum(totalLoans)}</div><div className="kpi-foot">STL {formatNum(stl, 0)} · LTL {formatNum(ltl, 0)}</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">Debt / Equity</div><div className="kpi-icon">◎</div></div><div className="kpi-value">{formatNum(debtEquity)}x</div><div className="kpi-foot">Equity book value {formatNum(kpi?.totalEquity, 1)}</div></div>
        <div className="kpi-card"><div className="kpi-top"><div className="kpi-label">3 Month Net Cash</div><div className="kpi-icon" style={{color:'var(--text)'}}>↕</div></div><div className={`kpi-value ${netCash >= 0 ? 'good' : 'bad'}`}>{netCash > 0 ? '+' : ''}{formatNum(netCash)}</div><div className="kpi-foot">Aug to Oct excluding Murabaha</div></div>
      </div>

      <div style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Accordion title="Funds Position">
          <Funds />
        </Accordion>
        <Accordion title="Cash Flow">
          <CashFlow />
        </Accordion>
        <Accordion title="Working Capital">
          <WorkingCapital />
        </Accordion>
        <Accordion title="Loans">
          <Loans />
        </Accordion>
        <Accordion title="Debt & Liquidity">
          <Debt />
        </Accordion>
        <Accordion title="Loan Movement">
          <Movement />
        </Accordion>
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
              <div className="ratio-big" style={{ '--pct': `${Math.min((liquidCost / totalLoans) * 100, 100)}%` }}><span>{formatNum(liquidCost / totalLoans)}x</span></div>
              <div>
                  <div className="metric-row"><span className="metric-name">Liquid assets</span><span className="metric-value">{formatNum(liquidCost)}</span></div>
                  <div className="metric-row"><span className="metric-name">Debt</span><span className="metric-value">{formatNum(totalLoans)}</span></div>
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
              <div className="ratio-big" style={{ '--pct': `${Math.min((liquidMarket / totalLoans) * 100, 100)}%` }}><span>{formatNum(liquidMarket / totalLoans)}x</span></div>
              <div>
                  <div className="metric-row"><span className="metric-name">Liquid assets</span><span className="metric-value">{formatNum(liquidMarket)}</span></div>
                  <div className="metric-row"><span className="metric-name">Debt</span><span className="metric-value">{formatNum(totalLoans)}</span></div>
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
      

    </div>
  );
};

export default Dashboard;

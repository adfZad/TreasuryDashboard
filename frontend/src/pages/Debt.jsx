import React from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const Debt = () => {
  const { globalData, globalLoading, globalError } = useData();

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading debt & equity data...</div>;
  if (globalError || !globalData || !globalData.debt || !globalData.debt.excelData) return <div className="empty text-danger">Failed to load debt data.</div>;

  const data = globalData.debt.excelData;
  if (!data.debtOverview) return <div className="empty text-muted">No Debt Excel data available. Please upload the Treasury Report.</div>;

  const overview = data.debtOverview;
  const deRatio = data.debtEquityRatio;
  const laCost = data.liquidAssetsCost;
  const laMkt = data.liquidAssetsMkt;

  const totalDebt = overview.shortTerm + overview.longTerm;
  const totalEquity = overview.equityBookValue;
  const currentRatio = totalEquity > 0 ? (totalDebt / totalEquity).toFixed(2) : 'N/A';

  // Net Debt Chart Data
  const netDebtData = [
    { name: 'Short term loan', value: overview.shortTerm, fill: '#7030a0' },
    { name: 'Long term loan', value: overview.longTerm, fill: '#00b050' },
    { name: 'Liquidity Reserve', value: overview.liquidityReserve, fill: '#c0504d' },
    { name: 'Total', value: totalDebt - overview.liquidityReserve, fill: '#4f81bd' }
  ];

  // Helper to format 0 as '-'
  const fmt = (val) => (!val || val === 0) ? '-' : Number(val).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // Combo Chart Data Generator
  const buildComboData = (sourceData) => {
    return sourceData.periods.map((period, i) => ({
      name: period,
      Debt: sourceData.debt[i] || 0,
      LiquidAssets: sourceData.liquidAssets[i] || 0,
      Ratio: sourceData.ratio[i] || 0
    }));
  };

  const comboCostData = buildComboData(laCost);
  const comboMktData = buildComboData(laMkt);

  const thStyle = { background: '#9bc2e6', color: 'black', border: '1px solid white', fontSize: '11px', textAlign: 'center', padding: '6px' };
  const tdStyle = { fontSize: '11px', textAlign: 'center', padding: '6px' };
  const headerColStyle = { ...tdStyle, textAlign: 'left', fontWeight: 'bold' };

  return (
    <div>
      {/* Top Section */}
      <div className="grid-3" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ minHeight: '80px', padding: '12px 16px' }}>
          <div className="kpi-top">
            <div className="kpi-label">Total Outstanding Debt</div>
            <div className="kpi-icon" style={{ width: '24px', height: '24px', color: 'var(--danger)', background: 'var(--danger-soft)' }}>▣</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap', marginTop: '6px' }}>
            {totalDebt.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
        </div>
        
        <div className="kpi-card" style={{ minHeight: '80px', padding: '12px 16px' }}>
          <div className="kpi-top">
            <div className="kpi-label">Total Book Equity</div>
            <div className="kpi-icon" style={{ width: '24px', height: '24px', color: 'var(--blue)', background: 'var(--blue-soft)' }}>▣</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap', marginTop: '6px' }}>
            {totalEquity.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
        </div>
        
        <div className="kpi-card" style={{ minHeight: '80px', padding: '12px 16px' }}>
          <div className="kpi-top">
            <div className="kpi-label">Debt-to-Equity Ratio</div>
            <div className="kpi-icon" style={{ width: '24px', height: '24px', color: 'var(--text)', background: 'var(--surface-2)' }}>◫</div>
          </div>
          <div className="kpi-value" style={{ marginTop: '6px' }}>{currentRatio}x</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Net Debt Chart */}
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>Net Debt as on 15th August 2026</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netDebtData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" barSize={40}>
                  <LabelList dataKey="value" position="top" fill="#333" fontSize={11} fontWeight="bold" formatter={(val) => val === 0 ? '-' : val} />
                  {netDebtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Debt to Equity Ratio Table */}
        <div className="card" style={{ flex: 1, overflowX: 'auto', padding: '15px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th colSpan="6" style={thStyle}>Debt to Equity Ratio</th>
                    </tr>
                    <tr style={{ background: 'white' }}>
                        <th style={{ ...headerColStyle, borderBottom: '1px solid #ddd' }}>Period Ended on</th>
                        {deRatio.periods.map((p, i) => <th key={i} style={{ ...tdStyle, borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{p}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={headerColStyle}>Debt</td>
                        {deRatio.debt.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={headerColStyle}>Equity (Book value)</td>
                        {deRatio.equity.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr style={{ background: '#f8fafc' }}>
                        <td style={headerColStyle}>D/E Ratio (Book value)</td>
                        {deRatio.ratio.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                </tbody>
            </table>
        </div>
      </div>

      {/* Middle Section: Combo Charts */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ flex: 1, padding: 0 }}>
          <h3 style={{ fontSize: '13px', margin: 0, padding: '10px', textAlign: 'center', background: '#e7e6e6', borderBottom: '2px solid var(--blue)' }}>LIQUID ASSETS ON HISTORICAL COST</h3>
          <div style={{ height: '250px', padding: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comboCostData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} orientation="left" />
                <YAxis yAxisId="right" tick={{ fontSize: 10 }} orientation="right" domain={[0, 6]} />
                <Tooltip />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="Debt" fill="#ff0000" barSize={20} />
                <Bar yAxisId="left" dataKey="LiquidAssets" fill="#92d050" barSize={20} name="Liquid Assets" />
                <Line yAxisId="right" type="linear" dataKey="Ratio" stroke="#f79646" strokeWidth={2} dot={false} name="Liquid Assets to Debt (no of times) Cost basis">
                  <LabelList dataKey="Ratio" position="top" fill="#333" fontSize={10} formatter={(val) => val === 0 ? '-' : val.toFixed(2)} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ flex: 1, padding: 0 }}>
          <h3 style={{ fontSize: '13px', margin: 0, padding: '10px', textAlign: 'center', background: '#e7e6e6', borderBottom: '2px solid var(--blue)' }}>LIQUID ASSETS ON MARKET VALUES</h3>
          <div style={{ height: '250px', padding: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comboMktData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} orientation="left" />
                <YAxis yAxisId="right" tick={{ fontSize: 10 }} orientation="right" domain={[0, 1.2]} />
                <Tooltip />
                <Legend iconType="square" wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="Debt" fill="#ff0000" barSize={20} />
                <Bar yAxisId="left" dataKey="LiquidAssets" fill="#92d050" barSize={20} name="Liquid Assets" />
                <Line yAxisId="right" type="linear" dataKey="Ratio" stroke="#f79646" strokeWidth={2} dot={false} name="Liquid Assets to Debt (no of times) Mkt Values">
                  <LabelList dataKey="Ratio" position="top" fill="#333" fontSize={10} formatter={(val) => val === 0 ? '-' : val.toFixed(2)} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tables */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ flex: 1, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th colSpan="6" style={thStyle}>Liquid Assets @ Cost To Debt</th>
                    </tr>
                    <tr style={{ background: 'white' }}>
                        <th style={{ ...headerColStyle, borderBottom: '1px solid #ddd' }}>Period Ended on</th>
                        {laCost.periods.map((p, i) => <th key={i} style={{ ...tdStyle, borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{p}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={headerColStyle}>Debt</td>
                        {laCost.debt.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={headerColStyle}>Liquid Assets</td>
                        {laCost.liquidAssets.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={{ ...headerColStyle, fontStyle: 'italic', fontWeight: 'normal' }}>Cash at bank</td>
                        {laCost.cashAtBank.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={{ ...headerColStyle, fontStyle: 'italic', fontWeight: 'normal' }}>Investments at Purchase cost (Shares)</td>
                        {laCost.investmentsShares.map((v, i) => <td key={i} style={{...tdStyle, background: i === 4 ? '#dce6f1' : 'transparent'}}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={{ ...headerColStyle, fontStyle: 'italic', fontWeight: 'normal' }}>Investments at Purchase cost (Metal)</td>
                        {laCost.investmentsMetal.map((v, i) => <td key={i} style={{...tdStyle, background: i === 4 ? '#dce6f1' : 'transparent'}}>{fmt(v)}</td>)}
                    </tr>
                    <tr style={{ background: '#9bc2e6', fontWeight: 'bold' }}>
                        <td style={headerColStyle}>Liquid Assets to Debt (no of times) Cost basis</td>
                        {laCost.ratio.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div className="card" style={{ flex: 1, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th colSpan="6" style={thStyle}>Liquid Assets @ Mkt Value To Debt</th>
                    </tr>
                    <tr style={{ background: 'white' }}>
                        <th style={{ ...headerColStyle, borderBottom: '1px solid #ddd' }}>Period Ended on</th>
                        {laMkt.periods.map((p, i) => <th key={i} style={{ ...tdStyle, borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{p}</th>)}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={headerColStyle}>Debt</td>
                        {laMkt.debt.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={headerColStyle}>Liquid Assets</td>
                        {laMkt.liquidAssets.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={{ ...headerColStyle, fontStyle: 'italic', fontWeight: 'normal' }}>Cash at bank</td>
                        {laMkt.cashAtBank.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={{ ...headerColStyle, fontStyle: 'italic', fontWeight: 'normal' }}>Market Value of Investments (Shares)</td>
                        {laMkt.investmentsShares.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr>
                        <td style={{ ...headerColStyle, fontStyle: 'italic', fontWeight: 'normal' }}>Market Value of Investments (Metal)</td>
                        {laMkt.investmentsMetal.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                    <tr style={{ background: '#9bc2e6', fontWeight: 'bold' }}>
                        <td style={headerColStyle}>Liquid Assets to Debt (no of times) Mkt Values</td>
                        {laMkt.ratio.map((v, i) => <td key={i} style={tdStyle}>{fmt(v)}</td>)}
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Debt;

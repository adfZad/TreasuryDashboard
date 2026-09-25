import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const WorkingCapital = () => {
  const { globalData, globalLoading, globalError } = useData();

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading Working Capital Data...</div>;
  if (globalError || !globalData) return <div className="empty text-danger">Failed to load working capital data.</div>;

  const facilities = globalData.wc.facilities;
  const loading = false;

  const totalSanctioned = facilities.reduce((sum, f) => sum + (f.SanctionedLimit || 0), 0);
  const totalUtilized = facilities.reduce((sum, f) => sum + (f.UtilizedAmount || 0), 0);
  const avgUtilPct = totalSanctioned > 0 ? (totalUtilized / totalSanctioned) * 100 : 0;

  // Transform Data for Charts & Pivot
  const banks = {};
  const facilityTypesSet = new Set();
  
  facilities.forEach(f => {
    // Map long names to shorter names for charts
    let fType = f.FacilityTypeName;
    if (fType.includes("Bonds")) fType = "Bonds & G";
    if (fType.includes("Letter of Credit")) fType = "LC";

    if (!banks[f.BankName]) {
      banks[f.BankName] = { name: f.BankName, data: {} };
    }
    facilityTypesSet.add(fType);
    
    if (!banks[f.BankName].data[fType]) {
      banks[f.BankName].data[fType] = { Sanctioned: 0, Utilised: 0 };
    }
    
    // Fallback: If SanctionedLimit is 0 in the local DB, derive it from Utilized + Available
    const actualSanctioned = f.SanctionedLimit || ((f.UtilizedAmount || 0) + (f.AvailableAmount || 0)) || 0;
    
    banks[f.BankName].data[fType].Sanctioned += actualSanctioned;
    banks[f.BankName].data[fType].Utilised += (f.UtilizedAmount || 0);
  });

  // Force all 3 types to appear on the X-axis even if the DB data doesn't have them
  const orderedTypes = ['LC', 'Murabaha', 'Bonds & G'];
  orderedTypes.forEach(t => facilityTypesSet.add(t));
  
  const facilityTypeArray = Array.from(facilityTypesSet).sort((a, b) => {
    const ia = orderedTypes.indexOf(a);
    const ib = orderedTypes.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const chartDataGroups = Object.values(banks).map(bank => {
    const chartData = facilityTypeArray.map(type => ({
      name: type,
      Sanctioned: bank.data[type]?.Sanctioned || 0,
      Utilised: bank.data[type]?.Utilised || 0
    }));
    
    const totalSanctionedBank = chartData.reduce((sum, d) => sum + d.Sanctioned, 0);
    const totalUtilisedBank = chartData.reduce((sum, d) => sum + d.Utilised, 0);
    
    chartData.push({
      name: 'Total Limit',
      Sanctioned: totalSanctionedBank,
      Utilised: totalUtilisedBank
    });
    
    return { bankName: bank.name, data: chartData };
  });

  const totalChartData = facilityTypeArray.map(type => {
    let typeSanctioned = 0;
    let typeUtilised = 0;
    Object.values(banks).forEach(bank => {
      typeSanctioned += bank.data[type]?.Sanctioned || 0;
      typeUtilised += bank.data[type]?.Utilised || 0;
    });
    return { name: type, Sanctioned: typeSanctioned, Utilised: typeUtilised };
  });
  
  const overallSanctioned = totalChartData.reduce((sum, d) => sum + d.Sanctioned, 0);
  const overallUtilised = totalChartData.reduce((sum, d) => sum + d.Utilised, 0);
  
  totalChartData.push({
    name: 'Total Limit',
    Sanctioned: overallSanctioned,
    Utilised: overallUtilised
  });
  
  chartDataGroups.push({ bankName: 'Total Working Capital Finance', data: totalChartData });

  // Pivot Table Data (Utilised amounts)
  const pivotTotals = {};
  facilityTypeArray.forEach(t => pivotTotals[t] = 0);

  const pivotData = Object.values(banks).map(bank => {
    const row = { bank: bank.name };
    facilityTypeArray.forEach(type => {
      const val = bank.data[type]?.Utilised || 0;
      row[type] = val;
      pivotTotals[type] += val;
    });
    return row;
  });

  return (
    <div>
      {/* Grid of Dynamic Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        {chartDataGroups.map((group, idx) => {
          return (
          <div key={idx} className="card animate-fade-in" style={{ 
            padding: '15px', 
            animationDelay: `${idx * 0.1}s`, 
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '700' }}>{group.bankName}</h4>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={group.data} margin={{ top: 25, right: 5, left: -25, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 10, top: -10 }} iconSize={8} />
                  <Bar dataKey="Sanctioned" fill="#3479bd" barSize={15}>
                    <LabelList dataKey="Sanctioned" position="top" fill="var(--text-primary)" fontSize={9} formatter={(val) => val ? val.toFixed(0) : ''} />
                  </Bar>
                  <Bar dataKey="Utilised" fill="#d94b4b" barSize={15}>
                    <LabelList dataKey="Utilised" position="top" fill="var(--text-primary)" fontSize={9} formatter={(val) => val ? val.toFixed(0) : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          );
        })}
      </div>

      {/* Grid for Pivot Table & Detailed Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Pivot Table */}
        <div className="card animate-fade-in" style={{ padding: '0' }}>
          <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>
              LC & Murabaha limits are sub limits of total facility limit
            </div>
          </div>
          <div className="table-wrap" style={{ margin: 0 }}>
            <table style={{ fontSize: '12px', width: '100%', tableLayout: 'fixed', minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th colSpan={facilityTypeArray.length + 1} style={{ background: '#0070c0', color: 'white', textAlign: 'center' }}>
                    WC Limits - Bank Wise
                  </th>
                </tr>
                <tr>
                  <th style={{ background: '#0070c0', color: 'white', width: '34%' }}>Bank</th>
                  {facilityTypeArray.map(t => (
                    <th key={t} style={{ background: '#0070c0', color: 'white', width: '22%' }} className="num">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivotData.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', whiteSpace: 'normal', padding: '8px' }}>{row.bank}</td>
                    {facilityTypeArray.map(t => (
                      <td key={t} className="num" style={{ padding: '8px' }}>{row[t] ? row[t].toFixed(0) : '-'}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td style={{ background: '#0070c0', color: 'white', fontWeight: 'bold', padding: '8px' }}>Total</td>
                  {facilityTypeArray.map(t => (
                    <td key={t} style={{ background: '#0070c0', color: 'white', fontWeight: 'bold', padding: '8px' }} className="num">
                      {pivotTotals[t] ? pivotTotals[t].toFixed(0) : '-'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Existing Detailed Table (Smaller) */}
        <div className="card animate-fade-in" style={{ padding: '0' }}>
          <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>Detailed Facility Ledger</div>
          </div>
          <div className="table-wrap" style={{ margin: 0 }}>
            <table style={{ fontSize: '11px', width: '100%', tableLayout: 'fixed', minWidth: '0' }}>
              <thead>
                <tr>
                  <th style={{ width: '20%', padding: '8px 4px', background: '#0070c0', color: 'white', overflowWrap: 'break-word' }}>Bank</th>
                  <th style={{ width: '22%', padding: '8px 4px', background: '#0070c0', color: 'white', overflowWrap: 'break-word' }}>Type</th>
                  <th className="num" style={{ width: '12%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Limit</th>
                  <th className="num" style={{ width: '12%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Util.</th>
                  <th className="num" style={{ width: '14%', padding: '8px 15px 8px 4px', background: '#0070c0', color: 'white' }}>Avail.</th>
                  <th style={{ width: '20%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Util %</th>
                </tr>
              </thead>
              <tbody>
                {facilities.length === 0 ? (
                  <tr><td colSpan="6" className="empty" style={{ padding: '8px 4px' }}>No facilities found.</td></tr>
                ) : (
                  facilities.map((f, idx) => (
                    <tr key={idx} style={{ padding: '0' }}>
                      <td style={{ padding: '8px 4px', overflowWrap: 'break-word' }}><span style={{ fontWeight: '600' }}>{f.BankName}</span></td>
                      <td style={{ padding: '8px 4px', overflowWrap: 'break-word' }}>{f.FacilityTypeName}</td>
                      <td className="num" style={{ padding: '8px 4px' }}><strong>{f.SanctionedLimit?.toFixed(0)}</strong></td>
                      <td className="num" style={{ padding: '8px 4px' }}>{f.UtilizedAmount?.toFixed(0)}</td>
                      <td className="num text-success" style={{ padding: '8px 15px 8px 4px' }}>{f.AvailableAmount?.toFixed(0)}</td>
                      <td style={{ padding: '8px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div className="progress" style={{ flex: 1, height: '4px', minWidth: '15px' }}>
                            <span style={{ width: `${f.UtilizationPct}%`, background: f.UtilizationPct > 80 ? 'var(--danger)' : 'var(--blue)' }}></span>
                          </div>
                          <span style={{ fontSize: '9px', minWidth: '24px', textAlign: 'right' }}>{f.UtilizationPct?.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default WorkingCapital;

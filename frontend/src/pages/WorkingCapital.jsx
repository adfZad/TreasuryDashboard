import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, PieChart, Pie, Cell } from 'recharts';

const WorkingCapital = () => {
  const { globalData, globalLoading, globalError } = useData();
  const [activeTab, setActiveTab] = useState('bank');

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading Working Capital Data...</div>;
  if (globalError || !globalData) return <div className="empty text-danger">Failed to load working capital data.</div>;

  const banksRaw = globalData.wc.banks || [];

  const totalSanctioned = banksRaw.reduce((sum, b) => sum + (b.totalLimit || 0), 0);
  const totalUtilized = banksRaw.reduce((sum, b) => sum + (b.utilized || 0), 0);
  const avgUtilPct = totalSanctioned > 0 ? (totalUtilized / totalSanctioned) * 100 : 0;

  // Transform Data for Charts & Pivot
  const banks = {};
  const regions = {};
  
  banksRaw.forEach(b => {
    const bName = b.bank;
    
    if (!banks[bName]) {
      banks[bName] = { 
        name: bName, 
        data: {
          'LC': { Sanctioned: b.lcLimit, Utilised: b.lcLimit > 0 ? (b.utilized * (b.lcLimit / b.totalLimit)) : 0 },
          'Murabaha': { Sanctioned: b.murabahaLimit, Utilised: b.murabahaLimit > 0 ? (b.utilized * (b.murabahaLimit / b.totalLimit)) : 0 },
          'Bonds & G': { Sanctioned: b.bondsLimit, Utilised: b.bondsLimit > 0 ? (b.utilized * (b.bondsLimit / b.totalLimit)) : 0 }
        }
      };
    }

    // Default all to Qatar since region isn't in this sheet
    const regionName = 'Qatar';
    if (!regions[regionName]) {
      regions[regionName] = {
        name: regionName,
        data: {
          'LC': { Sanctioned: 0, Utilised: 0 },
          'Murabaha': { Sanctioned: 0, Utilised: 0 },
          'Bonds & G': { Sanctioned: 0, Utilised: 0 }
        }
      };
    }
    
    regions[regionName].data['LC'].Sanctioned += b.lcLimit;
    regions[regionName].data['Murabaha'].Sanctioned += b.murabahaLimit;
    regions[regionName].data['Bonds & G'].Sanctioned += b.bondsLimit;

    if (b.totalLimit > 0) {
      regions[regionName].data['LC'].Utilised += b.utilized * (b.lcLimit / b.totalLimit);
      regions[regionName].data['Murabaha'].Utilised += b.utilized * (b.murabahaLimit / b.totalLimit);
      regions[regionName].data['Bonds & G'].Utilised += b.utilized * (b.bondsLimit / b.totalLimit);
    }
  });

  if (globalData.wc.regionWise && globalData.wc.regionWise.length > 0) {
    // Clear out the dummy fallback Qatar we just built
    for (const key in regions) {
      delete regions[key];
    }
    globalData.wc.regionWise.forEach(r => {
      if (r.region === 'Total' || r.facility === 'Total') return;
      const rName = r.region === 'U.A.E' ? 'Dubai' : r.region;
      if (!regions[rName]) {
        regions[rName] = {
          name: rName,
          data: {
            'LC': { Sanctioned: 0, Utilised: 0 },
            'Murabaha': { Sanctioned: 0, Utilised: 0 },
            'Bonds & G': { Sanctioned: 0, Utilised: 0 }
          }
        };
      }
      if (regions[rName].data[r.facility]) {
        regions[rName].data[r.facility].Sanctioned = r.sanctioned;
        regions[rName].data[r.facility].Utilised = r.utilised;
      }
    });
  }

  const facilityTypeArray = ['LC', 'Murabaha', 'Bonds & G'];

  // --- BANK WISE DATA ---
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

  // Bank Pivot Table Data
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

  // --- REGION WISE DATA ---
  const regionChartDataGroups = Object.values(regions).map(region => {
    const chartData = facilityTypeArray.map(type => ({
      name: type,
      Sanctioned: region.data[type]?.Sanctioned || 0,
      Utilised: region.data[type]?.Utilised || 0
    }));
    const totalS = chartData.reduce((sum, d) => sum + d.Sanctioned, 0);
    const totalU = chartData.reduce((sum, d) => sum + d.Utilised, 0);
    chartData.push({ name: 'Total Limit', Sanctioned: totalS, Utilised: totalU });
    return { regionName: region.name, data: chartData };
  });

  const regionPivotData = Object.values(regions).map(region => {
    const row = { region: region.name };
    facilityTypeArray.forEach(type => {
      row[type] = region.data[type]?.Utilised || 0;
    });
    return row;
  });

  const COLORS = ['#3479bd', '#d94b4b', '#7cb342', '#fbc02d', '#8e24aa'];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '-10px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('bank')}
          style={{ padding: '10px 15px', background: 'none', border: 'none', borderBottom: activeTab === 'bank' ? '2px solid var(--blue)' : '2px solid transparent', color: activeTab === 'bank' ? 'var(--blue)' : 'var(--muted)', fontWeight: activeTab === 'bank' ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '11px' }}
        >
          BANK WISE FACILITY UTILISATION
        </button>
        <button 
          onClick={() => setActiveTab('region')}
          style={{ padding: '10px 15px', background: 'none', border: 'none', borderBottom: activeTab === 'region' ? '2px solid var(--blue)' : '2px solid transparent', color: activeTab === 'region' ? 'var(--blue)' : 'var(--muted)', fontWeight: activeTab === 'region' ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '11px' }}
        >
          REGION WISE FACILITY UTILISATION
        </button>
      </div>

      {activeTab === 'bank' && (
        <div className="animate-fade-in">
          {/* Grid of Dynamic Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {chartDataGroups.map((group, idx) => {
              return (
              <div key={idx} className="card" style={{ 
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
                      <Bar dataKey="Sanctioned" fill="url(#grad-3479bd)" barSize={15}>
                        <LabelList dataKey="Sanctioned" position="top" fill="var(--text-primary)" fontSize={9} formatter={(val) => val ? val.toFixed(0) : ''} />
                      </Bar>
                      <Bar dataKey="Utilised" fill="url(#grad-d94b4b)" barSize={15}>
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
            <div className="card" style={{ padding: '0' }}>
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
            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>Detailed Facility Ledger</div>
              </div>
              <div className="table-wrap" style={{ margin: 0 }}>
                <table style={{ fontSize: '11px', width: '100%', tableLayout: 'fixed', minWidth: '0' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '20%', padding: '8px 4px', background: '#0070c0', color: 'white', overflowWrap: 'break-word' }}>Bank</th>
                      <th className="num" style={{ width: '13%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>LC Limit</th>
                      <th className="num" style={{ width: '13%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Murabaha</th>
                      <th className="num" style={{ width: '13%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Bonds</th>
                      <th className="num" style={{ width: '13%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Total Limit</th>
                      <th className="num" style={{ width: '13%', padding: '8px 15px 8px 4px', background: '#0070c0', color: 'white' }}>Utilized</th>
                      <th style={{ width: '15%', padding: '8px 4px', background: '#0070c0', color: 'white' }}>Util %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banksRaw.length === 0 ? (
                      <tr><td colSpan="7" className="empty" style={{ padding: '8px 4px' }}>No facilities found.</td></tr>
                    ) : (
                      banksRaw.map((b, idx) => {
                        const pct = b.totalLimit > 0 ? (b.utilized / b.totalLimit) * 100 : 0;
                        return (
                        <tr key={idx} style={{ padding: '0' }}>
                          <td style={{ padding: '8px 4px', overflowWrap: 'break-word' }}><span style={{ fontWeight: '600' }}>{b.bank}</span></td>
                          <td className="num" style={{ padding: '8px 4px' }}>{b.lcLimit?.toFixed(0)}</td>
                          <td className="num" style={{ padding: '8px 4px' }}>{b.murabahaLimit?.toFixed(0)}</td>
                          <td className="num" style={{ padding: '8px 4px' }}>{b.bondsLimit?.toFixed(0)}</td>
                          <td className="num" style={{ padding: '8px 4px' }}><strong>{b.totalLimit?.toFixed(0)}</strong></td>
                          <td className="num text-success" style={{ padding: '8px 15px 8px 4px' }}>{b.utilized?.toFixed(0)}</td>
                          <td style={{ padding: '8px 4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div className="progress" style={{ flex: 1, height: '4px', minWidth: '15px' }}>
                                <span style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? 'var(--danger)' : 'var(--blue)' }}></span>
                              </div>
                              <span style={{ fontSize: '9px', minWidth: '24px', textAlign: 'right' }}>{pct?.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'region' && (
        <div className="animate-fade-in">
          {/* Top: Region Bar Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {regionChartDataGroups.map((group, idx) => (
              <div key={idx} className="card" style={{ padding: '15px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '700' }}>{group.regionName}</h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={group.data} margin={{ top: 25, right: 5, left: -25, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)' }} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 10, top: -10 }} iconSize={8} />
                      <Bar dataKey="Sanctioned" fill="url(#grad-eab308)" barSize={15}>
                        <LabelList dataKey="Sanctioned" position="top" fill="var(--text-primary)" fontSize={9} formatter={(val) => val ? val.toFixed(0) : ''} />
                      </Bar>
                      <Bar dataKey="Utilised" fill="url(#grad-8e24aa)" barSize={15}>
                        <LabelList dataKey="Utilised" position="top" fill="var(--text-primary)" fontSize={9} formatter={(val) => val ? val.toFixed(0) : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          {/* Middle: Region Pie Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {facilityTypeArray.map((fType, pIdx) => {
              // Build pie data
              const pieData = Object.values(regions).map(region => ({
                name: region.name,
                value: region.data[fType]?.Utilised || 0
              })).filter(d => d.value > 0);

              return (
                <div key={pIdx} className="card" style={{ padding: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', textAlign: 'center' }}>{fType}</h4>
                  <div style={{ width: '100%', height: 180 }}>
                    {pieData.length === 0 ? (
                      <div className="empty" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Utilisation</div>
                    ) : (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={55}
                            fill="#8884d8"
                            dataKey="value"
                            style={{ fontSize: '10px' }}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-dropdown)', fontSize: '12px' }} formatter={(val) => val.toFixed(0)} />
                          <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom: Region Pivot Table */}
          <div className="card" style={{ padding: '0', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--border)', background: '#0070c0', color: 'white', textAlign: 'center', fontWeight: '600', fontSize: '12px' }}>
              Country Wise WC Utilisation
            </div>
            <div className="table-wrap" style={{ margin: 0 }}>
              <table style={{ fontSize: '12px', width: '100%', tableLayout: 'fixed', minWidth: 'auto' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#e0f2fe', width: '40%' }}>Country</th>
                    {facilityTypeArray.map(t => <th key={t} style={{ background: '#e0f2fe', width: '20%' }} className="num">{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {regionPivotData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', padding: '8px' }}>{row.region}</td>
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
        </div>
      )}

    </div>
  );
};

export default WorkingCapital;

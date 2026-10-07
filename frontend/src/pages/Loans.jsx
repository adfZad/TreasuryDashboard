import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const ST_COLORS = ['#4f81bd', '#9bbb59', '#1f497d', '#4bacc6', '#f79646'];
const LT_COLORS = ['#3a6fa1', '#c85a17', '#80b84c', '#d69e9d', '#9b80b9', '#f79646'];

const Loans = () => {
  const { globalData, globalLoading, globalError } = useData();
  const [activeTab, setActiveTab] = useState('st');

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading Loan Data...</div>;
  if (globalError || !globalData) return <div className="empty text-danger">Failed to load loan data.</div>;

  const excelData = globalData.loans?.excelData || { shortTerm: [], longTerm: [] };
  const stData = excelData.shortTerm || [];
  const ltDataFull = excelData.longTerm || [];

  // Short Term processing
  const stScheduleData = [
    { name: 'Aug-26', value: stData.find(d => d.bank === 'Total')?.aug26 || 0 },
    { name: 'Sep-26', value: stData.find(d => d.bank === 'Total')?.sep26 || 0 },
    { name: 'Oct-26', value: stData.find(d => d.bank === 'Total')?.oct26 || 0 }
  ];

  // Long Term processing
  // Filter out Total rows for charts
  const ltDataCharts = ltDataFull.filter(d => d.bank && d.bank.indexOf('Total') === -1);
  const ltTotalOutstanding = ltDataCharts.reduce((sum, d) => sum + (d.amount || 0), 0); // or use balance
  const ltTotalObj = ltDataFull.find(d => d.bank && d.bank.indexOf('Total including') > -1) || ltDataFull.find(d => d.bank === 'Total') || {};

  // Construct schedule chart data (Quarterly basis)
  let ltScheduleData = [];
  if (excelData.quarterlySchedule && excelData.quarterlySchedule.length > 0) {
    // Only include items starting from Q3-2026 (remaining) to match user preference
    const startIndex = excelData.quarterlySchedule.findIndex(q => q.name.includes('remaining') || q.name === 'Q3-2026');
    ltScheduleData = excelData.quarterlySchedule.slice(startIndex > -1 ? startIndex : 0);
  } else {
    ltScheduleData = [
      { name: '2026', value: Number((ltDataCharts.reduce((s, d) => s + (d.y2026 || 0), 0) / 4).toFixed(1)) },
      { name: '2027', value: Number((ltDataCharts.reduce((s, d) => s + (d.y2027 || 0), 0) / 4).toFixed(1)) },
      { name: '2028', value: Number((ltDataCharts.reduce((s, d) => s + (d.y2028 || 0), 0) / 4).toFixed(1)) },
      { name: '2029', value: Number((ltDataCharts.reduce((s, d) => s + (d.y2029 || 0), 0) / 4).toFixed(1)) },
      { name: '2030', value: Number((ltDataCharts.reduce((s, d) => s + (d.y2030 || 0), 0) / 4).toFixed(1)) },
      { name: '2031', value: Number((ltDataCharts.reduce((s, d) => s + (d.y2031 || 0), 0) / 4).toFixed(1)) },
    ];
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '-10px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('st')}
          style={{ padding: '10px 15px', background: 'none', border: 'none', borderBottom: activeTab === 'st' ? '2px solid var(--blue)' : '2px solid transparent', color: activeTab === 'st' ? 'var(--blue)' : 'var(--muted)', fontWeight: activeTab === 'st' ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '11px' }}
        >
          SHORT TERM LOAN
        </button>
        <button 
          onClick={() => setActiveTab('lt')}
          style={{ padding: '10px 15px', background: 'none', border: 'none', borderBottom: activeTab === 'lt' ? '2px solid var(--blue)' : '2px solid transparent', color: activeTab === 'lt' ? 'var(--blue)' : 'var(--muted)', fontWeight: activeTab === 'lt' ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '11px' }}
        >
          LONG TERM LOAN
        </button>
      </div>

      {activeTab === 'st' && (
        <div className="animate-fade-up">
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {/* Repayment Schedule Line Chart */}
            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center', color: '#333' }}>Short term loans repayment schedule</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stScheduleData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} />
                    <Tooltip />
                    <Line type="linear" dataKey="value" stroke="#f79646" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }}>
                      <LabelList dataKey="value" position="top" fill="#333" fontSize={11} fontWeight="bold" />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Outstanding Bar Chart */}
            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center', color: '#333' }}>Bank wise Short term loan Outstanding</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stData.filter(d => d.totalOS > 0)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="totalOS" barSize={40}>
                      <LabelList dataKey="totalOS" position="top" fill="#333" fontSize={11} fontWeight="bold" />
                      {stData.filter(d => d.totalOS > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#grad-${(entry.bank === 'Total' ? '#e26b0a' : ST_COLORS[index % ST_COLORS.length]).replace('#', '')})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lt' && (
        <div className="animate-fade-up">
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {/* LT Outstanding Bar Chart */}
            <div className="card" style={{ flex: 2 }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center', color: '#333' }}>Bank wise Long term loan current Outstanding (in QAR millions)</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...ltDataCharts, { desc: 'Total', balance: ltTotalObj.balance }]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="desc" axisLine={true} tickLine={false} tick={{fontSize: 11}} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="balance" barSize={40}>
                      <LabelList dataKey="balance" position="top" fill="#333" fontSize={11} fontWeight="bold" />
                      {[...ltDataCharts, { desc: 'Total' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#grad-${(entry.desc === 'Total' ? '#e26b0a' : LT_COLORS[index % LT_COLORS.length]).replace('#', '')})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Manual info panel */}
            <div className="card" style={{ flex: 1, fontSize: '11px', lineHeight: '1.5', color: '#444' }}>
              <p style={{ marginBottom: '10px' }}>This section will be manually updated.</p>
              <ol style={{ paddingLeft: '15px', margin: 0, display: 'grid', gap: '5px' }}>
                <li><strong>MAI # 1 :</strong> Quarterly installments payable, next installment due in Sep-2026. QAR XX mn plus profit per installment.</li>
                <li><strong>UBS # 1 :</strong> Long Term Loan next installment due in Nov-2026. QAR XX mn plus profit per installment.</li>
                <li><strong>DUK # 1 :</strong> long-term loan installment is due on the 12th of every month. QAR XX mn plus profit.</li>
                <li><strong>MAI # 2 :</strong> New loan availed on 15-Jan-2026, 1st installment will be due in Oct-2026.</li>
                <li><strong>DUK # 2 :</strong> New loan availed on 24-Jun-2026, 1st installment will be due in Sep-2027.</li>
              </ol>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center', color: '#333' }}>Long term loans repayment schedule</h3>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ltScheduleData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11}} padding={{ left: 50, right: 50 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <Tooltip />
                  <Line type="linear" dataKey="value" stroke="#f79646" strokeWidth={3} dot={false} activeDot={{ r: 6 }}>
                    <LabelList dataKey="value" position="top" fill="#333" fontSize={11} fontWeight="bold" />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LT Table */}
          <div className="table-wrap">
            <table style={{ fontSize: '11px', textAlign: 'center' }}>
              <thead>
                <tr>
                  <th colSpan="7" style={{ background: '#9bc2e6', color: 'black', borderRight: '1px solid white', borderBottom: '1px solid white' }}>Details of Long term loans (in QAR millions)</th>
                  <th rowSpan="2" style={{ background: '#9bc2e6', color: 'black', borderRight: '1px solid white' }}>Paid till 2025</th>
                  <th rowSpan="2" style={{ background: '#9bc2e6', color: 'black', borderRight: '1px solid white' }}>Paid during YTD 2026</th>
                  <th rowSpan="2" style={{ background: '#9bc2e6', color: 'black', borderRight: '1px solid white' }}>Balance outstanding</th>
                  <th colSpan="8" style={{ background: '#9bc2e6', color: 'black', borderBottom: '1px solid white' }}>Repayment schedule of balance outstanding</th>
                </tr>
                <tr>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>Bank</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>Loan description</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>Loan amount</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>Tenure</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>Start date</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>End date</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>Installment frequency</th>
                  <th style={{ background: '#9bc2e6', color: 'black', borderRight: '1px solid white' }}>Installment amount</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2026</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2027</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2028</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2029</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2030</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2031</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2032</th>
                  <th style={{ background: '#9bc2e6', color: 'black' }}>2033+</th>
                </tr>
              </thead>
              <tbody>
                {ltDataFull.map((r, i) => {
                  let instAmt = '-';
                  if (r.freq && !r.bank?.includes('Total')) {
                    const yearly = r.y2027 || r.y2028 || r.y2029 || r.y2030 || r.y2026 || 0;
                    const fLower = String(r.freq).toLowerCase();
                    let div = 1;
                    if (fLower.includes('quarter')) div = 4;
                    else if (fLower.includes('month')) div = 12;
                    else if (fLower.includes('semi') || fLower.includes('half')) div = 2;
                    instAmt = (yearly / div).toFixed(2);
                    if (instAmt == 0) instAmt = '-';
                  }
                  
                  return (
                  <tr key={i} style={{ 
                    background: r.bank?.indexOf('Total') > -1 ? '#e7e6e6' : 'transparent',
                    fontWeight: r.bank?.indexOf('Total') > -1 ? 'bold' : 'normal',
                    borderBottom: '1px solid #ddd'
                  }}>
                    <td style={{ textAlign: 'left', background: r.isNew ? '#92d050' : 'transparent', color: r.isNew ? 'black' : 'inherit' }}>{r.bank}</td>
                    <td style={{ background: r.isNew ? '#92d050' : 'transparent' }}>{r.desc}</td>
                    <td>{r.amount ? r.amount.toFixed(1) : '-'}</td>
                    <td>{r.tenure || '-'}</td>
                    <td>{r.start || '-'}</td>
                    <td>{r.end || '-'}</td>
                    <td>{r.freq || '-'}</td>
                    <td style={{ borderRight: '1px solid #ddd' }}>{instAmt}</td>
                    <td style={{ background: '#dce6f1' }}>{r.paid2025 ? r.paid2025.toFixed(1) : '-'}</td>
                    <td style={{ background: '#dce6f1' }}>{r.paid2026 ? r.paid2026.toFixed(1) : '-'}</td>
                    <td style={{ background: '#dce6f1' }}>{r.balance ? r.balance.toFixed(1) : '-'}</td>
                    <td>{r.y2026 ? r.y2026.toFixed(1) : '-'}</td>
                    <td>{r.y2027 ? r.y2027.toFixed(1) : '-'}</td>
                    <td>{r.y2028 ? r.y2028.toFixed(1) : '-'}</td>
                    <td>{r.y2029 ? r.y2029.toFixed(1) : '-'}</td>
                    <td>{r.y2030 ? r.y2030.toFixed(1) : '-'}</td>
                    <td>{r.y2031 ? r.y2031.toFixed(1) : '-'}</td>
                    <td>{r.y2032 ? r.y2032.toFixed(1) : '-'}</td>
                    <td>{r.y2035_2038 ? r.y2035_2038.toFixed(1) : '-'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

export default Loans;

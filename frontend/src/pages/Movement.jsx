import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

const Movement = () => {
  const { globalData, globalLoading, globalError } = useData();

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading movement data...</div>;
  if (globalError || !globalData || !globalData.movement || !globalData.movement.excelData) return <div className="empty text-danger">Failed to load movement data.</div>;

  const data = globalData.movement.excelData;
  if (!data.schedule) return <div className="empty text-muted">No Movement Excel data available. Please upload the Treasury Report.</div>;

  const { schedule, summary, qdb } = data;

  const fmt = (val) => (!val || val === 0) ? '-' : Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const fmt2 = (val) => (!val || val === 0) ? '-' : Number(val).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  const thStyle = { background: '#9bc2e6', color: 'black', border: '1px solid white', fontSize: '11px', textAlign: 'center', padding: '6px' };
  const thStyleTitle = { background: '#5b9bd5', color: 'white', border: '1px solid white', fontSize: '13px', textAlign: 'center', padding: '6px', fontWeight: 'bold' };
  const tdStyle = { fontSize: '11px', textAlign: 'center', padding: '6px', borderRight: '1px solid #ddd' };
  const tdLabelStyle = { ...tdStyle, textAlign: 'left', borderRight: '1px solid #ddd' };
  const highlightBlue = { background: '#dce6f1' };
  const highlightGrey = { background: '#e7e6e6', fontWeight: 'bold' };
  const highlightDarkGrey = { background: '#d9d9d9', fontWeight: 'bold' };

  const renderScheduleRow = (row, isTotal = false, styleOverride = {}) => {
    if (!row || row.length === 0) return null;
    const baseStyle = isTotal ? highlightDarkGrey : {};
    return (
      <tr style={{ borderBottom: '1px solid #ccc' }}>
        <td style={{ ...tdLabelStyle, ...baseStyle, ...styleOverride }}>{row[0]}</td>
        <td style={{ ...tdStyle, ...baseStyle }}>{fmt(row[1])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[2])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[3])}</td>
        <td style={{ ...tdStyle, ...baseStyle }}>{fmt(row[4])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[5])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[6])}</td>
        <td style={{ ...tdStyle, ...baseStyle }}>{fmt(row[7])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[8])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[9])}</td>
        <td style={{ ...tdStyle, ...baseStyle }}>{fmt(row[10])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[11])}</td>
        <td style={{ ...tdStyle, ...baseStyle, ...highlightBlue }}>{fmt(row[12])}</td>
        <td style={{ ...tdStyle, ...baseStyle }}>{fmt(row[13])}</td>
      </tr>
    );
  };

  const getBankChartData = (bankRow) => {
    return [
      { name: 'STL', value: bankRow[1] || 0 },
      { name: 'LTL', value: bankRow[2] || 0 },
      { name: 'Total Loan', value: bankRow[3] || 0 }
    ];
  };

  const qdbRMData = [
    { name: 'QFM', Approved: qdb.rows[0]?.[1] || 0 },
    { name: 'QFI', Approved: qdb.rows[1]?.[1] || 0 },
    { name: 'USB', Approved: qdb.rows[2]?.[1] || 0 },
    { name: 'Total amount', Approved: qdb.total?.[1] || 0 }
  ];

  const qdbOPEXData = [
    { name: 'QFM', Applied: qdb.rows[0]?.[2] || 0, Approved: 0 },
    { name: 'QFI', Applied: qdb.rows[1]?.[2] || 0, Approved: 0 },
    { name: 'USB', Applied: qdb.rows[2]?.[2] || 0, Approved: 0 },
    { name: 'UNB', Applied: qdb.rows[3]?.[2] || 0, Approved: 0 },
    { name: 'ASP', Applied: qdb.rows[4]?.[2] || 0, Approved: 0 },
    { name: 'Total amount', Applied: qdb.total?.[2] || 0, Approved: 0 }
  ];

  const CustomizedAxisTick = (props) => {
    const { x, y, payload } = props;
    const words = payload.value.split(' ');
    return (
      <g transform={`translate(${x},${y})`}>
        {words.map((word, index) => (
          <text key={index} x={0} y={10 + index * 10} dy={0} textAnchor="middle" fill="#666" fontSize={9}>
            {word}
          </text>
        ))}
      </g>
    );
  };

  return (
    <div style={{ paddingBottom: '30px' }}>
      
      {/* 1. PROJECTED LOAN MOVEMENT SCHEDULE */}
      <div className="card" style={{ marginBottom: '20px', padding: '10px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #5b9bd5' }}>
          <thead>
            <tr>
              <th colSpan="14" style={thStyleTitle}>Projected loan movement schedule</th>
            </tr>
            <tr>
              <th rowSpan="2" style={{ ...thStyleTitle, background: 'white', color: 'black', width: '180px' }}>Short Term Loans</th>
              <th rowSpan="2" style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Loan outstanding as on 01-Aug-26</th>
              <th colSpan="3" style={{ ...thStyle, background: 'white', fontWeight: 'bold', borderRight: '1px solid black' }}>Aug-26</th>
              <th colSpan="3" style={{ ...thStyle, background: 'white', fontWeight: 'bold', borderRight: '1px solid black' }}>Sep-26</th>
              <th colSpan="3" style={{ ...thStyle, background: 'white', fontWeight: 'bold', borderRight: '1px solid black' }}>Oct-26</th>
              <th colSpan="3" style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Nov-26</th>
            </tr>
            <tr>
              <th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Payment</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>New Loan</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold', borderRight: '1px solid black' }}>Balance</th>
              <th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Payment</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>New Loan</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold', borderRight: '1px solid black' }}>Balance</th>
              <th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Payment</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>New Loan</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold', borderRight: '1px solid black' }}>Balance</th>
              <th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Payment</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>New Loan</th><th style={{ ...thStyle, background: 'white', fontWeight: 'bold' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {schedule.shortTerm.map((row, i) => renderScheduleRow(row, false))}
            {renderScheduleRow(schedule.totalA, true)}
            <tr><td colSpan="14" style={{ ...tdLabelStyle, fontWeight: 'bold', background: 'white' }}>Long Term Loans</td></tr>
            {schedule.longTerm.map((row, i) => renderScheduleRow(row, false))}
            {renderScheduleRow(schedule.totalB, true)}
            {renderScheduleRow(schedule.totalLoans, true, { background: '#bfbfbf' })}
            <tr><td colSpan="14" style={{ ...tdLabelStyle, fontWeight: 'bold', background: 'white' }}>Fixed Deposit (Liquidity Reserve)</td></tr>
            {renderScheduleRow(schedule.liquidityReserve, false)}
            {renderScheduleRow(schedule.totalC, true)}
            {renderScheduleRow(schedule.netLoans, true, { background: '#bfbfbf' })}
          </tbody>
        </table>
      </div>

      {/* 2. TOTAL LOANS AS ON 15TH AUGUST 2026 */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1', minWidth: '300px', padding: '10px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #5b9bd5', minWidth: 'auto' }}>
            <thead>
              <tr><th colSpan="4" style={thStyleTitle}>Total Loans as on 15th August 2026</th></tr>
              <tr>
                <th style={thStyle}>Bank</th><th style={thStyle}>STL</th><th style={thStyle}>LTL</th><th style={thStyle}>Total Loan</th>
              </tr>
            </thead>
            <tbody>
              {summary.banks.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ ...tdLabelStyle }}>{row[0]}</td>
                  <td style={tdStyle}>{fmt(row[1])}</td>
                  <td style={tdStyle}>{fmt(row[2])}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>{fmt(row[3])}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid black' }}>
                <td style={{ ...tdLabelStyle, fontWeight: 'bold' }}>{summary.total[0]}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{fmt(summary.total[1])}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{fmt(summary.total[2])}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{fmt(summary.total[3])}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card" style={{ flex: '2', minWidth: '400px', padding: '10px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {[
              { title: 'Dukhan Bank', data: getBankChartData(summary.banks[0]), colors: ['#5b9bd5', '#5b9bd5', '#5b9bd5'] },
              { title: 'Mashreq Al Islami', data: getBankChartData(summary.banks[1]), colors: ['#c0504d', '#c0504d', '#c0504d'] },
              { title: 'UBS', data: getBankChartData(summary.banks[2]), colors: ['#92d050', '#92d050', '#92d050'] },
              { title: 'Al Rayan', data: getBankChartData(summary.banks[3]), colors: ['#f79646', '#f79646', '#f79646'] },
              { title: 'Total Loan', data: getBankChartData(summary.total), colors: ['#8064a2', '#8064a2', '#8064a2'] }
            ].map((chart, idx) => (
              <div key={idx} style={{ flex: '1', minWidth: '120px', borderRight: idx < 4 ? '1px solid #eee' : 'none', paddingRight: '10px' }}>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#555', marginBottom: '10px' }}>{chart.title}</div>
                <div style={{ height: '170px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart.data} margin={{ top: 15, right: 0, left: -25, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={<CustomizedAxisTick />} interval={0} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Bar dataKey="value" barSize={15}>
                        {chart.data.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#grad-${chart.colors[0].replace('#', '')})`} />)}
                        <LabelList dataKey="value" position="top" fill="#555" fontSize={9} formatter={(val) => val === 0 ? '-' : val} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 3. QDB - WC FINANCING */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1', minWidth: '300px', padding: '10px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #5b9bd5', minWidth: 'auto' }}>
            <thead>
              <tr><th colSpan="4" style={thStyleTitle}>QDB - WC Financing (In QAR Mn)</th></tr>
              <tr>
                <th rowSpan="2" style={thStyle}>Business unit</th>
                <th rowSpan="2" style={thStyle}>Raw Material (RM)<br/>Loan approved</th>
                <th colSpan="2" style={thStyle}>OPEX Loan</th>
              </tr>
              <tr>
                <th style={thStyle}>Applied for</th><th style={thStyle}>Approval expected</th>
              </tr>
            </thead>
            <tbody>
              {qdb.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ ...tdLabelStyle }}>{row[0]}</td>
                  <td style={{ ...tdStyle, ...highlightBlue }}>{fmt2(row[1])}</td>
                  <td style={{ ...tdStyle, ...highlightBlue }}>{fmt2(row[2])}</td>
                  <td style={{ ...tdStyle, ...highlightBlue }}>{fmt2(row[3])}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid black', ...highlightGrey }}>
                <td style={{ ...tdLabelStyle }}>{qdb.total[0]}</td>
                <td style={tdStyle}>{fmt2(qdb.total[1])}</td>
                <td style={tdStyle}>{fmt2(qdb.total[2])}</td>
                <td style={tdStyle}>{fmt2(qdb.total[3])}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: '10px', color: '#555', marginTop: '10px' }}>
            Note: This section will be updated manually.
          </div>
        </div>

        <div className="card" style={{ flex: '2', minWidth: '400px', padding: '10px', display: 'flex', gap: '20px', overflowX: 'auto' }}>
          <div style={{ flex: '1' }}>
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#555', marginBottom: '10px' }}>
              QDB - WC Financing for Raw Materials<br/>(in QAR Mn)
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qdbRMData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="Approved" fill="url(#grad-5b9bd5)" barSize={30}>
                    <LabelList dataKey="Approved" position="top" fill="#555" fontSize={10} formatter={(val) => val === 0 ? '-' : val} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: '1' }}>
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#555', marginBottom: '10px' }}>
              QDB - WC Financing for OPEX<br/>(in QAR Mn)
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qdbOPEXData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="Applied" fill="url(#grad-c0504d)" barSize={15}>
                    <LabelList dataKey="Applied" position="top" fill="#555" fontSize={9} formatter={(val) => val === 0 ? '-' : val} />
                  </Bar>
                  <Bar dataKey="Approved" fill="url(#grad-c0504d)" barSize={15}>
                    <LabelList dataKey="Approved" position="top" fill="#555" fontSize={9} formatter={(val) => val === 0 ? '-' : val} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Movement;

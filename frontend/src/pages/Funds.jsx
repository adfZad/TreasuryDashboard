import React from 'react';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const Funds = () => {
  const { globalData, globalLoading, globalError } = useData();

  if (globalLoading) return <div className="empty animate-pulse-dot">Loading Funds Data...</div>;
  if (globalError || !globalData) return <div className="empty text-danger">Failed to load funds data.</div>;

  const balances = globalData.funds.balances;
  const summary = globalData.funds.summary;
  const loading = false;

  const formatMn = (val) => val ? (val / 1000000).toFixed(2) : '0.00';

  // 1. Horizontal Chart: QAR by AccountName
  const qarByAccountMap = {};
  balances.filter(b => b.CurrencyCode === 'QAR').forEach(b => {
      qarByAccountMap[b.AccountName] = (qarByAccountMap[b.AccountName] || 0) + b.ClosingBalance;
  });
  const qarByAccountData = Object.keys(qarByAccountMap).map(k => ({
      name: k,
      value: parseFloat(formatMn(qarByAccountMap[k]))
  })).sort((a,b) => b.value - a.value); // sort descending

  // 2. Vertical Chart Top: QAR by BankName
  const qarByBankMap = {};
  balances.filter(b => b.CurrencyCode === 'QAR').forEach(b => {
      qarByBankMap[b.BankName] = (qarByBankMap[b.BankName] || 0) + b.ClosingBalance;
  });
  let totalQarMn = 0;
  const qarByBankData = Object.keys(qarByBankMap).map(k => {
      const val = parseFloat(formatMn(qarByBankMap[k]));
      totalQarMn += val;
      return { name: k.replace(' Bank', ''), value: val };
  }).sort((a,b) => b.value - a.value);

  // 3. Vertical Chart Bottom: USD by BankName
  const usdByBankMap = {};
  balances.filter(b => b.CurrencyCode === 'USD').forEach(b => {
      usdByBankMap[b.BankName] = (usdByBankMap[b.BankName] || 0) + b.ClosingBalance;
  });
  let totalUsdMn = 0;
  const usdByBankData = Object.keys(usdByBankMap).map(k => {
      const val = parseFloat(formatMn(usdByBankMap[k]));
      totalUsdMn += val;
      return { name: k.replace(' Bank', ''), value: val };
  }).sort((a,b) => b.value - a.value);

  const bankBalanceAsOnDate = totalQarMn; // As per the Excel sheet showing QAR total
  const remainingAmount = bankBalanceAsOnDate - summary.liquidityReserve - summary.workingCapitalReserve;

  const renderCustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (!value) return null;
    return (
      <g>
        <rect x={x + width / 2 - 12} y={y - 18} width="24" height="15" fill="#a3d977" stroke="#4b6b2f" strokeWidth="1" />
        <text x={x + width / 2} y={y - 7} fill="#111" fontSize="10" textAnchor="middle">
          {value}
        </text>
      </g>
    );
  };

  const renderHorizontalLabel = (props) => {
    const { x, y, width, height, value } = props;
    return (
      <text x={x + width + 15} y={y + height / 2 + 4} fill="#666" fontSize="11" textAnchor="middle">
        {value}
      </text>
    );
  };

  if (loading) {
      return <div style={{ padding: '20px' }}>Loading data...</div>;
  }

  return (
    <div style={{ padding: '0px 20px 20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', border: '3px solid #000', padding: '15px 30px', backgroundColor: '#fff' }}>
        
        {/* Top Row: Graphs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            
            {/* Left Column: QAR by Account */}
            <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
                <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '20px', textDecoration: 'underline' }}>BANK BALANCE IN QAR CURRENCY</div>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={qarByAccountData} layout="vertical" margin={{ top: 20, right: 40, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={40} tick={{fontSize: 11}} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#4a90e2" barSize={25}>
                                 <LabelList dataKey="value" content={renderHorizontalLabel} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right Column: Vertical Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                <div>
                    <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', marginBottom: '10px' }}>
                        Bank wise Fund Position in<br/>QAR Currency (Total QAR {totalQarMn.toFixed(2)} mn)
                    </div>
                    <div style={{ height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={qarByBankData} margin={{ top: 25, right: 10, left: 10, bottom: 30 }}>
                                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} interval={0} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#4a90e2" barSize={16}>
                                     <LabelList dataKey="value" content={renderCustomLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <div style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '12px', marginBottom: '10px' }}>
                        Bank wise Fund in USD Currency<br/>(Total USD {totalUsdMn.toFixed(2)} mn)
                    </div>
                    <div style={{ height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={usdByBankData} margin={{ top: 25, right: 10, left: 10, bottom: 30 }}>
                                <XAxis dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} interval={0} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#4a90e2" barSize={16}>
                                     <LabelList dataKey="value" content={renderCustomLabel} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ backgroundColor: '#4a90e2', color: '#fff', padding: '10px', textAlign: 'center', fontSize: '11px', border: '1px solid #000', margin: '0 20px' }}>
                    USD {totalUsdMn.toFixed(2)} Mn will be utilized for foreign<br/>supplier payments. (This section will be<br/>manually updated)
                </div>
            </div>
        </div>

        {/* Bottom Row: Breakdown Table */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '13px' }}>
                    <thead>
                        <tr>
                            <th colSpan="2" style={{ backgroundColor: '#add8e6', padding: '25px 5px', borderBottom: '2px solid #000', textAlign: 'center' }}>
                                Breakdown of bank balance:
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colSpan="2" style={{height: '30px', borderBottom: '1px solid #000'}}></td></tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px 5px' }}>Bank balance as on date</td>
                            <td style={{ padding: '8px 5px', textAlign: 'right' }}>{bankBalanceAsOnDate.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#cce5ff' }}>
                            <td style={{ padding: '8px 5px' }}>Liquidity reserve (FD)</td>
                            <td style={{ padding: '8px 5px', textAlign: 'right' }}>({summary.liquidityReserve.toFixed(2)})</td>
                        </tr>
                        <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#cce5ff' }}>
                            <td style={{ padding: '8px 5px' }}>Reserved working capital</td>
                            <td style={{ padding: '8px 5px', textAlign: 'right' }}>({summary.workingCapitalReserve.toFixed(2)})</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 'bold' }}>
                            <td style={{ padding: '8px 5px' }}>Remaining amount</td>
                            <td style={{ padding: '8px 5px', textAlign: 'right' }}>{remainingAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
                    Note: This section will be updated manually.
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Funds;

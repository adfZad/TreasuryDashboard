const BASELINE = {
  meta: { reportDate: '15 August 2026', source: 'Treasury report as on 15Aug2026.xlsx', unit: 'QAR million' },
  funds: {
    totalBankBalance: 7.095650211,
    liquidityReserve: 5,
    reservedWorkingCapital: 2,
    qarByUnit: [
      { name: 'ZAD', amount: 5.026102447 }, { name: 'QFI', amount: 0.39374425 },
      { name: 'USB', amount: 0.40519557 }, { name: 'ACC', amount: 0.0671057 }, { name: 'GUC', amount: 0.833549 }
    ],
    qarByBank: [
      { name: 'Doha', amount: 2.877749 }, { name: 'Dukhan', amount: 1.07799227 },
      { name: 'Al Rayan', amount: 0.428426 }, { name: 'Mashreq', amount: 0.683919147 },
      { name: 'QIB', amount: 0.034557 }, { name: 'HSBC', amount: 0.032419 }, { name: 'UBS', amount: 0.0276655 }
    ],
    usdAccountsByBank: [
      { name: 'Dukhan', amount: 0.44144756 }, { name: 'Mashreq', amount: 0.00694278 },
      { name: 'UBS', amount: 0.00827 }, { name: 'HSBC', amount: 0.01046 }, { name: 'Al Rayan', amount: 0.0708 }
    ]
  },
  cashflow: [
    { month: 'Aug', inflow: 100, outflow: 90 },
    { month: 'Sep', inflow: 120, outflow: 120 },
    { month: 'Oct', inflow: 140, outflow: 145 }
  ],
  workingCapital: [
    { bank: 'Qatar Islamic Bank', short: 'QIB', sanctioned: 50, utilised: 3.715629365, lc: 0.000043365, murabaha: 0, bg: 3.715586 },
    { bank: 'Mashreq Al Islami', short: 'Mashreq', sanctioned: 85, utilised: 70, lc: 0, murabaha: 70, bg: 0 },
    { bank: 'Al Rayan', short: 'Al Rayan', sanctioned: 145, utilised: 19, lc: 15, murabaha: 2, bg: 2 },
    { bank: 'Dukhan Bank', short: 'Dukhan', sanctioned: 160, utilised: 125, lc: 100, murabaha: 10, bg: 15 },
    { bank: 'UBS', short: 'UBS', sanctioned: 15, utilised: 15, lc: 0, murabaha: 15, bg: 0 }
  ],
  regionFacilities: [
    { region: 'Qatar', sanctioned: 355, utilised: 148.000043365 },
    { region: 'U.A.E', sanctioned: 85, utilised: 70 },
    { region: 'Switzerland', sanctioned: 15, utilised: 15 }
  ],
  loans: {
    shortTerm: 115, longTerm: 494,
    byBank: [
      { bank: 'Dukhan Bank', stl: 10, ltl: 217 },
      { bank: 'Mashreq Al Islami', stl: 70, ltl: 217 },
      { bank: 'UBS', stl: 25, ltl: 60 },
      { bank: 'Al Rayan', stl: 10, ltl: 0 }
    ],
    shortRepayment: [ { period: 'Aug-26', amount: 4 }, { period: 'Sep-26', amount: 2 }, { period: 'Oct-26', amount: 2 } ],
    longRepayment: [
      { period: 'Q3-2026 rem.', amount: 1.848282161 }, { period: 'Q4-2026', amount: 4.627757161 },
      { period: 'Q1-2027', amount: 4.366782161 }, { period: 'Q2-2027', amount: 4.627757161 },
      { period: 'Q3-2027', amount: 5.351967346 }, { period: 'Q4-2027', amount: 5.612942346 }
    ]
  },
  movement: [
    { date: '01-Aug-26', loans: 609, liquidityReserve: 10 },
    { date: '01-Sep-26', loans: 679.8313253012, liquidityReserve: 10 },
    { date: '01-Oct-26', loans: 604.6703923024, liquidityReserve: 10 },
    { date: '01-Nov-26', loans: 595.3259176036, liquidityReserve: 10 },
    { date: 'Projected', loans: 564.1572429048, liquidityReserve: 10 }
  ],
  debt: {
    equityBookValue: 950,
    investmentCostShares: 200,
    investmentCostMetal: 250,
    investmentMarketShares: 500,
    investmentMarketMetal: 7.58292703515,
    historical: [
      { period: '2023', debt: 100, liquidAssets: 525 }, { period: '2024', debt: 200, liquidAssets: 510 },
      { period: '2025', debt: 300, liquidAssets: 560 }, { period: 'Jun-26', debt: 400, liquidAssets: 395 }
    ],
    marketHistorical: [
      { period: '2023', debt: 525, liquidAssets: 549.5 }, { period: '2024', debt: 525, liquidAssets: 533 },
      { period: '2025', debt: 682.4, liquidAssets: 585 }, { period: 'Jun-26', debt: 1173.9, liquidAssets: 412.5 }
    ]
  },
  workflow: {
    'Funds Position': { stage: 2, comments: [{ role: 'BU Finance Head', text: 'Bank balances reviewed against available statements.' }] },
    'Cash Flow': { stage: 2, comments: [{ role: 'BU Finance Head', text: 'August to October projection updated.' }] },
    'Working Capital': { stage: 3, comments: [{ role: 'Business Head', text: 'Facility utilisation reviewed. Monitor high utilisation at UBS and Mashreq.' }] },
    'Loans': { stage: 3, comments: [{ role: 'Corporate Finance', text: 'Repayment profile requires continued monitoring for Q4 2026.' }] },
    'Debt & Liquidity': { stage: 1, comments: [{ role: 'BU Data Entry', text: 'Current ratios recalculated in the web app because the source workbook contains broken references in this section.' }] },
    'Loan Movement': { stage: 1, comments: [] }
  }
};

const STAGES = ['BU Data Entry', 'BU Finance Head', 'Business Head', 'Corporate Finance', 'CFO'];
const STORAGE_KEY = 'treasury_offline_dashboard_v1';
let state = loadState();
let currentView = 'dashboard';
let currentRole = 'BU Data Entry';

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : deepClone(BASELINE); }
  catch { return deepClone(BASELINE); }
}
function saveState(msg = 'Saved locally') { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); toast(msg); }
function fmt(n, d = 2) { return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); }
function pct(n, d = 1) { return `${fmt(n * 100, d)}%`; }
function sum(arr, key) { return arr.reduce((a, x) => a + Number(key ? x[key] : x), 0); }
function totalLoans() { return Number(state.loans.shortTerm) + Number(state.loans.longTerm); }
function fundsAvailable() { return Number(state.funds.totalBankBalance) - Number(state.funds.liquidityReserve) - Number(state.funds.reservedWorkingCapital); }
function wcTotals() { return { sanctioned: sum(state.workingCapital, 'sanctioned'), utilised: sum(state.workingCapital, 'utilised') }; }
function currentRatios() {
  const debt = totalLoans();
  const cash = Number(state.funds.totalBankBalance);
  const costAssets = cash + Number(state.debt.investmentCostShares) + Number(state.debt.investmentCostMetal);
  const marketAssets = cash + Number(state.debt.investmentMarketShares) + Number(state.debt.investmentMarketMetal);
  return { de: debt / Number(state.debt.equityBookValue), cost: costAssets / debt, market: marketAssets / debt, costAssets, marketAssets };
}

function toast(message) {
  const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function kpi(label, value, foot, icon, cls = '') {
  return `<div class="kpi-card"><div class="kpi-top"><div class="kpi-label">${label}</div><div class="kpi-icon">${icon}</div></div><div class="kpi-value ${cls}">${value}</div><div class="kpi-foot">${foot}</div></div>`;
}
function card(title, subtitle, body, badge = '') {
  return `<section class="card"><div class="card-header"><div><div class="card-title">${title}</div><div class="card-subtitle">${subtitle || ''}</div></div>${badge}</div>${body}</section>`;
}
function svgBarChart(items, valueKey, opts = {}) {
  const W = 720, H = opts.height || 260, m = { l: 105, r: 35, t: 18, b: 38 };
  const max = Math.max(...items.map(x => Number(x[valueKey]) || 0), 1) * 1.12;
  const plotW = W - m.l - m.r, plotH = H - m.t - m.b, step = plotH / items.length, bh = Math.min(24, step * .55);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let i=0;i<=4;i++) { const x=m.l+plotW*i/4; const v=max*i/4; s += `<line x1="${x}" y1="${m.t}" x2="${x}" y2="${H-m.b}" stroke="#e7ecf2"/><text x="${x}" y="${H-12}" text-anchor="middle" fill="#7a8798" font-size="10">${fmt(v, opts.decimals ?? 1)}</text>`; }
  items.forEach((it,i)=>{ const y=m.t+step*i+step/2; const w=(Number(it[valueKey])||0)/max*plotW; s += `<text x="${m.l-10}" y="${y+4}" text-anchor="end" fill="#516176" font-size="11">${it.name || it.bank || it.region || it.period}</text><rect x="${m.l}" y="${y-bh/2}" width="${w}" height="${bh}" rx="4" fill="#397bbd"/><text x="${m.l+w+7}" y="${y+4}" fill="#31465f" font-size="10" font-weight="700">${fmt(it[valueKey], opts.decimals ?? 2)}</text>`; });
  return s + `</svg>`;
}
function svgGroupedBar(items, keys, labels, opts = {}) {
  const W=720,H=opts.height||270,m={l:55,r:22,t:18,b:48}; const vals=items.flatMap(x=>keys.map(k=>Number(x[k])||0)); const max=Math.max(...vals,1)*1.15;
  const plotW=W-m.l-m.r,plotH=H-m.t-m.b,groupW=plotW/items.length,bw=Math.min(26,groupW/(keys.length+1)); const colors=['#3479bd','#dc6b61','#6caa52','#8d6fba']; let s=`<svg viewBox="0 0 ${W} ${H}">`;
  for(let i=0;i<=4;i++){const y=m.t+plotH-i*plotH/4; const v=max*i/4; s+=`<line x1="${m.l}" y1="${y}" x2="${W-m.r}" y2="${y}" stroke="#e7ecf2"/><text x="${m.l-8}" y="${y+4}" text-anchor="end" fill="#7a8798" font-size="10">${fmt(v,0)}</text>`;}
  items.forEach((it,i)=>{const cx=m.l+groupW*i+groupW/2; keys.forEach((k,j)=>{const v=Number(it[k])||0,h=v/max*plotH,x=cx+(j-(keys.length-1)/2)*bw-bw*.42; s+=`<rect x="${x}" y="${m.t+plotH-h}" width="${bw*.84}" height="${h}" rx="3" fill="${colors[j]}"/>`;}); s+=`<text x="${cx}" y="${H-17}" text-anchor="middle" fill="#5d6b7e" font-size="10">${it.short || it.region || it.month || it.period || it.bank}</text>`;});
  s+=`</svg><div class="chart-legend">${labels.map((l,i)=>`<span><i class="legend-dot" style="background:${colors[i]}"></i>${l}</span>`).join('')}</div>`; return s;
}
function svgLineChart(items, valueKey, opts={}) {
  const W=720,H=opts.height||250,m={l:48,r:30,t:24,b:45}; const vals=items.map(x=>Number(x[valueKey])||0); let min=Math.min(...vals),max=Math.max(...vals); if(min===max){min=0;max=Math.max(1,max);} const pad=(max-min)*.15||1; min=Math.min(0,min-pad); max=max+pad;
  const pw=W-m.l-m.r,ph=H-m.t-m.b; const x=i=>m.l+(items.length===1?pw/2:i*pw/(items.length-1)); const y=v=>m.t+(max-v)/(max-min)*ph; let s=`<svg viewBox="0 0 ${W} ${H}">`;
  for(let i=0;i<=4;i++){const yy=m.t+ph*i/4,v=max-(max-min)*i/4; s+=`<line x1="${m.l}" y1="${yy}" x2="${W-m.r}" y2="${yy}" stroke="#e7ecf2"/><text x="${m.l-7}" y="${yy+4}" text-anchor="end" fill="#7a8798" font-size="10">${fmt(v,1)}</text>`;}
  const pts=vals.map((v,i)=>`${x(i)},${y(v)}`).join(' '); s+=`<polyline points="${pts}" fill="none" stroke="#3276b8" stroke-width="3" stroke-linejoin="round"/>`;
  vals.forEach((v,i)=>{s+=`<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="#fff" stroke="#3276b8" stroke-width="3"/><text x="${x(i)}" y="${y(v)-10}" text-anchor="middle" fill="#29445f" font-size="10" font-weight="700">${fmt(v,2)}</text><text x="${x(i)}" y="${H-16}" text-anchor="middle" fill="#637083" font-size="10">${items[i].period||items[i].month||items[i].date}</text>`;}); return s+`</svg>`;
}
function donut(value, max, centerText) { const p=Math.max(0,Math.min(1,value/max))*100; return `<div class="ratio-big" style="--pct:${p}%"><span>${centerText}</span></div>`; }

function dashboardView() {
  const wc=wcTotals(), ratios=currentRatios(), cfNet=sum(state.cashflow.map(x=>Number(x.inflow)-Number(x.outflow))); const highUtil=state.workingCapital.filter(x=>x.utilised/x.sanctioned>=.8).length;
  return `
    <div class="kpi-grid">
      ${kpi('Bank Balance', `${fmt(state.funds.totalBankBalance,2)}`, 'Current total bank balance', '▣')}
      ${kpi('Available Funds', `${fmt(fundsAvailable(),2)}`, 'After liquidity and WC reserves', '◉', fundsAvailable()<0.5?'warn':'good')}
      ${kpi('WC Utilisation', pct(wc.utilised/wc.sanctioned), `${fmt(wc.utilised,1)} used of ${fmt(wc.sanctioned,1)}`, '◫', wc.utilised/wc.sanctioned>.8?'bad':'')}
      ${kpi('Total Loans', `${fmt(totalLoans(),0)}`, `STL ${fmt(state.loans.shortTerm,0)} · LTL ${fmt(state.loans.longTerm,0)}`, '▤')}
      ${kpi('Debt / Equity', `${fmt(ratios.de,2)}x`, `Equity book value ${fmt(state.debt.equityBookValue,0)}`, '◎')}
      ${kpi('3 Month Net Cash', `${cfNet>=0?'+':''}${fmt(cfNet,0)}`, 'Aug to Oct excluding Murabaha', '↕', cfNet>=0?'good':'bad')}
    </div>
    <div class="grid-2">
      ${card('Bank Wise Funds Position','QAR accounts by bank',`<div class="chart">${svgBarChart(state.funds.qarByBank,'amount')}</div>`,'<span class="badge blue">QAR accounts</span>')}
      ${card('Cash Flow Projection','August to October 2026',`<div class="chart">${svgGroupedBar(state.cashflow,['inflow','outflow'],['Cash inflow','Cash outflow'])}</div>`,'<span class="badge green">Net +5</span>')}
    </div>
    <div class="grid-2">
      ${card('Working Capital Facility Utilisation','Bank wise sanctioned vs utilised',`<div class="chart">${svgGroupedBar(state.workingCapital,['sanctioned','utilised'],['Sanctioned','Utilised'])}</div>`, `<span class="badge ${highUtil?'amber':'green'}">${highUtil} banks ≥ 80%</span>`)}
      ${card('Debt Mix','Short term vs long term',`<div class="ratio-card">${donut(state.loans.shortTerm,totalLoans(),pct(state.loans.shortTerm/totalLoans(),0))}<div><div class="metric-row"><span class="metric-name">Short term loans</span><span class="metric-value">${fmt(state.loans.shortTerm,0)}</span></div><div class="metric-row"><span class="metric-name">Long term loans</span><span class="metric-value">${fmt(state.loans.longTerm,0)}</span></div><div class="metric-row"><span class="metric-name">Current total</span><span class="metric-value">${fmt(totalLoans(),0)}</span></div></div></div>`,'<span class="badge blue">QAR mn</span>')}
    </div>
    <div class="grid-3">
      ${card('Liquidity at Historical Cost','Current recalculated ratio',`<div class="ratio-card">${donut(Math.min(ratios.cost,1),1,`${fmt(ratios.cost,2)}x`)}<div><div class="metric-row"><span class="metric-name">Liquid assets</span><span class="metric-value">${fmt(ratios.costAssets,1)}</span></div><div class="metric-row"><span class="metric-name">Debt</span><span class="metric-value">${fmt(totalLoans(),1)}</span></div></div></div>`)}
      ${card('Liquidity at Market Value','Current recalculated ratio',`<div class="ratio-card">${donut(Math.min(ratios.market,1),1,`${fmt(ratios.market,2)}x`)}<div><div class="metric-row"><span class="metric-name">Liquid assets</span><span class="metric-value">${fmt(ratios.marketAssets,1)}</span></div><div class="metric-row"><span class="metric-name">Debt</span><span class="metric-value">${fmt(totalLoans(),1)}</span></div></div></div>`)}
      ${card('Management Attention','Key items from current data',`<div class="metric-row"><span class="metric-name">Available funds after reserves</span><span class="metric-value warn">${fmt(fundsAvailable(),2)}</span></div><div class="metric-row"><span class="metric-name">UBS WC utilisation</span><span class="metric-value bad">100%</span></div><div class="metric-row"><span class="metric-name">Mashreq WC utilisation</span><span class="metric-value warn">82.4%</span></div><div class="metric-row"><span class="metric-name">Oct net cash flow</span><span class="metric-value bad">-5.00</span></div>`)}
    </div>
    <div class="note-box alert-box"><strong>Source quality note:</strong> the Debt & Equity sheet contains several <strong>#REF!</strong> formulas. This prototype recalculates the current Debt / Equity and liquid asset ratios from the valid current balances in the workbook instead of displaying the broken references.</div>`;
}

function fundsView(){
  const available=fundsAvailable(); return `
    <div class="section-heading"><div><h2>Funds Position</h2><p>Bank balances and reserve allocation</p></div><span class="badge blue">Daily update by 9 am</span></div>
    <div class="kpi-grid">${kpi('Total Bank Balance',fmt(state.funds.totalBankBalance,3),'All currencies translated to QAR','▣')}${kpi('Liquidity Reserve',fmt(state.funds.liquidityReserve,2),'Reserved fixed deposit','◉')}${kpi('Reserved Working Capital',fmt(state.funds.reservedWorkingCapital,2),'Ring fenced working capital','◫')}${kpi('Remaining Amount',fmt(available,3),'Available after reserves','✓',available<.5?'warn':'good')}</div>
    <div class="grid-2">${card('QAR Balance by Unit','Unit wise balance in QAR million',`<div class="chart">${svgBarChart(state.funds.qarByUnit,'amount')}</div>`)}${card('QAR Balance by Bank','Bank wise position in QAR million',`<div class="chart">${svgBarChart(state.funds.qarByBank,'amount')}</div>`)}</div>
    ${card('USD Account Balances','Balances shown in USD million from the source table',`<div class="chart">${svgBarChart(state.funds.usdAccountsByBank,'amount',{decimals:3})}</div><div class="note-box">The source workbook dashboard title mentions a different USD total than the detailed bank table. This screen uses the detailed bank table values.</div>`)}
  `;
}
function cashflowView(){
  const rows=state.cashflow.map(x=>({...x,net:Number(x.inflow)-Number(x.outflow)})); return `
    <div class="section-heading"><div><h2>Cash Flow Projection</h2><p>August 2026 to October 2026, excluding Murabaha payments</p></div><span class="badge blue">QAR mn</span></div>
    <div class="grid-2">${card('Cash Inflow vs Outflow','Monthly projection',`<div class="chart">${svgGroupedBar(state.cashflow,['inflow','outflow'],['Cash inflow','Cash outflow'])}</div>`)}${card('Monthly Net Position','Surplus / deficit trend',`<div class="chart">${svgLineChart(rows,'net')}</div>`)}</div>
    ${card('Cash Flow Detail','Editable from Data Input page',`<div class="table-wrap"><table><thead><tr><th>Month</th><th class="num">Inflow</th><th class="num">Outflow</th><th class="num">Net</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.month}</td><td class="num">${fmt(r.inflow,2)}</td><td class="num">${fmt(r.outflow,2)}</td><td class="num ${r.net<0?'bad':'good'}">${fmt(r.net,2)}</td><td><span class="badge ${r.net>0?'green':r.net<0?'red':'amber'}">${r.net>0?'Surplus':r.net<0?'Deficit':'Balanced'}</span></td></tr>`).join('')}</tbody></table></div>`)}
  `;
}
function workingCapitalView(){ const t=wcTotals(); return `
  <div class="section-heading"><div><h2>Working Capital Finance</h2><p>Limits and utilisation across banks and regions</p></div><span class="badge ${t.utilised/t.sanctioned>.8?'red':'green'}">Overall ${pct(t.utilised/t.sanctioned)}</span></div>
  <div class="grid-2">${card('Bank Wise Facility Utilisation','Total bank limit versus utilisation',`<div class="chart">${svgGroupedBar(state.workingCapital,['sanctioned','utilised'],['Sanctioned','Utilised'])}</div>`)}${card('Region Wise Facility Utilisation','Qatar, U.A.E and Switzerland',`<div class="chart">${svgGroupedBar(state.regionFacilities,['sanctioned','utilised'],['Sanctioned','Utilised'])}</div>`)}</div>
  ${card('Working Capital Detail','Bank facility utilisation',`<div class="table-wrap"><table><thead><tr><th>Bank</th><th class="num">Sanctioned</th><th class="num">Utilised</th><th class="num">Utilisation</th><th>Indicator</th></tr></thead><tbody>${state.workingCapital.map(r=>{const u=r.utilised/r.sanctioned; return `<tr><td>${r.bank}</td><td class="num">${fmt(r.sanctioned,1)}</td><td class="num">${fmt(r.utilised,1)}</td><td class="num">${pct(u)}</td><td><div class="progress"><span style="width:${Math.min(100,u*100)}%"></span></div></td></tr>`}).join('')}</tbody></table></div><div class="note-box">LC, Murabaha and Bonds & Guarantees can be sublimits of shared facilities. For the overall KPI, the dashboard uses the bank total limits shown in the source workbook.</div>`)}`;
}
function loansView(){ return `
  <div class="section-heading"><div><h2>Loan Position</h2><p>Short term and long term outstanding and repayment profile</p></div><span class="badge blue">Current total ${fmt(totalLoans(),0)}</span></div>
  <div class="grid-2">${card('Loans by Bank','Short term and long term outstanding',`<div class="chart">${svgGroupedBar(state.loans.byBank,['stl','ltl'],['Short term','Long term'])}</div>`)}${card('Short Term Repayment','Aug to Oct 2026',`<div class="chart">${svgLineChart(state.loans.shortRepayment,'amount')}</div>`)}</div>
  <div class="grid-2">${card('Long Term Repayment','Quarterly repayment through Q4 2027',`<div class="chart">${svgLineChart(state.loans.longRepayment,'amount')}</div>`)}${card('Outstanding by Bank','Source workbook summary as on 15 August 2026',`<div class="table-wrap"><table><thead><tr><th>Bank</th><th class="num">STL</th><th class="num">LTL</th><th class="num">Total</th></tr></thead><tbody>${state.loans.byBank.map(r=>`<tr><td>${r.bank}</td><td class="num">${fmt(r.stl,0)}</td><td class="num">${fmt(r.ltl,0)}</td><td class="num"><strong>${fmt(Number(r.stl)+Number(r.ltl),0)}</strong></td></tr>`).join('')}<tr><td><strong>Total</strong></td><td class="num"><strong>${fmt(state.loans.shortTerm,0)}</strong></td><td class="num"><strong>${fmt(state.loans.longTerm,0)}</strong></td><td class="num"><strong>${fmt(totalLoans(),0)}</strong></td></tr></tbody></table></div>`)}</div>`;
}
function debtView(){ const r=currentRatios(); const hist=state.debt.historical.map(x=>({...x,ratio:x.liquidAssets/x.debt})); const mh=state.debt.marketHistorical.map(x=>({...x,ratio:x.liquidAssets/x.debt})); return `
  <div class="section-heading"><div><h2>Debt & Liquidity</h2><p>Recalculated current ratios with historical trend from the workbook</p></div><span class="badge amber">Workbook #REF! repaired in app logic</span></div>
  <div class="kpi-grid">${kpi('Debt / Equity',`${fmt(r.de,2)}x`,'Total loans / book equity','◎')}${kpi('Liquid Assets / Debt at Cost',`${fmt(r.cost,2)}x`,'Current calculated ratio','◉')}${kpi('Liquid Assets / Debt at Market',`${fmt(r.market,2)}x`,'Current calculated ratio','◉')}${kpi('Book Equity',fmt(state.debt.equityBookValue,0),'Current book value','▣')}</div>
  <div class="grid-2">${card('Historical Cost Liquidity Ratio','2023 to June 2026',`<div class="chart">${svgLineChart(hist,'ratio')}</div>`)}${card('Market Value Liquidity Ratio','2023 to June 2026',`<div class="chart">${svgLineChart(mh,'ratio')}</div>`)}</div>
  ${card('Current Liquid Asset Build Up','15 August 2026 recalculation',`<div class="table-wrap"><table><thead><tr><th>Component</th><th class="num">Historical Cost</th><th class="num">Market Value</th></tr></thead><tbody><tr><td>Cash at bank</td><td class="num">${fmt(state.funds.totalBankBalance,2)}</td><td class="num">${fmt(state.funds.totalBankBalance,2)}</td></tr><tr><td>Shares</td><td class="num">${fmt(state.debt.investmentCostShares,2)}</td><td class="num">${fmt(state.debt.investmentMarketShares,2)}</td></tr><tr><td>Metal</td><td class="num">${fmt(state.debt.investmentCostMetal,2)}</td><td class="num">${fmt(state.debt.investmentMarketMetal,2)}</td></tr><tr><td><strong>Total liquid assets</strong></td><td class="num"><strong>${fmt(r.costAssets,2)}</strong></td><td class="num"><strong>${fmt(r.marketAssets,2)}</strong></td></tr><tr><td>Total debt</td><td class="num">${fmt(totalLoans(),2)}</td><td class="num">${fmt(totalLoans(),2)}</td></tr></tbody></table></div>`)}`;
}
function movementView(){ const net=state.movement.map(x=>({...x,net:Number(x.loans)-Number(x.liquidityReserve)})); return `
  <div class="section-heading"><div><h2>Projected Loan Movement</h2><p>Loan balance after scheduled repayments, new loans and liquidity reserve</p></div><span class="badge blue">QAR mn</span></div>
  <div class="grid-2">${card('Total Loan Movement','Projected gross loan balance',`<div class="chart">${svgLineChart(state.movement,'loans')}</div>`)}${card('Net Loan Movement','After QAR 10m liquidity reserve',`<div class="chart">${svgLineChart(net,'net')}</div>`)}</div>
  ${card('Movement Schedule','High level projection from source workbook',`<div class="table-wrap"><table><thead><tr><th>Date / Period</th><th class="num">Gross Loans</th><th class="num">Liquidity Reserve</th><th class="num">Net Loans</th></tr></thead><tbody>${net.map(r=>`<tr><td>${r.date}</td><td class="num">${fmt(r.loans,2)}</td><td class="num">${fmt(r.liquidityReserve,2)}</td><td class="num"><strong>${fmt(r.net,2)}</strong></td></tr>`).join('')}</tbody></table></div>`)}`;
}
function workflowView(){ const readOnly=currentRole==='CEO / Board'; return `
  <div class="section-heading"><div><h2>Comments & Approval</h2><p>Offline prototype of the review chain. Data is stored only in this browser.</p></div><span class="badge ${readOnly?'amber':'blue'}">Current role: ${currentRole}</span></div>
  <div class="note-box">Workflow sequence: BU Data Entry → BU Finance Head → Business Head → Corporate Finance → CFO. CEO / Board has read only access in this prototype.</div><div style="height:14px"></div>
  <div class="workflow-grid">${Object.entries(state.workflow).map(([section,w])=>workflowItem(section,w,readOnly)).join('')}</div>`;
}
function workflowItem(section,w,readOnly){
  const roleIndex=STAGES.indexOf(currentRole); const canAct=!readOnly && roleIndex>=0; return `<div class="workflow-item"><div class="workflow-top"><div class="workflow-section">${section}</div><span class="badge ${w.stage>=5?'green':w.stage===roleIndex+1?'blue':'amber'}">${w.stage>=5?'CFO Approved':`Stage ${w.stage} of 5`}</span></div><div class="stage-track">${STAGES.map((s,i)=>`<div class="stage ${i<w.stage?'done':i===w.stage?'current':''}">${s}</div>`).join('')}</div><div class="comment-list">${w.comments.length?w.comments.slice(-3).map(c=>`<div class="comment"><strong>${c.role}:</strong> ${escapeHtml(c.text)}</div>`).join(''):'<div class="comment">No comments yet.</div>'}</div>${canAct?`<div class="comment-form"><textarea id="comment-${slug(section)}" placeholder="Add comment as ${currentRole}"></textarea><button class="primary-btn" onclick="addWorkflowComment('${jsq(section)}')">Save Comment</button></div><div style="margin-top:8px"><button class="secondary-btn" onclick="advanceWorkflow('${jsq(section)}')">Approve / Move Forward</button></div>`:''}</div>`;
}
function dataView(){ return `
  <div class="section-heading"><div><h2>Offline Data Input</h2><p>Edit the main dashboard inputs. Changes are saved in localStorage on this computer.</p></div><span class="badge blue">No server required</span></div>
  <div class="toolbar"><button class="primary-btn" onclick="saveAllInputs()">Save All Changes</button><button class="danger-btn" onclick="resetBaseline()">Reset to Excel Baseline</button><label class="file-label">Import JSON<input type="file" accept="application/json" onchange="importJsonFile(event)"></label></div>
  <div class="input-panel">
    ${editableSimpleCard('Funds & Reserves',[['Total bank balance','funds.totalBankBalance',state.funds.totalBankBalance],['Liquidity reserve','funds.liquidityReserve',state.funds.liquidityReserve],['Reserved working capital','funds.reservedWorkingCapital',state.funds.reservedWorkingCapital]])}
    ${editableTableCard('Cash Flow','cashflow',state.cashflow,[['Month','month','text'],['Cash Inflow','inflow','number'],['Cash Outflow','outflow','number']])}
    ${editableTableCard('Working Capital Facilities','workingCapital',state.workingCapital,[['Bank','bank','text'],['Sanctioned','sanctioned','number'],['Utilised','utilised','number']])}
    ${editableTableCard('Loans by Bank','loans.byBank',state.loans.byBank,[['Bank','bank','text'],['Short Term','stl','number'],['Long Term','ltl','number']])}
    ${editableSimpleCard('Debt & Investment Inputs',[['Equity book value','debt.equityBookValue',state.debt.equityBookValue],['Shares at cost','debt.investmentCostShares',state.debt.investmentCostShares],['Metal at cost','debt.investmentCostMetal',state.debt.investmentCostMetal],['Shares at market value','debt.investmentMarketShares',state.debt.investmentMarketShares],['Metal at market value','debt.investmentMarketMetal',state.debt.investmentMarketMetal]])}
  </div>`;
}
function editableSimpleCard(title, fields){ return card(title,'Amounts in QAR million',`<div class="table-wrap"><table class="editable-table"><thead><tr><th>Input</th><th class="num">Value</th></tr></thead><tbody>${fields.map(([label,path,val])=>`<tr><td>${label}</td><td><input type="number" step="0.001" data-path="${path}" value="${Number(val)}"></td></tr>`).join('')}</tbody></table></div>`); }
function editableTableCard(title, path, rows, cols){ return card(title,'Editable offline data',`<div class="table-wrap"><table class="editable-table"><thead><tr>${cols.map(c=>`<th class="${c[2]==='number'?'num':''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr>${cols.map(c=>`<td><input type="${c[2]}" ${c[2]==='number'?'step="0.001"':''} data-path="${path}.${i}.${c[1]}" value="${String(r[c[1]]).replace(/"/g,'&quot;')}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`); }

function setPath(obj,path,value){ const parts=path.split('.'); let cur=obj; for(let i=0;i<parts.length-1;i++) cur=cur[parts[i]]; const key=parts.at(-1); cur[key]=value; }
function saveAllInputs(){ document.querySelectorAll('[data-path]').forEach(inp=>setPath(state,inp.dataset.path,inp.type==='number'?Number(inp.value):inp.value)); state.loans.shortTerm=sum(state.loans.byBank,'stl'); state.loans.longTerm=sum(state.loans.byBank,'ltl'); saveState('Dashboard data saved locally'); render(); }
function resetBaseline(){ if(confirm('Reset all locally edited values and comments to the Excel baseline?')){ state=deepClone(BASELINE); saveState('Reset to Excel baseline'); render(); } }
function exportData(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='treasury_dashboard_data_15Aug2026.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
function importJsonFile(e){ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{ try{state=JSON.parse(reader.result); saveState('Imported JSON data'); render();}catch{alert('Invalid JSON file.');} }; reader.readAsText(f); }
function addWorkflowComment(section){ const ta=document.getElementById(`comment-${slug(section)}`); const text=ta?.value.trim(); if(!text)return toast('Enter a comment first'); state.workflow[section].comments.push({role:currentRole,text}); saveState('Comment saved'); render(); }
function advanceWorkflow(section){ const w=state.workflow[section], idx=STAGES.indexOf(currentRole); if(idx<0)return; if(idx+1 < w.stage) return toast('This stage is already completed'); if(idx+1 > w.stage) return toast('Previous workflow stage must be completed first'); w.stage=Math.min(5,w.stage+1); w.comments.push({role:currentRole,text:w.stage>=5?'Approved for CEO / Board reporting.':'Reviewed and moved to the next stage.'}); saveState('Workflow updated'); render(); }
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-');} function jsq(s){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");} function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

const viewMeta={
  dashboard:['Executive Treasury Dashboard','Position as on 15 August 2026 · Amounts in QAR million unless stated'], funds:['Funds Position','Bank balances and liquidity allocation'], cashflow:['Cash Flow Projection','August to October 2026'], workingcapital:['Working Capital Finance','Facility limits and utilisation'], loans:['Loan Position','Outstanding and repayment schedule'], debt:['Debt & Liquidity','Debt, equity and liquid assets'], movement:['Projected Loan Movement','Repayment and new loan projection'], workflow:['Comments & Approval','Offline review and approval prototype'], data:['Data Input','Edit dashboard inputs locally']
};
function render(){
  const map={dashboard:dashboardView,funds:fundsView,cashflow:cashflowView,workingcapital:workingCapitalView,loans:loansView,debt:debtView,movement:movementView,workflow:workflowView,data:dataView};
  document.getElementById('content').innerHTML=map[currentView](); const [t,s]=viewMeta[currentView]; document.getElementById('pageTitle').textContent=t; document.getElementById('pageSubtitle').textContent=s;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView));
}

document.getElementById('nav').addEventListener('click',e=>{const b=e.target.closest('.nav-item'); if(!b)return; currentView=b.dataset.view; document.getElementById('sidebar').classList.remove('open'); render();});
document.getElementById('roleSelect').addEventListener('change',e=>{currentRole=e.target.value; if(currentView==='workflow')render();});
document.getElementById('exportBtn').addEventListener('click',exportData);
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
render();

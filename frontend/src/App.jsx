import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Funds from './pages/Funds';
import CashFlow from './pages/CashFlow';
import WorkingCapital from './pages/WorkingCapital';
import Loans from './pages/Loans';
import Debt from './pages/Debt';
import Movement from './pages/Movement';
import Workflow from './pages/Workflow';
import DataInput from './pages/DataInput';
import Placeholder from './pages/Placeholder';

function App() {
  const [currentRole, setCurrentRole] = useState('BU Data Entry');

  return (
    <Router>
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<><Topbar title="Executive Treasury Dashboard" subtitle="Position as on 15 August 2026 · Amounts in QAR million unless stated" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><Dashboard /></div></>} />
            <Route path="/funds" element={<><Topbar title="Funds Position" subtitle="Bank balances and liquidity allocation" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><Funds /></div></>} />
            <Route path="/cashflow" element={<><Topbar title="Cash Flow Projection" subtitle="August to October 2026" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><CashFlow /></div></>} />
            <Route path="/workingcapital" element={<><Topbar title="Working Capital Finance" subtitle="Facility limits and utilisation" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><WorkingCapital /></div></>} />
            <Route path="/loans" element={<><Topbar title="Loan Position" subtitle="Outstanding and repayment schedule" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><Loans /></div></>} />
            <Route path="/debt" element={<><Topbar title="Debt & Liquidity" subtitle="Debt, equity and liquid assets" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><Debt /></div></>} />
            <Route path="/movement" element={<><Topbar title="Projected Loan Movement" subtitle="Repayment and new loan projection" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><Movement /></div></>} />
            <Route path="/workflow" element={<><Topbar title="Comments & Approval" subtitle="Review and approval prototype" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><Workflow /></div></>} />
            <Route path="/data" element={<><Topbar title="Data Ingestion" subtitle="Excel uploads and manual entry" currentRole={currentRole} setCurrentRole={setCurrentRole} /><div className="content"><DataInput /></div></>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

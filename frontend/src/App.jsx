import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<><Topbar title="Executive Treasury Dashboard" subtitle="Position as on 15 August 2026 · Amounts in QAR million unless stated" /><div className="content"><Dashboard /></div></>} />
          <Route path="/funds" element={<><Topbar title="Funds Position" subtitle="Bank balances and liquidity allocation" /><div className="content"><Funds /></div></>} />
          <Route path="/cashflow" element={<><Topbar title="Cash Flow Projection" subtitle="August to October 2026" /><div className="content"><CashFlow /></div></>} />
          <Route path="/workingcapital" element={<><Topbar title="Working Capital Finance" subtitle="Facility limits and utilisation" /><div className="content"><WorkingCapital /></div></>} />
          <Route path="/loans" element={<><Topbar title="Loan Position" subtitle="Outstanding and repayment schedule" /><div className="content"><Loans /></div></>} />
          <Route path="/debt" element={<><Topbar title="Debt & Liquidity" subtitle="Debt, equity and liquid assets" /><div className="content"><Debt /></div></>} />
          <Route path="/movement" element={<><Topbar title="Projected Loan Movement" subtitle="Repayment and new loan projection" /><div className="content"><Movement /></div></>} />
          <Route path="/workflow" element={<><Topbar title="Comments & Approval" subtitle="Review and approval prototype" /><div className="content"><Workflow /></div></>} />
          <Route path="/data" element={<><Topbar title="Data Ingestion" subtitle="Excel uploads and manual entry" /><div className="content"><DataInput /></div></>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const role = user?.role || 'VIEWER';

  const canEdit = ['BU_FINANCE_USER', 'BU_FINANCE_HEAD', 'BUSINESS_HEAD', 'CORP_FINANCE', 'CFO'].includes(role);
  const canApprove = ['BU_FINANCE_HEAD', 'BUSINESS_HEAD', 'CORP_FINANCE', 'CFO'].includes(role);

  return (
    <aside className="sidebar" id="sidebar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div>
          <div className="brand-title">Treasury</div>
          <div className="brand-subtitle">Dashboard App</div>
        </div>
      </div>
      <nav className="nav" id="nav">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>⌂</span> Executive Dashboard</NavLink>
        <NavLink to="/funds" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>▣</span> Funds Position</NavLink>
        <NavLink to="/cashflow" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>↕</span> Cash Flow</NavLink>
        <NavLink to="/workingcapital" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>◫</span> Working Capital</NavLink>
        <NavLink to="/loans" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>▤</span> Loans</NavLink>
        <NavLink to="/debt" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>◎</span> Debt & Liquidity</NavLink>
        <NavLink to="/movement" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>⌁</span> Loan Movement</NavLink>
        
        {canApprove && (
          <NavLink to="/workflow" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>✓</span> Workflow Inbox</NavLink>
        )}
        
        {canEdit && (
          <NavLink to="/data" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>✎</span> Data Input</NavLink>
        )}
      </nav>
      
      <div style={{ padding: '1.5rem', marginTop: 'auto', borderTop: '1px solid #e2e8f0' }}>
        <button 
          onClick={logout}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', 
            padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', 
            backgroundColor: '#fee2e2', color: '#b91c1c', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
        >
          <span style={{ fontSize: '1.25rem' }}>⎋</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

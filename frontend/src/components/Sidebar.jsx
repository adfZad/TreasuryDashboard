import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
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
        <NavLink to="/workflow" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>✓</span> Comments & Approval</NavLink>
        <NavLink to="/data" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><span>✎</span> Data Input</NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

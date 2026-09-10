import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const roleNames = {
  'BU_FINANCE_USER': 'BU Finance User',
  'BU_FINANCE_HEAD': 'BU Finance Head',
  'BUSINESS_HEAD': 'Business Head',
  'CORP_FINANCE': 'Corporate Finance',
  'CFO': 'Chief Financial Officer',
  'VIEWER': 'Viewer'
};

const Topbar = ({ title, subtitle }) => {
  const { user } = useContext(AuthContext);

  const roleName = user ? (roleNames[user.role] || user.role) : '';

  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" id="menuBtn" aria-label="Menu">☰</button>
      <div>
        <h1 id="pageTitle">{title}</h1>
        <p id="pageSubtitle">{subtitle}</p>
      </div>
      <div className="top-actions" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
        {user && (
          <div className="role-select-wrap">
            Role
            <div style={{
              border: '1px solid #cfd7e3',
              background: 'white',
              borderRadius: '8px',
              padding: '8px 14px',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              height: '35px' 
            }}>
              {roleName}
            </div>
          </div>
        )}
        <button className="secondary-btn" id="exportBtn" style={{ height: '35px' }}>Export Data</button>
      </div>
    </header>
  );
};

export default Topbar;

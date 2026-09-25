import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
  const [pendingCount, setPendingCount] = useState(0);

  const roleName = user ? (roleNames[user.role] || user.role) : '';

  useEffect(() => {
    if (user && (user.role === 'CFO' || user.role === 'CORP_FINANCE' || user.role === 'BUSINESS_HEAD')) {
      axios.get('/api/workflow/pending')
        .then(res => {
          if (Array.isArray(res.data)) {
            setPendingCount(res.data.length);
          }
        })
        .catch(err => console.error("Error fetching pending count:", err));
    }
  }, [user]);

  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" id="menuBtn" aria-label="Menu">☰</button>
      <div>
        <h1 id="pageTitle">{title}</h1>
        <p id="pageSubtitle">{subtitle}</p>
        {title !== 'Executive Treasury Dashboard' && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '0', fontWeight: 300 }}>
            Position as on 15 August 2026 - Amounts in QAR million unless stated
          </p>
        )}
      </div>
      <div className="top-actions" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
        
        {/* Notification Bell */}
        {user && (user.role === 'CFO' || user.role === 'CORP_FINANCE' || user.role === 'BUSINESS_HEAD') && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '35px' }}>
            <Link to="/workflow" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              <Bell size={20} />
              {pendingCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--red)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {user && (
          <div className="role-select-wrap">
            <div style={{
              border: '1px solid #cfd7e3',
              background: 'white',
              borderRadius: '8px',
              padding: '6px 14px',
              color: 'var(--text)',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              height: '30px' 
            }}>
              {roleName}
            </div>
          </div>
        )}
        <button className="secondary-btn" id="exportBtn" style={{ height: '30px', fontSize: '11px', padding: '6px 14px' }}>Export Data</button>
      </div>
    </header>
  );
};

export default Topbar;

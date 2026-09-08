import React from 'react';

const Topbar = ({ title, subtitle, currentRole, setCurrentRole }) => {
  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" id="menuBtn" aria-label="Menu">☰</button>
      <div>
        <h1 id="pageTitle">{title}</h1>
        <p id="pageSubtitle">{subtitle}</p>
      </div>
      <div className="top-actions">
        <label className="role-select-wrap">Role
          <select id="roleSelect" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)}>
            <option>BU Data Entry</option>
            <option>BU Finance Head</option>
            <option>Business Head</option>
            <option>Corporate Finance</option>
            <option>CFO</option>
            <option>CEO / Board</option>
          </select>
        </label>
        <button className="secondary-btn" id="exportBtn">Export Data</button>
      </div>
    </header>
  );
};

export default Topbar;

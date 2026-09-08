import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WorkingCapital = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/workingcapital')
      .then(res => {
        setFacilities(res.data.facilities || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalSanctioned = facilities.reduce((sum, f) => sum + (f.SanctionedLimit || 0), 0);
  const totalUtilized = facilities.reduce((sum, f) => sum + (f.UtilizedAmount || 0), 0);
  const avgUtilPct = totalSanctioned > 0 ? (totalUtilized / totalSanctioned) * 100 : 0;

  return (
    <div>
      <div className="section-heading">
        <h2>Working Capital Finance</h2>
        <p>Short-term facilities and utilisation overview</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-label">Total Sanctioned Limit</div>
            <div className="kpi-icon" style={{color:'var(--blue)'}}>▣</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap' }}>
            {totalSanctioned.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-label">Total Utilized Amount</div>
            <div className="kpi-icon" style={{color:'var(--danger)'}}>◫</div>
          </div>
          <div className="kpi-value" style={{ whiteSpace: 'nowrap' }}>
            {totalUtilized.toFixed(2)} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>QAR</span>
          </div>
        </div>

        <div className="kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-label">Aggregate Utilization</div>
            <div className="kpi-icon" style={{color:'var(--text)'}}>◎</div>
          </div>
          <div className="kpi-value">{avgUtilPct.toFixed(1)}%</div>
        </div>
      </div>

      <div className="card" style={{marginTop: '20px'}}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Bank</th>
                <th>Type</th>
                <th className="num">Sanctioned Limit</th>
                <th className="num">Utilized</th>
                <th className="num">Available</th>
                <th>Utilization %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="empty animate-pulse-dot">Loading facilities...</td></tr>
              ) : facilities.length === 0 ? (
                <tr><td colSpan="7" className="empty">No facilities found.</td></tr>
              ) : (
                facilities.map((f, idx) => (
                  <tr key={idx} className="animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td className="font-mono">{f.FacilityReference}</td>
                    <td><span className="badge badge-accent">{f.BankName}</span></td>
                    <td>{f.FacilityTypeName}</td>
                    <td className="num"><strong>{f.SanctionedLimit?.toFixed(2)}</strong></td>
                    <td className="num">{f.UtilizedAmount?.toFixed(2)}</td>
                    <td className="num text-success">{f.AvailableAmount?.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress" style={{ flex: 1 }}>
                          <span style={{ width: `${f.UtilizationPct}%`, background: f.UtilizationPct > 80 ? 'var(--danger)' : 'var(--blue)' }}></span>
                        </div>
                        <span style={{ fontSize: '11px', width: '35px', textAlign: 'right' }}>{f.UtilizationPct?.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkingCapital;

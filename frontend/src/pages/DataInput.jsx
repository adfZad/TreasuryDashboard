import React, { useState } from 'react';
import axios from 'axios';

const DataInput = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setProgress(0);

    const interval = setInterval(() => {
        setProgress(p => (p >= 90 ? 90 : p + 15));
    }, 150);

    axios.post('/api/data', {})
      .then(res => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
            setStatus({ type: 'success', msg: res.data.message });
            setLoading(false);
            setProgress(0);
        }, 300);
      })
      .catch(err => {
        clearInterval(interval);
        setStatus({ type: 'error', msg: 'Failed to upload data.' });
        setLoading(false);
        setProgress(0);
      });
  };

  return (
    <div>
      <div className="section-heading">
        <h2>Data Ingestion</h2>
        <p>Upload Excel schedules or manually input data to stage into TreasuryDB</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Upload Excel Workbook</div>
          </div>
          <form onSubmit={handleSubmit} className="input-panel">
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Target Module</label>
              <select style={{ width: '100%' }}>
                <option>Bank Balances</option>
                <option>Cash Flow Forecast</option>
                <option>Loan Movement</option>
              </select>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <label className="file-label" style={{ width: '100%', display: 'flex', justifyContent: 'center', border: '1px dashed var(--blue)', background: 'var(--blue-soft)' }}>
                <input type="file" accept=".xlsx, .xls" />
                <span>+ Browse for file</span>
              </label>
            </div>
            
            <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '15px', width: '100%' }}>
              {loading ? 'Processing...' : 'Upload & Validate'}
            </button>

            {loading && progress > 0 && (
              <div style={{ marginTop: '15px', width: '100%', height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', transition: 'width 0.2s' }}></div>
              </div>
            )}
            
            {status && !loading && (
              <div className="comment animate-fade-in" style={{ marginTop: '10px', background: status.type === 'success' ? 'var(--green-soft)' : 'var(--red-soft)', color: status.type === 'success' ? 'var(--green)' : 'var(--red)' }}>
                {status.msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataInput;

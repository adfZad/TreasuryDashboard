import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataInput = () => {
  const [file, setFile] = useState(null);
  const [module, setModule] = useState('MASTER_REPORT');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/api/upload/batches');
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: 'error', msg: 'Please select a file to upload.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    try {
      const res = await axios.post('/api/upload/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatus({ 
        type: 'success', 
        msg: `Success! Batch ID: ${res.data.batchId}. ${res.data.rowsProcessed} rows processed. ${res.data.errors} errors.` 
      });
      setFile(null);
      // Reset file input
      document.getElementById('fileUpload').value = '';
      fetchBatches(); // Refresh history
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.length > 0) {
        setStatus({ 
          type: 'error', 
          msg: `${errorData.message}:\n${errorData.errors.join('\n')}`
        });
      } else {
        setStatus({ 
          type: 'error', 
          msg: errorData?.message || 'Failed to process file.' 
        });
      }
    } finally {
      setLoading(false);
    }
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
              <select style={{ width: '100%', backgroundColor: '#f8fafc', fontSize: '14px', padding: '8px' }} value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="MASTER_REPORT">Master Treasury Report</option>
                <option value="FUNDS_POSITION">Funds Position</option>
                <option value="CASH_FLOW">Cash Flow</option>
                <option value="WORKING_CAPITAL">Working Capital</option>
                <option value="LOANS">Loans</option>
                <option value="LOAN_MOVEMENT">Loan Movement</option>
              </select>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <label className="file-label" style={{ 
                width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', 
                border: '2px dashed var(--blue)', background: 'var(--blue-soft)', 
                padding: '2rem 1rem', borderRadius: '8px', cursor: 'pointer' 
              }}>
                <input 
                  id="fileUpload"
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '24px', marginBottom: '8px' }}>📄</span>
                <span style={{ fontWeight: '600', color: 'var(--blue)' }}>
                  {file ? file.name : 'Click to Browse for Excel File'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  Supported formats: .xlsx, .xls
                </span>
              </label>
            </div>
            
            <button type="submit" className="primary-btn" disabled={loading || !file} style={{ marginTop: '15px', width: '100%' }}>
              {loading ? 'Processing...' : 'Upload & Validate'}
            </button>
            
            {status && (
              <div className="comment animate-fade-in" style={{ marginTop: '15px', padding: '12px', borderRadius: '6px', background: status.type === 'success' ? 'var(--green-soft)' : 'var(--red-soft)', color: status.type === 'success' ? 'var(--green)' : 'var(--red)' }}>
                <strong>{status.type === 'success' ? '✓ ' : '⚠ '}</strong>
                <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12px' }}>
                  {status.msg}
                </pre>
              </div>
            )}
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Uploads</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Batch ID</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>File</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Uploaded By</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No recent uploads found.</td>
                  </tr>
                ) : (
                  batches.map(b => (
                    <tr key={b.UploadBatchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '600' }}>#{b.UploadBatchId}</td>
                      <td style={{ padding: '12px 8px' }}>{b.OriginalFileName}</td>
                      <td style={{ padding: '12px 8px' }}>{b.UploadedByName}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                          backgroundColor: b.UploadStatus === 'ERROR' ? '#fee2e2' : '#dcfce7',
                          color: b.UploadStatus === 'ERROR' ? '#991b1b' : '#166534'
                        }}>
                          {b.UploadStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInput;

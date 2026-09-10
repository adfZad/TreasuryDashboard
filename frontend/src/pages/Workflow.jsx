import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Workflow = () => {
  const [pendingBatches, setPendingBatches] = useState([]);
  const [historyBatches, setHistoryBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState(null);
  
  const [expandedRow, setExpandedRow] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    fetchPending();
    fetchHistory();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await axios.get('/api/workflow/pending');
      if (Array.isArray(res.data)) {
        setPendingBatches(res.data);
      } else {
        console.error("API did not return an array:", res.data);
        setPendingBatches([]);
      }
    } catch (err) {
      console.error("Error fetching pending batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/workflow/history');
      if (Array.isArray(res.data)) {
        setHistoryBatches(res.data);
      } else {
        setHistoryBatches([]);
      }
    } catch (err) {
      console.error("Error fetching history batches:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchComments = async (batchId) => {
    try {
      setCommentsLoading(true);
      const res = await axios.get(`/api/workflow/comments/${batchId}`);
      setComments(res.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleRow = (batchId) => {
    if (expandedRow === batchId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(batchId);
      fetchComments(batchId);
    }
  };

  const postComment = async (batchId) => {
    if (!newComment.trim()) return;
    try {
      await axios.post('/api/workflow/comment', { batchId, text: newComment });
      setNewComment('');
      fetchComments(batchId);
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment");
    }
  };

  const handleAction = async (batchId, action) => {
    let commentText = '';
    if (action === 'RETURN') {
        commentText = window.prompt(`Please provide a mandatory reason for returning batch #${batchId}:`);
        if (!commentText) return;
    } else {
        const confirmApprove = window.confirm(`Are you sure you want to approve batch #${batchId}?`);
        if (!confirmApprove) return;
        commentText = window.prompt(`Optional comment for approval (leave blank to skip):`) || '';
    }

    try {
      setActionStatus({ id: batchId, status: 'processing' });
      const res = await axios.post('/api/workflow/action', { batchId, action, comment: commentText });
      setActionStatus({ id: batchId, status: 'success', msg: res.data.message });
      setTimeout(() => {
        fetchPending();
        fetchHistory();
        setActionStatus(null);
        if (expandedRow === batchId) setExpandedRow(null);
      }, 2000);
    } catch (err) {
      setActionStatus({ id: batchId, status: 'error', msg: err.response?.data?.message || 'Action failed' });
    }
  };

  return (
    <div>
      <div className="section-heading">
        <h2>Approval Workflow Inbox</h2>
        <p>Review and approve pending data submissions before they update live dashboards</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Pending Approvals</div>
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading inbox...</div>
        ) : pendingBatches.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}> ✓ </span>
            No pending submissions require your approval.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Batch ID</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Submission Type</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Rows Staged</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Submitted By</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBatches.map(b => (
                  <React.Fragment key={b.UploadBatchId}>
                    <tr style={{ borderBottom: expandedRow === b.UploadBatchId ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 8px', fontWeight: '600' }}>#{b.UploadBatchId}</td>
                      <td style={{ padding: '15px 8px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--blue)' }}>{b.ModuleCode}</span>
                        <br/>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{b.OriginalFileName}</span>
                      </td>
                      <td style={{ padding: '15px 8px', fontWeight: 'bold' }}>{b.TotalRows}</td>
                      <td style={{ padding: '15px 8px' }}>{b.UploadedByName || 'System'}</td>
                      <td style={{ padding: '15px 8px', textAlign: 'right' }}>
                        {actionStatus?.id === b.UploadBatchId ? (
                          <span style={{ 
                            fontSize: '12px', fontWeight: 'bold', 
                            color: actionStatus.status === 'success' ? 'var(--green)' : actionStatus.status === 'error' ? 'var(--red)' : 'var(--muted)' 
                          }}>
                            {actionStatus.status === 'processing' ? 'Processing...' : actionStatus.msg}
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              className="secondary-btn" 
                              style={{ padding: '6px 10px', fontSize: '11px', marginRight: '8px' }}
                              onClick={() => toggleRow(b.UploadBatchId)}
                            >
                              {expandedRow === b.UploadBatchId ? 'Hide Comments' : 'Audit Trail & Comments'}
                            </button>
                            <button 
                              className="primary-btn" 
                              style={{ padding: '6px 12px', fontSize: '12px', background: '#10b981', borderColor: '#10b981' }}
                              onClick={() => handleAction(b.UploadBatchId, 'APPROVE')}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="primary-btn" 
                              style={{ padding: '6px 12px', fontSize: '12px', background: 'white', color: 'var(--red)', border: '1px solid var(--red)' }}
                              onClick={() => handleAction(b.UploadBatchId, 'RETURN')}
                            >
                              ✗ Return
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedRow === b.UploadBatchId && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td colSpan="5" style={{ padding: '0 8px 20px 8px' }}>
                          <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '12px' }}>Audit Trail & Comments</div>
                            {commentsLoading ? (
                              <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Loading history...</div>
                            ) : (
                              <div className="comment-list">
                                {comments.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No comments yet.</div>}
                                {comments.map((c, i) => (
                                  <div key={i} className="comment">
                                    <strong>{c.CommentedByName || 'System'}</strong> <span style={{ color: '#8898aa', fontSize: '10px' }}>({new Date(c.CreatedAtUtc).toLocaleString()})</span>
                                    <div style={{ marginTop: '4px' }}>{c.CommentText}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="comment-form" style={{ marginTop: '16px' }}>
                              <input 
                                type="text" 
                                placeholder="Add a comment or ask a question..." 
                                style={{ width: '100%' }}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => { if(e.key === 'Enter') postComment(b.UploadBatchId) }}
                              />
                              <button className="primary-btn" onClick={() => postComment(b.UploadBatchId)}>Post</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div className="card-title">Processed Approvals (History)</div>
        </div>
        
        {historyLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading history...</div>
        ) : historyBatches.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
            No processed workflows found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Batch ID</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Submission Type</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Rows Staged</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Submitted By</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)' }}>Status</th>
                  <th style={{ padding: '12px 8px', color: 'var(--muted)', textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {historyBatches.map(b => (
                  <React.Fragment key={b.UploadBatchId}>
                    <tr style={{ borderBottom: expandedRow === b.UploadBatchId ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 8px', fontWeight: '600' }}>#{b.UploadBatchId}</td>
                      <td style={{ padding: '15px 8px' }}>
                        <span style={{ fontWeight: '500', color: 'var(--blue)' }}>{b.ModuleCode}</span>
                        <br/>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{b.OriginalFileName}</span>
                      </td>
                      <td style={{ padding: '15px 8px', fontWeight: 'bold' }}>{b.TotalRows}</td>
                      <td style={{ padding: '15px 8px' }}>{b.UploadedByName || 'System'}</td>
                      <td style={{ padding: '15px 8px' }}>
                        <span style={{ 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                            backgroundColor: b.BatchStatus === 'APPROVED' ? '#d1fae5' : b.BatchStatus === 'RETURNED' ? '#fee2e2' : '#f1f5f9',
                            color: b.BatchStatus === 'APPROVED' ? '#065f46' : b.BatchStatus === 'RETURNED' ? '#991b1b' : '#475569'
                        }}>
                            {b.BatchStatus}
                        </span>
                      </td>
                      <td style={{ padding: '15px 8px', textAlign: 'right' }}>
                        <button 
                            className="secondary-btn" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => toggleRow(b.UploadBatchId)}
                        >
                            {expandedRow === b.UploadBatchId ? 'Hide Comments' : 'View Audit Trail'}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === b.UploadBatchId && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td colSpan="6" style={{ padding: '0 8px 20px 8px' }}>
                          <div style={{ background: '#fafbfc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '12px' }}>Audit Trail & Comments</div>
                            {commentsLoading ? (
                              <div style={{ color: 'var(--muted)', fontSize: '12px' }}>Loading history...</div>
                            ) : (
                              <div className="comment-list">
                                {comments.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '12px' }}>No comments found.</div>}
                                {comments.map((c, i) => (
                                  <div key={i} className="comment" style={{ marginBottom: '8px' }}>
                                    <strong>{c.CommentedByName || 'System'}</strong> <span style={{ color: '#8898aa', fontSize: '10px' }}>({new Date(c.CreatedAtUtc).toLocaleString()})</span>
                                    <div style={{ marginTop: '4px' }}>{c.CommentText}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workflow;

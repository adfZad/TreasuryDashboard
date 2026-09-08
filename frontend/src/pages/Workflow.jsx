import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Workflow = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchComments = () => {
    axios.get('/api/workflow')
      .then(res => {
        setComments(res.data.comments || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handlePost = () => {
    if (!newText.trim()) return;
    setPosting(true);
    axios.post('/api/workflow', { commentText: newText, moduleCode: 'GENERAL' })
      .then(() => {
        setNewText('');
        fetchComments();
      })
      .catch(console.error)
      .finally(() => setPosting(false));
  };

  return (
    <div>
      <div className="section-heading">
        <h2>Comments & Workflow</h2>
        <p>Review process and communication history</p>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <div className="workflow-grid">
            <div className="workflow-item">
              <div className="workflow-top">
                <span className="workflow-section">Period Submission</span>
                <span className="badge badge-accent">Under Review</span>
              </div>
              <div className="stage-track">
                <div className="stage done">Draft</div>
                <div className="stage current">BU Maker</div>
                <div className="stage">BU Checker</div>
                <div className="stage">Treasury Review</div>
                <div className="stage">CFO Approval</div>
              </div>
            </div>

            <div className="comment-list" style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Discussion Thread</h3>
                {loading ? (
                    <div className="empty animate-pulse-dot">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="empty">No comments yet.</div>
                ) : (
                    comments.map((c, idx) => (
                        <div key={idx} className="comment animate-fade-up" style={{ animationDelay: `${idx * 0.05}s`, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <strong>{c.UserName} <span style={{ color: 'var(--muted)', fontWeight: 'normal', fontSize: '11px' }}>({c.RoleName})</span></strong>
                                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{new Date(c.CreatedAtUtc).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px' }}>{c.CommentText}</p>
                            <span className="badge" style={{ marginTop: 8, display: 'inline-block', fontSize: '9px', background: 'var(--surface)' }}>{c.ModuleCode}</span>
                        </div>
                    ))
                )}
            </div>
            
            <div className="comment-form" style={{ marginTop: '20px' }}>
                <textarea 
                  placeholder="Write a comment..." 
                  rows="2" 
                  style={{ width: '100%' }}
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  disabled={posting}
                ></textarea>
                <button className="primary-btn" onClick={handlePost} disabled={posting || !newText.trim()}>
                  {posting ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Workflow;

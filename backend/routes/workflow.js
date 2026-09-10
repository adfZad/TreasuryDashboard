const express = require('express');
const { poolPromise, sql } = require('../db');
const { protect } = require('../auth');
const { processBatchData } = require('../services/dataProcessor');

const router = express.Router();

// GET /api/workflow/pending
// Fetch all DRAFT upload batches
router.get('/pending', protect, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                b.UploadBatchId, b.ModuleCode, b.OriginalFileName, b.UploadedAtUtc, b.TotalRows, 
                u.DisplayName as UploadedByName
            FROM ingest.UploadBatch b
            LEFT JOIN sec.AppUser u ON b.UploadedByUserId = u.AppUserId
            WHERE b.BatchStatus = 'DRAFT'
            ORDER BY b.UploadedAtUtc DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching pending workflow:', err);
        res.status(500).json({ message: 'Error fetching workflow items' });
    }
});

// GET /api/workflow/history
// Fetch all processed (APPROVED, RETURNED, ERROR) upload batches
router.get('/history', protect, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                b.UploadBatchId, b.ModuleCode, b.OriginalFileName, b.UploadedAtUtc, b.TotalRows, 
                b.BatchStatus,
                u.DisplayName as UploadedByName
            FROM ingest.UploadBatch b
            LEFT JOIN sec.AppUser u ON b.UploadedByUserId = u.AppUserId
            WHERE b.BatchStatus IN ('APPROVED', 'RETURNED', 'PROCESSED', 'ERROR')
            ORDER BY b.UploadedAtUtc DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching workflow history:', err);
        res.status(500).json({ message: 'Error fetching workflow history' });
    }
});

// POST /api/workflow/action
// Approve or return a batch
router.post('/action', protect, async (req, res) => {
    try {
        const { batchId, action, comment } = req.body; // action: 'APPROVE' or 'RETURN'
        
        if (!batchId || !['APPROVE', 'RETURN'].includes(action)) {
            return res.status(400).json({ message: 'Invalid batchId or action' });
        }

        const pool = await poolPromise;

        // Verify batch exists and is DRAFT
        const check = await pool.request().input('batchId', sql.BigInt, batchId).query("SELECT BatchStatus FROM ingest.UploadBatch WHERE UploadBatchId = @batchId");
        if (check.recordset.length === 0 || check.recordset[0].BatchStatus !== 'DRAFT') {
            return res.status(400).json({ message: 'Batch not found or already processed' });
        }

        // Insert audit log comment
        const auditText = `Batch ${action === 'APPROVE' ? 'Approved' : 'Returned'}. ${comment ? 'Reason/Comment: ' + comment : ''}`;
        await pool.request()
            .input('batchId', sql.BigInt, batchId)
            .input('userId', sql.BigInt, req.user?.userId || 1)
            .input('roleId', sql.Int, req.user?.roleId || 1)
            .input('text', sql.NVarChar, auditText)
            .query(`
                INSERT INTO workflow.WorkflowComment 
                (ReportingPeriodId, ReportVersionId, BusinessUnitId, ModuleCode, RecordType, RecordId, CommentedByUserId, CommentedByRoleId, CommentText, CommentStatus, IsExecutiveVisible, CreatedAtUtc)
                VALUES (1, 1, 1, 'EXCEL_UPLOAD', 'UploadBatch', @batchId, @userId, @roleId, @text, 'ACTIVE', 0, GETUTCDATE())
            `);

        if (action === 'APPROVE') {
            // Process the data!
            await processBatchData(batchId);
            res.json({ message: 'Batch approved and data processed successfully!' });
        } else if (action === 'RETURN') {
            // Just mark as RETURNED
            await pool.request().input('batchId', sql.BigInt, batchId).query("UPDATE ingest.UploadBatch SET BatchStatus = 'RETURNED' WHERE UploadBatchId = @batchId");
            res.json({ message: 'Batch returned to maker.' });
        }

    } catch (err) {
        console.error('Error processing workflow action:', err);
        res.status(500).json({ message: 'Server error processing action: ' + err.message });
    }
});

// GET /api/workflow/comments/:batchId
// Fetch comments and audit trail for a batch
router.get('/comments/:batchId', protect, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('batchId', sql.BigInt, req.params.batchId)
            .query(`
                SELECT 
                    c.WorkflowCommentId, c.CommentText, c.CreatedAtUtc,
                    u.DisplayName as CommentedByName
                FROM workflow.WorkflowComment c
                LEFT JOIN sec.AppUser u ON c.CommentedByUserId = u.AppUserId
                WHERE c.RecordType = 'UploadBatch' AND c.RecordId = @batchId
                ORDER BY c.CreatedAtUtc ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

// POST /api/workflow/comment
// Add a user comment to a batch
router.post('/comment', protect, async (req, res) => {
    try {
        const { batchId, text } = req.body;
        if (!batchId || !text) return res.status(400).json({ message: 'Missing batchId or text' });

        const pool = await poolPromise;
        await pool.request()
            .input('batchId', sql.BigInt, batchId)
            .input('userId', sql.BigInt, req.user?.userId || 1)
            .input('roleId', sql.Int, req.user?.roleId || 1)
            .input('text', sql.NVarChar, text)
            .query(`
                INSERT INTO workflow.WorkflowComment 
                (ReportingPeriodId, ReportVersionId, BusinessUnitId, ModuleCode, RecordType, RecordId, CommentedByUserId, CommentedByRoleId, CommentText, CommentStatus, IsExecutiveVisible, CreatedAtUtc)
                VALUES (1, 1, 1, 'EXCEL_UPLOAD', 'UploadBatch', @batchId, @userId, @roleId, @text, 'ACTIVE', 0, GETUTCDATE())
            `);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error posting comment:', err);
        res.status(500).json({ message: 'Error posting comment' });
    }
});

module.exports = router;

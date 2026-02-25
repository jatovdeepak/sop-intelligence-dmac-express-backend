const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
    try {
        // Fetch logs sorted by newest first and populate the username
        const logs = await AuditLog.find()
            .populate('userId', 'username') 
            .sort({ createdAt: -1 });
            
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
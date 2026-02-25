const AuditLog = require('../models/AuditLog');

exports.logAction = (actionName) => {
  return async (req, res, next) => {
    // Intercept response finish to capture status
    res.on('finish', async () => {
      const status =
        res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'DENIED';
      try {
        await AuditLog.create({
          userId: req.user?.id,
          system: req.user?.system,
          action: actionName,
          resourceId: req.params.id || 'N/A',
          status: status,
          ipAddress: req.ip,
        });
      } catch (err) {
        console.error('Audit Log Failed:', err);
      }
    });
    next();
  };
};

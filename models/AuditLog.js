const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g., 'READ_SOP', 'DENIED_ACCESS'
    resourceId: { type: String },
    system: { type: String }, // e.g., 'STEM'
    status: { type: String, enum: ['SUCCESS', 'DENIED'], required: true },
    ipAddress: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
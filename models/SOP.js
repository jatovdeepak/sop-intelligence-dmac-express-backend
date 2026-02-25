const mongoose = require('mongoose');

const sopSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: Object, required: true }, 
    status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Draft' }, 
    requiredRoles: [{ type: String }], 
    ownerSystem: { type: String, default: 'SOP_Intelligence' },
    pdfPath: { type: String } // NEW: Tracks where the PDF is stored
}, { timestamps: true });

module.exports = mongoose.model('SOP', sopSchema);
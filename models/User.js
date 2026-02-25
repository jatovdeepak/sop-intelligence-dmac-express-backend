const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    system: { type: String, enum: ['STEM', 'SOP_Intelligence', 'Admin'], required: true },
    role: { type: String, enum: ['Supervisor', 'Operator', 'Admin', 'QA'], required: true }
});

module.exports = mongoose.model('User', userSchema);
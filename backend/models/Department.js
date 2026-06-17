const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: 'Academic department dedicated to research and excellence.' },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    establishedYear: { type: Number, default: 2000 },
    stats: {
        paperCount: { type: Number, default: 0 },
        facultyCount: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);

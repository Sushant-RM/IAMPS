const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    abstract: { type: String },
    summary: { type: String },
    authors: [{ type: String }], // Array of author names
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    year: { type: Number },
    type: {
        type: String,
        enum: ['Journal', 'Conference', 'Research Paper', 'Thesis', 'Patent'],
        default: 'Research Paper'
    },
    venue: { type: String },
    pdfUrl: { type: String },
    certificateUrl: { type: String },
    status: {
        type: String,
        enum: ['pending_faculty', 'pending_admin', 'approved', 'rejected', 'revision_requested', 'published'],
        default: 'pending_faculty'
    },
    citationsCount: { type: Number, default: 0 },
    readsCount: { type: Number, default: 0 },
    // Version Control
    currentVersion: { type: Number, default: 1 },
    versions: [{
        versionNumber: { type: Number },
        pdfUrl: { type: String },
        changesDescription: { type: String },
        submittedAt: { type: Date, default: Date.now }
    }],
    // Approval Workflow Logs
    workflowLogs: [{
        stage: { type: String, enum: ['student', 'faculty', 'hod', 'committee', 'committee_member', 'admin'] },
        approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, enum: ['approve', 'reject', 'request_revision'] },
        comments: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plagiarismScore: { type: Number, default: 0 },
    plagiarismReport: { type: String }
}, { timestamps: true });

paperSchema.index({ submittedBy: 1 });
paperSchema.index({ departmentId: 1 });
paperSchema.index({ status: 1 });

module.exports = mongoose.model('Paper', paperSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: { type: String, required: true }, // e.g., 'paper_status', 'event_alert'
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index for fast retrieval of notifications by user sorted by creation date
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

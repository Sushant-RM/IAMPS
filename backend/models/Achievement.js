const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    usn: {
      type: String,
      required: [true, 'USN is required'],
      uppercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'CIVIL', 'IT'],
    },
    achievementTitle: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Academic', 'Sports', 'Cultural', 'Technical', 'Research', 'Social Service', 'Other'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    certificateLink: {
      type: String,
      default: null,
    },
    achievementDate: {
      type: Date,
      required: [true, 'Achievement date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
achievementSchema.index({ department: 1, category: 1 });
achievementSchema.index({ usn: 1 });
achievementSchema.index({ status: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);

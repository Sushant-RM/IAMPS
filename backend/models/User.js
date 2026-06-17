const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin', 'hod', 'committee_member'],
        default: 'student'
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    bio: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    researchInterests: [{ type: String }],
    socialLinks: {
        linkedin: { type: String, default: '' },
        scholar: { type: String, default: '' },
        twitter: { type: String, default: '' },
        website: { type: String, default: '' }
    },
    skills: [{ type: String }],
    cgpa: { type: Number, min: 0, max: 10 },
    usn: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Compound index for common department+role queries (email and usn already indexed via unique:true)
userSchema.index({ departmentId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);

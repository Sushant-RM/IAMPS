const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const User = require('../models/User');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /stats - Admin Dashboard Stats
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        // RBAC: admin, faculty, hod, and committee_member
        if (!['admin', 'faculty', 'hod', 'committee_member'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // --- Run independent counts in parallel for speed ---
        const [total, approved, rejected, events] = await Promise.all([
            Paper.countDocuments({}),
            Paper.countDocuments({ status: { $in: ['approved', 'published'] } }),
            Paper.countDocuments({ status: 'rejected' }),
            Event.find({}, 'participants')
        ]);

        const pending = total - approved - rejected;
        const totalParticipants = events.reduce(
            (sum, ev) => sum + (ev.participants?.length ?? 0),
            0
        );

        // --- Single aggregation pipeline for all chart data ---
        const aggResult = await Paper.aggregate([
            { $match: { status: { $in: ['approved', 'published'] } } },
            {
                $facet: {
                    byDepartment: [
                        {
                            $lookup: {
                                from: 'departments',
                                localField: 'departmentId',
                                foreignField: '_id',
                                as: 'dept'
                            }
                        },
                        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: { $ifNull: ['$dept.name', 'Unassigned'] },
                                count: { $sum: 1 }
                            }
                        },
                        { $project: { _id: 0, name: '$_id', count: 1 } }
                    ],
                    byYear: [
                        {
                            $group: {
                                _id: { $ifNull: ['$year', { $year: '$createdAt' }] },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } },
                        { $project: { _id: 0, year: { $toString: '$_id' }, count: 1 } }
                    ],
                    byType: [
                        {
                            $group: {
                                _id: { $ifNull: ['$type', 'Other'] },
                                value: { $sum: 1 }
                            }
                        },
                        { $project: { _id: 0, name: '$_id', value: 1 } }
                    ]
                }
            }
        ]);

        const facets = aggResult[0] || {};

        res.json({
            total,
            approved,
            pending,
            rejected,
            totalParticipants,
            papersPerDept: facets.byDepartment || [],
            papersPerYear: facets.byYear || [],
            papersByType: facets.byType || []
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ message: 'Server error retrieving stats' });
    }
});

// GET /pending-papers - Admin and Faculty
router.get('/pending-papers', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('role departmentId');
        if (!user) return res.status(401).json({ message: 'User not found' });

        let query = {};

        // Reviewers can only see papers from their department
        if (['faculty', 'hod', 'committee_member'].includes(user.role)) {
            query.departmentId = user.departmentId;
            query.status = 'pending_faculty'; // Reviewers only see their stage
        } else if (user.role === 'admin') {
            query.status = 'pending_admin';
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        const papers = await Paper.find(query)
            .populate('submittedBy', 'fullName email')
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 });

        res.json(papers);
    } catch (err) {
        console.error('Pending papers error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /approve-paper/:id — Faculty or Admin
// ✅ Fixed: Faculty can only move paper to pending_admin (not directly to approved)
router.patch('/approve-paper/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('role departmentId');
        if (!user) return res.status(401).json({ message: 'User not found' });

        const paper = await Paper.findById(req.params.id).populate('departmentId');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        let nextStatus;

        if (['faculty', 'hod', 'committee_member'].includes(user.role)) {
            // Reviewers can only approve papers from their department at the faculty stage
            if (!paper.departmentId || paper.departmentId._id.toString() !== user.departmentId.toString()) {
                return res.status(403).json({ message: 'You can only approve papers from your department' });
            }
            if (paper.status !== 'pending_faculty') {
                return res.status(400).json({ message: `Paper is not at the faculty review stage (current: ${paper.status})` });
            }
            nextStatus = 'pending_admin'; // Reviewer moves paper UP to admin, not directly to approved
        } else if (user.role === 'admin') {
            if (paper.status !== 'pending_admin') {
                return res.status(400).json({ message: `Paper is not at the admin review stage (current: ${paper.status})` });
            }
            nextStatus = 'approved'; // Admin gives final approval
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        paper.status = nextStatus;
        paper.workflowLogs = paper.workflowLogs || [];
        paper.workflowLogs.push({
            stage: user.role,
            approverId: user._id,
            action: 'approve',
            comments: req.body.comments || '',
            timestamp: new Date()
        });
        await paper.save();

        // Notify the student
        await Notification.create({
            userId: paper.submittedBy,
            type: 'paper_status',
            title: nextStatus === 'approved' ? '🎉 Paper Approved & Published!' : '📋 Paper Forwarded for Admin Review',
            body: nextStatus === 'approved'
                ? `Your paper "${paper.title}" has been approved and published.`
                : `Your paper "${paper.title}" has been reviewed by faculty and is now pending admin approval.`,
        });

        res.json({ message: `Paper status updated to ${nextStatus}`, paper });
    } catch (err) {
        console.error('Approve paper error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /reject-paper/:id — Faculty or Admin
router.patch('/reject-paper/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('role departmentId');
        if (!user) return res.status(401).json({ message: 'User not found' });

        const paper = await Paper.findById(req.params.id).populate('departmentId');
        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        if (['faculty', 'hod', 'committee_member'].includes(user.role)) {
            if (!paper.departmentId || paper.departmentId._id.toString() !== user.departmentId.toString()) {
                return res.status(403).json({ message: 'You can only reject papers from your department' });
            }
        } else if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        paper.status = 'rejected';
        paper.workflowLogs = paper.workflowLogs || [];
        paper.workflowLogs.push({
            stage: user.role,
            approverId: user._id,
            action: 'reject',
            comments: req.body.comments || '',
            timestamp: new Date()
        });
        await paper.save();

        await Notification.create({
            userId: paper.submittedBy,
            type: 'paper_status',
            title: '❌ Paper Rejected',
            body: `Your paper "${paper.title}" has been rejected. ${req.body.comments ? 'Feedback: ' + req.body.comments : ''}`,
        });

        res.json({ message: 'Paper rejected', paper });
    } catch (err) {
        console.error('Reject paper error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /users - List all users (Admin only)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        const users = await User.find()
            .populate('departmentId', 'name code')
            .select('-passwordHash')
            .sort({ role: 1, fullName: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /user/:id - Update user role/department (Admin only)
router.patch('/user/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { role, departmentId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, departmentId: departmentId || null },
            { new: true, runValidators: true }
        ).populate('departmentId', 'name code').select('-passwordHash');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

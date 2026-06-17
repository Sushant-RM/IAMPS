const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Paper = require('../models/Paper');
const User = require('../models/User');
const { authMiddleware, adminOnly, validateObjectId } = require('../middleware/auth');

// GET / - List Departments with stats
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find().populate('hod', 'fullName email').sort({ name: 1 });

        // Query aggregated counts for all departments in just 2 queries
        const paperCounts = await Paper.aggregate([
            { $match: { status: { $in: ['approved', 'published'] } } },
            { $group: { _id: '$departmentId', count: { $sum: 1 } } }
        ]);

        const facultyCounts = await User.aggregate([
            { $match: { role: { $in: ['faculty', 'hod', 'committee_member'] } } },
            { $group: { _id: '$departmentId', count: { $sum: 1 } } }
        ]);

        // Map counts to a dictionary for O(1) lookup
        const paperCountMap = {};
        paperCounts.forEach(item => {
            if (item._id) paperCountMap[item._id.toString()] = item.count;
        });

        const facultyCountMap = {};
        facultyCounts.forEach(item => {
            if (item._id) facultyCountMap[item._id.toString()] = item.count;
        });

        const enhancedDepts = departments.map(dept => {
            const deptIdStr = dept._id.toString();
            return {
                ...dept.toObject(),
                paperCount: paperCountMap[deptIdStr] || 0,
                facultyCount: facultyCountMap[deptIdStr] || 0
            };
        });

        res.json(enhancedDepts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /:id/faculty - Get faculty for a department
router.get('/:id/faculty', validateObjectId('id'), async (req, res) => {
    try {
        const faculty = await User.find({
            departmentId: req.params.id,
            role: { $in: ['faculty', 'hod', 'committee_member'] }
        }).select('fullName email role');
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /:id - Update Department (Admin only)
router.put('/:id', authMiddleware, adminOnly, validateObjectId('id'), async (req, res) => {
    try {
        const { name, code, description, hod, establishedYear } = req.body;
        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            { name, code, description, hod: hod || null, establishedYear },
            { new: true }
        );
        res.json(dept);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST / - Create Department (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, code } = req.body;
        const dept = new Department({ name, code });
        await dept.save();
        res.status(201).json(dept);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /:id - Delete Department (Admin only)
router.delete('/:id', authMiddleware, adminOnly, validateObjectId('id'), async (req, res) => {
    try {
        const deptId = req.params.id;
        
        // 1. Delete the department
        const deletedDept = await Department.findByIdAndDelete(deptId);
        if (!deletedDept) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // 2. Cascade delete papers associated with this department (required field)
        await Paper.deleteMany({ departmentId: deptId });

        // 3. Update users in this department: set departmentId to undefined
        await User.updateMany({ departmentId: deptId }, { $unset: { departmentId: 1 } });

        res.json({ message: 'Department deleted successfully. Linked papers deleted and user references cleared.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');

// GET /papers
router.get('/papers', async (req, res) => {
    try {
        const { q, dept, year, type } = req.query;
        let query = { status: 'approved' };

        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { abstract: { $regex: q, $options: 'i' } },
                { authors: { $regex: q, $options: 'i' } }
            ];
        }

        if (dept) query.departmentId = dept;
        if (year) query.year = parseInt(year);
        if (type) query.type = type;

        const papers = await Paper.find(query)
            .populate('departmentId', 'name')
            .populate('submittedBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(papers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

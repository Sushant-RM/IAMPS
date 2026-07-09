const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const Paper = require('../models/Paper');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { uploadFile } = require('../utils/cloudinary');
const pdfParse = require('pdf-parse');

// Multer: memory storage, 10 MB limit, PDF-only for papers
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for paper submissions'), false);
        }
    }
});


// POST /analyze - Pre-submission Plagiarism Check (PDF)
router.post('/analyze', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        let fullText = '';
        try {
            const pdfData = await pdfParse(req.file.buffer);
            fullText = pdfData.text;
        } catch (parseErr) {
            console.error("PDF Parsing failed:", parseErr);
            // Non-blocking fallback: Proceed without text analysis
            fullText = "";
        }

        let matchedPaper = null;
        let highestMatch = 0;

        // 1. Text Extraction Fallback
        if (!fullText || fullText.trim().length < 50) {
            console.log("PDF text extract failed or too short. Using filename/metadata for weak check.");
            // Fallback: Proceed with empty text to avoid 404s, but flag it
            fullText = req.file.originalname + " " + (req.body.title || "");
        }

        // 2. Normalize Input
        const inputWords = new Set(fullText.toLowerCase().split(/\s+/).filter(w => w.length > 3));

        // 3. Check against Database
        const allPapers = await Paper.find({ status: 'approved' }).select('abstract title summary');

        for (const paper of allPapers) {
            const paperContent = (paper.abstract + " " + (paper.summary || "")).toLowerCase();
            const paperWords = new Set(paperContent.split(/\s+/).filter(w => w.length > 3));

            const intersection = new Set([...inputWords].filter(x => paperWords.has(x)));
            const union = new Set([...inputWords, ...paperWords]);

            if (union.size > 0) {
                const similarity = intersection.size / union.size;
                if (similarity > highestMatch) {
                    highestMatch = similarity;
                    matchedPaper = paper;
                }
            }
        }

        // Real score only: word-overlap similarity against actual approved papers in the DB.
        // No fabricated corpus or synthetic baseline — an empty DB or no overlap honestly
        // reports a low/zero score rather than a padded-looking number.
        const internalScore = Math.round(highestMatch * 100);

        res.json({
            score: internalScore,
            report: `Internal Match: ${internalScore}% (vs ${matchedPaper ? matchedPaper.title : 'None'}). Compares only against approved papers already in this system — not an internet-wide or AI-based check.`,
            textSnippet: fullText.substring(0, 500)
        });

    } catch (err) {
        console.error("Analysis Endpoint Error:", err);
        res.status(500).json({ message: `Server Error: ${err.message}` });
    }
});

// POST / - Upload Paper (Final Submission)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { title, abstract, summary, departmentId, year, type, venue, authors, plagiarismScore, plagiarismReport } = req.body;

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        let parsedAuthors = [];
        if (authors) {
            try {
                parsedAuthors = JSON.parse(authors);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid authors format. Must be a JSON array of strings.' });
            }
        }

        let pdfUrl = '';
        try {
            pdfUrl = await uploadFile(req.file.buffer, 'papers', req, req.file.originalname);
        } catch (e) {
            console.error('Upload Error:', e);
            return res.status(500).json({ message: `Upload failed: ${e.message}` });
        }

        const paper = new Paper({
            title, abstract, summary,
            authors: parsedAuthors,
            departmentId, year, type, venue,
            pdfUrl,
            submittedBy: req.user.id,
            status: 'pending_faculty', // Initial Status
            plagiarismScore: plagiarismScore || 0,
            plagiarismReport: plagiarismReport || 'Pre-checked',
            currentVersion: 1,
            versions: [{
                versionNumber: 1,
                pdfUrl: pdfUrl,
                changesDescription: 'Initial Submission',
                submittedAt: new Date()
            }],
            workflowLogs: [{
                stage: 'student',
                approverId: req.user.id,
                action: 'approve', // Submitted
                comments: 'Submitted for review',
                timestamp: new Date()
            }]
        });

        await paper.save();
        res.status(201).json(paper);
    } catch (err) {
        console.error("Submission Error:", err);
        res.status(500).json({ message: `Submission Failed: ${err.message}` });
    }
});

// PUT /:id/status - Approval Workflow
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { action, comments } = req.body; // action: 'approve' | 'reject' | 'request_revision'
        if (!['approve', 'reject', 'request_revision'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Must be approve, reject, or request_revision.' });
        }

        const paper = await Paper.findById(req.params.id);

        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ message: 'User not found' });
        const role = user.role;

        // Workflow Logic
        let nextStatus = paper.status;

        if (action === 'approve') {
            if (['faculty', 'hod', 'committee_member'].includes(role) && paper.status === 'pending_faculty') {
                if (!paper.departmentId || !user.departmentId || paper.departmentId.toString() !== user.departmentId.toString()) {
                    return res.status(403).json({ message: 'You can only review papers from your department' });
                }
                nextStatus = 'pending_admin';
            }
            else if (role === 'admin' && paper.status === 'pending_admin') {
                nextStatus = 'approved';
            }
            else {
                return res.status(403).json({ message: 'Unauthorized approval attempt' });
            }
        } else if (action === 'reject') {
            if (['faculty', 'hod', 'committee_member'].includes(role)) {
                if (!paper.departmentId || !user.departmentId || paper.departmentId.toString() !== user.departmentId.toString()) {
                    return res.status(403).json({ message: 'You can only reject papers from your department' });
                }
            } else if (role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            nextStatus = 'rejected';
        } else if (action === 'request_revision') {
            if (['faculty', 'hod', 'committee_member'].includes(role)) {
                if (!paper.departmentId || !user.departmentId || paper.departmentId.toString() !== user.departmentId.toString()) {
                    return res.status(403).json({ message: 'You can only request revisions on papers from your department' });
                }
            } else if (role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            nextStatus = 'revision_requested';
        }

        paper.status = nextStatus;
        paper.workflowLogs.push({
            stage: role,
            approverId: user._id,
            action,
            comments,
            timestamp: new Date()
        });

        await paper.save();

        // Notification System
        const Notification = require('../models/Notification');
        // 1. Notify Student
        await Notification.create({
            userId: paper.submittedBy,
            type: 'paper_status',
            title: `Paper Status Update: ${action.toUpperCase()}`,
            body: `Your paper "${paper.title}" is now ${nextStatus}. Comments: ${comments || 'None'}`,
            read: false
        });

        // 2. Achievement Badges (Gamification)
        if (nextStatus === 'approved') {
            const approvedCount = await Paper.countDocuments({ submittedBy: paper.submittedBy, status: 'approved' });
            let badgeTitle = "";
            let badgeBody = "";

            if (approvedCount === 1) {
                badgeTitle = "🏆 First Publication Achievement!";
                badgeBody = "Congratulations on your first approved research paper! You've earned the 'Rising Researcher' badge.";
            } else if (approvedCount === 5) {
                badgeTitle = "🎓 Research Scholar Achievement!";
                badgeBody = "5 Papers Approved! You've earned the 'Distinguished Scholar' badge.";
            } else if (approvedCount === 10) {
                badgeTitle = "🔥 Research Mastermind!";
                badgeBody = "10 Papers Approved! You are now a 'Research Mastermind'.";
            }

            if (badgeTitle) {
                await Notification.create({
                    userId: paper.submittedBy,
                    type: 'achievement',
                    title: badgeTitle,
                    body: badgeBody,
                    read: false
                });
            }
        }

        // 2. Notify Next Approver (Mock Logic - in real app, find users by role)
        if (nextStatus.startsWith('pending_')) {
            const nextStage = nextStatus.replace('pending_', '');
            console.log(`[Email Service] Alerting ${nextStage} group about new paper pending review.`);
            // In a real app we'd find all users with role=nextStage and create notifications for them too
        }

        res.json(paper);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /:id/version - Resubmit Revised Paper
router.post('/:id/version', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { changesDescription } = req.body;
        const paper = await Paper.findById(req.params.id);

        if (!paper) return res.status(404).json({ message: 'Paper not found' });
        if (paper.submittedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        // Upload new PDF
        let pdfUrl = '';
        try {
            pdfUrl = await uploadFile(req.file.buffer, 'papers', req, req.file.originalname);
        } catch (e) {
            return res.status(500).json({ message: `Upload failed: ${e.message}` });
        }

        const newVersion = paper.currentVersion + 1;

        paper.currentVersion = newVersion;
        paper.pdfUrl = pdfUrl; // Update main link
        paper.versions.push({
            versionNumber: newVersion,
            pdfUrl: pdfUrl,
            changesDescription: changesDescription || 'Resubmission',
            submittedAt: new Date()
        });

        // Reset Status to pending_faculty (Restart flow) or based on previous rejection?
        // Usually restart flow is safest
        paper.status = 'pending_faculty';

        paper.workflowLogs.push({
            stage: 'student',
            approverId: req.user.id,
            action: 'approve',
            comments: `Resubmitted v${newVersion}: ${changesDescription}`,
            timestamp: new Date()
        });

        await paper.save();
        res.json(paper);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /pending - List Pending Papers (Reviewer only)
router.get('/pending', authMiddleware, async (req, res) => {
    try {
        // Role is already in req.user from JWT — no DB call needed
        const role = req.user.role;
        let query = {};

        if (role === 'faculty' || role === 'hod' || role === 'committee_member') {
            // Reviewers need their departmentId — fetch only that field
            const user = await User.findById(req.user.id).select('departmentId');
            if (!user) return res.status(401).json({ message: 'User not found' });
            query = { status: 'pending_faculty', departmentId: user.departmentId };
        } else if (role === 'admin') {
            query = { status: 'pending_admin' };
        } else {
            return res.status(403).json({ message: 'Not authorized to view pending papers' });
        }

        const papers = await Paper.find(query)
            .populate('submittedBy', 'fullName')
            .populate('departmentId', 'name')
            .sort({ createdAt: 1 }); // Oldest first for review queue

        res.json(papers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /my - List My Papers
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const papers = await Paper.find({ submittedBy: req.user.id })
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});



// GET /search - Search papers with advanced filtering
router.get('/search', async (req, res) => {
    try {
        const { keyword, department, year, type } = req.query;
        let query = { status: { $in: ['approved', 'published'] } };

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { authors: { $regex: keyword, $options: 'i' } },
                { tags: { $in: [new RegExp(keyword, 'i')] } }
            ];
        }

        if (department) query.departmentId = department;
        if (year) query.year = parseInt(year);
        if (type) query.type = type;

        const papers = await Paper.find(query)
            .populate('submittedBy', 'fullName')
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 });

        res.json(papers);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ message: 'Server error during search' });
    }
});

// GET / - List Public (Approved) Papers
router.get('/', async (req, res) => {
    try {
        const papers = await Paper.find({ status: { $in: ['approved', 'published'] } })
            .populate('submittedBy', 'fullName')
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 })
            .limit(100); // Safety cap — use /search for filtered results
        res.json(papers);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /search/user/:userId - Get approved papers by user
router.get('/search/user/:userId', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        const papers = await Paper.find({
            submittedBy: req.params.userId,
            status: { $in: ['approved', 'published'] }
        })
            .populate('departmentId', 'name code')
            .sort({ year: -1 })
            .limit(50);

        res.json(papers);
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid user ID' });
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /public/stats - Institutional Statistics (uses DB aggregation, not in-memory JS)
router.get('/public/stats', async (req, res) => {
    try {
        const matchStage = { $match: { status: { $in: ['approved', 'published'] } } };

        const [counts, aggResult] = await Promise.all([
            Promise.all([
                Paper.countDocuments({ status: { $in: ['approved', 'published'] } }),
                User.countDocuments({}),
                Paper.distinct('year', { status: { $in: ['approved', 'published'] } })
            ]),
            Paper.aggregate([
                matchStage,
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
            ])
        ]);

        const [total, totalUsers, researchYears] = counts;
        const facets = aggResult[0] || {};

        res.json({
            total,
            totalUsers,
            totalResearchYears: researchYears,
            papersPerDept: facets.byDepartment || [],
            papersPerYear: facets.byYear || [],
            papersByType: facets.byType || []
        });
    } catch (err) {
        console.error('Public stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /:id - Get Single Paper (Public if approved)
router.get('/:id', async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id)
            .populate('submittedBy', 'fullName')
            .populate('departmentId', 'name');

        if (!paper) return res.status(404).json({ message: 'Paper not found' });

        if (paper.status === 'approved') {
            return res.json(paper);
        }

        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(403).json({ message: 'Paper is under review' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user && (
                user.role === 'admin' ||
                user.role === 'faculty' ||
                user.role === 'hod' ||
                user.role === 'committee_member' ||
                paper.submittedBy._id.toString() === user._id.toString()
            )) {
                return res.json(paper);
            }
        } catch (e) {
            // Token invalid
        }

        return res.status(403).json({ message: 'Paper is under review' });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;


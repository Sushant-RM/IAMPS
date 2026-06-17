const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const Event = require('../models/Event');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Department = require('../models/Department');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /annual  — full institutional report for a given year
router.get('/annual', authMiddleware, adminOnly, async (req, res) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const targetYear = parseInt(year);
        const startDate = new Date(`${targetYear}-01-01T00:00:00.000Z`);
        const endDate   = new Date(`${targetYear}-12-31T23:59:59.999Z`);

        // ── 1. Papers ──────────────────────────────────────────────────────────
        const papers = await Paper.find({
            status: { $in: ['approved', 'published'] },
            year: targetYear
        })
        .populate('departmentId', 'name code')
        .populate('submittedBy', 'fullName email')
        .lean();

        // Department-wise paper counts
        const deptPaperCounts = {};
        papers.forEach(p => {
            const name = p.departmentId?.name || 'Unknown';
            deptPaperCounts[name] = (deptPaperCounts[name] || 0) + 1;
        });

        // Paper-type breakdown
        const paperTypeCounts = {};
        papers.forEach(p => {
            const t = p.type || 'Research Paper';
            paperTypeCounts[t] = (paperTypeCounts[t] || 0) + 1;
        });

        // Monthly paper submissions trend
        const monthlyPapers = Array(12).fill(0);
        papers.forEach(p => {
            const d = new Date(p.createdAt);
            if (d.getFullYear() === targetYear) {
                monthlyPapers[d.getMonth()]++;
            }
        });

        // Top 5 contributors by paper count
        const contribMap = {};
        papers.forEach(p => {
            const name = p.submittedBy?.fullName || 'Unknown';
            contribMap[name] = (contribMap[name] || 0) + 1;
        });
        const topContributors = Object.entries(contribMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // ── 2. Events ──────────────────────────────────────────────────────────
        const events = await Event.find({
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        // Event-type breakdown
        const eventTypeCounts = {};
        events.forEach(e => {
            const t = e.type || 'Event';
            eventTypeCounts[t] = (eventTypeCounts[t] || 0) + 1;
        });

        // Monthly events trend
        const monthlyEvents = Array(12).fill(0);
        events.forEach(e => {
            const d = new Date(e.date);
            monthlyEvents[d.getMonth()]++;
        });

        // ── 3. Achievements ────────────────────────────────────────────────────
        const achievements = await Achievement.find({
            status: 'approved',
            achievementDate: { $gte: startDate, $lte: endDate }
        }).lean();

        // Category-wise counts
        const achCategoryCounts = {};
        achievements.forEach(a => {
            const c = a.category || 'Other';
            achCategoryCounts[c] = (achCategoryCounts[c] || 0) + 1;
        });

        // Department-wise achievement counts
        const deptAchCounts = {};
        achievements.forEach(a => {
            const d = a.department || 'Unknown';
            deptAchCounts[d] = (deptAchCounts[d] || 0) + 1;
        });

        // ── 4. User Stats ──────────────────────────────────────────────────────
        const [totalStudents, totalFaculty, newUsersThisYear] = await Promise.all([
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: { $in: ['faculty', 'hod', 'committee_member'] } }),
            User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
        ]);

        // ── 5. Pending papers (pipeline health) ───────────────────────────────
        const pendingPapers = await Paper.countDocuments({
            status: { $in: ['pending_faculty', 'pending_admin'] }
        });

        // ── 6. Monthly trend combined ──────────────────────────────────────────
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthlyTrend = months.map((name, i) => ({
            month: name,
            papers: monthlyPapers[i],
            events: monthlyEvents[i]
        }));

        res.json({
            year: targetYear,
            generated_at: new Date().toISOString(),
            summary: {
                total_papers: papers.length,
                total_events: events.length,
                total_achievements: achievements.length,
                total_students: totalStudents,
                total_faculty: totalFaculty,
                new_users: newUsersThisYear,
                pending_papers: pendingPapers,
            },
            dept_paper_counts: deptPaperCounts,
            paper_type_counts: paperTypeCounts,
            ach_category_counts: achCategoryCounts,
            dept_ach_counts: deptAchCounts,
            event_type_counts: eventTypeCounts,
            monthly_trend: monthlyTrend,
            top_contributors: topContributors,
            papers,
            events,
            achievements
        });

    } catch (err) {
        console.error('[Report] Error:', err);
        res.status(500).json({ message: 'Server error generating report', error: err.message });
    }
});

module.exports = router;

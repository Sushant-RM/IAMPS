const express = require('express');
const router = express.Router();
const multer = require('multer');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { uploadFile } = require('../utils/cloudinary');

// Multer: 5 MB limit, accept PDF and images for certificates
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF or image files (JPEG, PNG) are accepted for certificates'), false);
        }
    }
});

// GET / - List Public Events
router.get('/', async (req, res) => {
    try {
        // Retrieve upcoming events
        // const today = new Date();
        // today.setHours(0,0,0,0);
        // { date: { $gte: today } }
        const events = await Event.find({ status: { $ne: 'rejected' } }).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /create - Admin Create Event
router.post('/create', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        // Only admin can create institution-level events (auto-approved)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create institutional events' });
        }

        const { title, type, date, time, venue, organizer, description, maxParticipants } = req.body;

        // Simple banner upload
        let imageUrl = '';
        if (req.file) {
            try {
                imageUrl = await uploadFile(req.file.buffer, 'events', req, req.file.originalname);
            } catch (e) { console.error('Image upload failed', e); }
        }

        const newEvent = new Event({
            userId: req.user.id,
            title, type, date, time, venue, organizer, description,
            maxParticipants: maxParticipants || 100,
            imageUrl,
            status: 'approved', // Admin created = auto approved
            participants: [] // Stores user IDs
        });

        await newEvent.save();
        res.status(201).json(newEvent);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating event' });
    }
});

// POST /:id/rsvp - User RSVP
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.participants.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already registered' });
        }

        event.participants.push(req.user.id);
        await event.save();

        // Notification
        await Notification.create({
            userId: req.user.id,
            type: 'event_rsvp',
            title: 'Event Registration Confirmed',
            body: `You are registered for ${event.title} on ${new Date(event.date).toLocaleDateString()}.`,
            read: false
        });

        res.json({ message: 'RSVP Successful', event });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});


// POST /participate - Submit Certificate/Participation Proof (Existing functionality rename or keep)
// The user request "Event Submission Form" implies submitting participation proofs OR creating events?
// "Event submission form working, Certificate upload verification" -> Implies submitting PROOF of participation in external events.
// So we keep POST / (maybe rename to /submit-proof to avoid conflict, but separate router paths handle it).
// Wait, I used POST /create for Admin. so POST / can stay for student submission.

router.post('/', authMiddleware, upload.single('certificate'), async (req, res) => {
    try {
        const { title, type, organizer, date, venue, teamMembers, outcome, description } = req.body;

        let parsedTeamMembers = [];
        if (teamMembers) {
            try {
                parsedTeamMembers = JSON.parse(teamMembers);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid format for teamMembers. Must be JSON array of strings.' });
            }
        }

        let certificateUrl = req.body.certificateUrl || '';
        if (req.file) {
            try {
                certificateUrl = await uploadFile(req.file.buffer, 'events_certificates', req, req.file.originalname);
            } catch (e) {
                console.error('Certificate upload failed', e);
            }
        }

        const event = new Event({
            userId: req.user.id,
            title, type, organizer, date, venue,
            teamMembers: parsedTeamMembers,
            outcome, description, certificateUrl,
            status: 'pending'
        });

        await event.save();
        res.status(201).json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /my - List My Submitted Proofs
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /pending - List Pending Approvals (Faculty/Admin only)
router.get('/pending', authMiddleware, async (req, res) => {
    try {
        if (!['admin', 'faculty', 'hod', 'committee_member'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: staff or admin role required' });
        }
        const events = await Event.find({ status: 'pending' })
            .populate('userId', 'fullName departmentId')
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /:id/status - Approve/Reject Proof
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (!['admin', 'faculty', 'hod', 'committee_member'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Admin or staff access required' });
        }
        
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value. Must be approved or rejected.' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.status = status;
        await event.save();
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

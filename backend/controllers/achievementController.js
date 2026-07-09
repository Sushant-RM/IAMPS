const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');

// @desc    Create a new achievement
// @route   POST /api/achievements
// @access  Private
exports.createAchievement = async (req, res) => {
  try {
    const { studentName, usn, department, achievementTitle, category, description, achievementDate, certificateLink } = req.body;

    // Fetch user details for security & verification
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Authenticated user not found' });
    }

    // Auto-fill studentName and usn from logged-in user profile, if available
    const finalStudentName = user.fullName || studentName;
    const finalUsn = (user.usn || usn || '').toUpperCase();

    // Validation
    if (!finalStudentName || !finalUsn || !department || !achievementTitle || !category || !description || !achievementDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const achievement = await Achievement.create({
      studentName: finalStudentName,
      usn: finalUsn,
      department,
      achievementTitle,
      category,
      description,
      achievementDate,
      certificateLink: certificateLink || null,
      status: 'pending',
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: achievement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Public
exports.getAllAchievements = async (req, res) => {
  try {
    const { status, category, department } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (department) filter.department = department;

    const achievements = await Achievement.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get achievement by ID
// @route   GET /api/achievements/:id
// @access  Public
exports.getAchievementById = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id).populate('approvedBy', 'fullName email');

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get achievements by USN
// @route   GET /api/achievements/usn/:usn
// @access  Public
exports.getAchievementsByUSN = async (req, res) => {
  try {
    const achievements = await Achievement.find({ usn: req.params.usn.toUpperCase() }).sort({ createdAt: -1 });

    if (!achievements.length) {
      return res.status(404).json({
        success: false,
        message: 'No achievements found for this USN',
      });
    }

    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update achievement
// @route   PUT /api/achievements/:id
// @access  Private
exports.updateAchievement = async (req, res) => {
  try {
    const { studentName, usn, department, achievementTitle, category, description, achievementDate, certificateLink } = req.body;

    let achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    // Check ownership: only creator or admin can update
    if (achievement.userId && achievement.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify this achievement',
      });
    }

    // Update fields
    if (studentName) achievement.studentName = studentName;
    if (usn) achievement.usn = usn.toUpperCase();
    if (department) achievement.department = department;
    if (achievementTitle) achievement.achievementTitle = achievementTitle;
    if (category) achievement.category = category;
    if (description) achievement.description = description;
    if (achievementDate) achievement.achievementDate = achievementDate;
    if (certificateLink !== undefined) achievement.certificateLink = certificateLink;

    achievement.updatedAt = Date.now();
    achievement = await achievement.save();

    res.status(200).json({
      success: true,
      message: 'Achievement updated successfully',
      data: achievement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete achievement
// @route   DELETE /api/achievements/:id
// @access  Private
exports.deleteAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    // Check ownership: only creator or admin can delete
    if (achievement.userId && achievement.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete this achievement',
      });
    }

    await Achievement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Achievement deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve achievement
// @route   PUT /api/achievements/:id/approve
// @access  Private (Admin)
exports.approveAchievement = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    // Role verification
    let isAuthorized = false;
    if (req.user.role === 'admin') {
      isAuthorized = true;
    } else if (req.user.role === 'hod') {
      const user = await User.findById(req.user.id).select('departmentId');
      if (user && user.departmentId) {
        const dept = await Department.findById(user.departmentId);
        if (dept && dept.code === achievement.department) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin or matching HOD access required' });
    }

    achievement.status = 'approved';
    achievement.approvedBy = req.user.id;
    achievement.updatedAt = Date.now();
    await achievement.save();

    if (achievement.userId) {
      await Notification.create({
        userId: achievement.userId,
        type: 'achievement_status',
        title: 'Achievement Approved',
        body: `Your achievement "${achievement.achievementTitle}" has been approved.`,
        read: false,
      });
    }

    const populated = await Achievement.findById(achievement._id).populate('approvedBy', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Achievement approved successfully',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reject achievement
// @route   PUT /api/achievements/:id/reject
// @access  Private (Admin/HOD)
exports.rejectAchievement = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    // Role verification
    let isAuthorized = false;
    if (req.user.role === 'admin') {
      isAuthorized = true;
    } else if (req.user.role === 'hod') {
      const user = await User.findById(req.user.id).select('departmentId');
      if (user && user.departmentId) {
        const dept = await Department.findById(user.departmentId);
        if (dept && dept.code === achievement.department) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin or matching HOD access required' });
    }

    achievement.status = 'rejected';
    achievement.rejectionReason = rejectionReason;
    achievement.updatedAt = Date.now();
    await achievement.save();

    if (achievement.userId) {
      await Notification.create({
        userId: achievement.userId,
        type: 'achievement_status',
        title: 'Achievement Rejected',
        body: `Your achievement "${achievement.achievementTitle}" was rejected. Reason: ${rejectionReason}`,
        read: false,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Achievement rejected',
      data: achievement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/achievements/stats/dashboard
// @access  Public
exports.getDashboardStats = async (req, res) => {
  try {
    const totalAchievements = await Achievement.countDocuments();
    const approvedCount = await Achievement.countDocuments({ status: 'approved' });
    const pendingCount = await Achievement.countDocuments({ status: 'pending' });
    const rejectedCount = await Achievement.countDocuments({ status: 'rejected' });

    const categoryStats = await Achievement.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const departmentStats = await Achievement.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAchievements,
        approvedCount,
        pendingCount,
        rejectedCount,
        categoryStats,
        departmentStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

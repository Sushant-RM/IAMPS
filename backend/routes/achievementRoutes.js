const express = require('express');
const router = express.Router();
const {
  createAchievement,
  getAllAchievements,
  getAchievementById,
  getAchievementsByUSN,
  updateAchievement,
  deleteAchievement,
  approveAchievement,
  rejectAchievement,
  getDashboardStats,
} = require('../controllers/achievementController');
const { authMiddleware, adminOnly, validateObjectId } = require('../middleware/auth');

// Public routes
router.get('/', getAllAchievements);
router.get('/stats/dashboard', getDashboardStats);
router.get('/:id', validateObjectId('id'), getAchievementById);
router.get('/usn/:usn', getAchievementsByUSN);

// Private routes (require authentication)
router.post('/', authMiddleware, createAchievement);
router.put('/:id', authMiddleware, validateObjectId('id'), updateAchievement);
router.delete('/:id', authMiddleware, validateObjectId('id'), deleteAchievement);

// Admin/HOD routes (approval system)
router.put('/:id/approve', authMiddleware, validateObjectId('id'), approveAchievement);
router.put('/:id/reject', authMiddleware, validateObjectId('id'), rejectAchievement);

module.exports = router;

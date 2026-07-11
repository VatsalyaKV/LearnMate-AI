const express = require('express');
const router = express.Router();
const { createGoal, getGoals, getGoal, updateGoal, deleteGoal, updateMilestone } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getGoals).post(createGoal);
router.route('/:id').get(getGoal).put(updateGoal).delete(deleteGoal);
router.put('/:id/milestone', updateMilestone);

module.exports = router;

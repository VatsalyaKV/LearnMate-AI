const express = require('express');
const router = express.Router();
const { createRoadmap, getRoadmaps, getRoadmap, updateProgress, adaptRoadmap, deleteRoadmap } = require('../controllers/roadmapController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getRoadmaps).post(createRoadmap);
router.route('/:id').get(getRoadmap).delete(deleteRoadmap);
router.put('/:id/progress', updateProgress);
router.post('/:id/adapt', adaptRoadmap);

module.exports = router;
